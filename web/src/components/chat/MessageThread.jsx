import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CloudOff,
  MessageCircle,
  PanelRight,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import Avatar from '@/components/common/Avatar'
import EmptyState from '@/components/common/EmptyState'
import { TypingBubble } from '@/components/common/TypingBubble'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import Composer from './Composer'
import MessageBubble from './MessageBubble'
import { MessageThreadSkeleton } from './MessageThreadSkeleton'
import { useMe } from '@/hooks/useAuth'
import { useChats } from '@/hooks/useChats'
import { useDeleteMessage, useMessages, useSendMessage } from '@/hooks/useMessages'
import { formatDayLabel, parseDate } from '@/lib/format'
import { fadeUp, transitions } from '@/lib/motion'
import { emitTyping, setActiveChat, useSocketStore } from '@/lib/socket'
import { hasParticipant } from '@/lib/types'
import { useConnectionStatus } from '@/lib/useConnectionStatus'
import { useEscapeLayer } from '@/lib/useEscapeLayer'

/** Silence after the last keystroke before the other side stops seeing "typing...". */
const TYPING_IDLE_MS = 2000
/** Consecutive messages from one sender closer than this share a group. */
const GROUP_GAP_MS = 5 * 60 * 1000
/** How close to the bottom still counts as "following" the conversation. */
const NEAR_BOTTOM_PX = 120

const senderIdOf = (message) => (typeof message.sender === 'string' ? message.sender : message.sender?._id)
const dayKeyOf = (iso) => parseDate(iso)?.toDateString() ?? ''

const belongTogether = (a, b) => {
  if (!a || !b || senderIdOf(a) !== senderIdOf(b)) return false
  if (dayKeyOf(a.createdAt) !== dayKeyOf(b.createdAt)) return false
  const gap = Math.abs((parseDate(b.createdAt)?.getTime() ?? 0) - (parseDate(a.createdAt)?.getTime() ?? 0))
  return gap < GROUP_GAP_MS
}

const DaySeparator = ({ label }) => (
  <div className="sticky top-2 z-10 my-4 flex justify-center first:mt-0">
    <span className="rounded-full border border-line bg-panel px-2.5 py-1 text-meta font-medium text-fg-3">
      {label}
    </span>
  </div>
)

const ThreadSearchBar = ({ query, onQueryChange, matchCount, position, onStep, onClose }) => {
  useEscapeLayer(onClose)

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={transitions.base}
      className="shrink-0 overflow-hidden border-b border-line bg-canvas"
    >
      <div className="mx-auto flex h-12 w-full max-w-205 items-center gap-2 px-4 md:px-8">
        <Search size={15} className="shrink-0 text-fg-4" aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            onStep(event.shiftKey ? -1 : 1)
          }}
          placeholder="Search in conversation"
          aria-label="Search in conversation"
          className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-4 pointer-coarse:text-[16px]"
        />
        {query.trim() ? (
          <span className="shrink-0 text-meta tabular-nums text-fg-3" aria-live="polite">
            {matchCount ? `${position} of ${matchCount}` : 'No results'}
          </span>
        ) : null}
        <IconButton icon={ChevronUp} label="Older match" size="sm" tooltip={false} disabled={!matchCount} onClick={() => onStep(1)} />
        <IconButton icon={ChevronDown} label="Newer match" size="sm" tooltip={false} disabled={!matchCount} onClick={() => onStep(-1)} />
        <IconButton icon={X} label="Close search" size="sm" tooltip={false} onClick={onClose} />
      </div>
    </motion.div>
  )
}

const MessageThread = ({ chatId, detailsOpen, onToggleDetails }) => {
  const navigate = useNavigate()
  const { data: chats, isLoading: isLoadingChats } = useChats()
  const { data: me } = useMe()
  const { data: messages, isLoading, error, refetch } = useMessages(chatId)
  const sendMessage = useSendMessage(chatId)
  const deleteMessage = useDeleteMessage(chatId)
  const { onlineUsers, typingUsers, isConnected } = useSocketStore()

  const chat = useMemo(() => chats?.find((c) => c._id === chatId), [chats, chatId])
  const participant = chat && hasParticipant(chat) ? chat.participant : null
  const isSelfChat = Boolean(chat?.isSelf)
  const isOnline = !isSelfChat && participant && onlineUsers.has(participant._id)
  const isParticipantTyping =
    !isSelfChat && participant && typingUsers.get(chatId) === participant._id
  const firstName = participant?.name?.split(' ')[0] || participant?.name

  const [draft, setDraft] = useState('')
  const isTyping = useRef(false)
  const idleTimer = useRef(null)

  const connection = useConnectionStatus()

  // Joining the room is what makes the server deliver this chat's messages
  // live; leaving on unmount also clears the chat's unread dot.
  useEffect(() => {
    if (!chatId) return undefined
    setActiveChat(chatId)
    return () => setActiveChat(null)
  }, [chatId])

  const isMine = useCallback(
    (message) => {
      if (isSelfChat) return true
      const senderId = senderIdOf(message)
      // Before /auth/me resolves, fall back to the one thing already known:
      // in a 1:1 chat, anyone who is not the participant is me.
      return me ? senderId === me._id : senderId !== participant?._id
    },
    [isSelfChat, me, participant],
  )

  /* ---------------------------------------------------------------- scroll */

  const scrollRef = useRef(null)
  const isNearBottom = useRef(true)
  const renderedCount = useRef(0)
  // Message count when the reader scrolled away from the bottom; null while
  // they're following along.
  const [awayFrom, setAwayFrom] = useState(null)

  const handleScroll = () => {
    const el = scrollRef.current
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
    isNearBottom.current = near
    if (near && awayFrom !== null) setAwayFrom(null)
    else if (!near && awayFrom === null) setAwayFrom(messages?.length ?? 0)
  }

  const scrollToBottom = () => {
    const el = scrollRef.current
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  // Open at the latest message instantly; afterwards follow new messages
  // only while the reader is at the bottom (or just sent one themselves),
  // so scrolling back through history isn't yanked away.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !messages) return
    const previousCount = renderedCount.current
    renderedCount.current = messages.length
    if (previousCount === 0) {
      el.scrollTop = el.scrollHeight
      return
    }
    if (messages.length <= previousCount) return
    if (isNearBottom.current || isMine(messages[messages.length - 1])) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isMine])

  useEffect(() => {
    const el = scrollRef.current
    if (isParticipantTyping && el && isNearBottom.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [isParticipantTyping])

  const hasNewBelow = awayFrom !== null && (messages?.length ?? 0) > awayFrom

  /* ---------------------------------------------------------------- search */

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // 0 is the newest match; stepping "older" walks up the thread.
  const [matchFromEnd, setMatchFromEnd] = useState(0)
  const normalizedSearch = searchOpen ? searchQuery.trim().toLowerCase() : ''

  const matchIds = useMemo(() => {
    if (!normalizedSearch || !messages) return []
    return messages
      .filter((message) => !message.isDeleted && message.text?.toLowerCase().includes(normalizedSearch))
      .map((message) => message._id)
  }, [messages, normalizedSearch])

  const matchOffset = matchIds.length ? matchFromEnd % matchIds.length : 0
  const activeMatchId = matchIds.length ? matchIds[matchIds.length - 1 - matchOffset] : null

  useEffect(() => {
    if (!activeMatchId) return
    document.getElementById(`msg-${activeMatchId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeMatchId])

  const stepMatch = (direction) => {
    if (!matchIds.length) return
    setMatchFromEnd((current) => (current + direction + matchIds.length) % matchIds.length)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setMatchFromEnd(0)
  }

  /* ---------------------------------------------------------------- typing */

  // One "typing" event per burst rather than one per keystroke: `isTyping`
  // tracks what the other side has already been told, and the timer is what
  // retracts it once the keystrokes stop.
  const stopTyping = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current)
      idleTimer.current = null
    }
    if (!isTyping.current) return
    isTyping.current = false
    if (chatId) emitTyping(chatId, false)
  }, [chatId])

  // Leaving the screen mid-sentence would otherwise strand the indicator on
  // the other device until its own expiry timer fired.
  useEffect(() => stopTyping, [stopTyping])

  const handleDraftChange = (text) => {
    setDraft(text)
    if (!chatId || isSelfChat) return

    if (!isTyping.current) {
      isTyping.current = true
      emitTyping(chatId, true)
    }

    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS)
  }

  const handleSend = () => {
    if (sendMessage(draft)) {
      setDraft('')
      stopTyping()
    }
  }

  const canSend = draft.trim().length > 0 && isConnected

  /* ------------------------------------------------------------- grouping */

  const items = useMemo(() => {
    const list = messages ?? []
    const result = []
    list.forEach((message, index) => {
      const previous = list[index - 1]
      const dayKey = dayKeyOf(message.createdAt)
      if (!previous || dayKeyOf(previous.createdAt) !== dayKey) {
        result.push({ type: 'day', key: `day-${dayKey}-${message._id}`, label: formatDayLabel(message.createdAt) })
      }
      result.push({
        type: 'message',
        key: message._id,
        message,
        isFirstInGroup: !belongTogether(previous, message),
        isLastInGroup: !belongTogether(message, list[index + 1]),
      })
    })
    return result
  }, [messages])

  /* --------------------------------------------------------------- render */

  if (!chat) {
    if (isLoadingChats) {
      // Header-shaped placeholder too, so nothing jumps when the chat lands.
      return (
        <div className="flex h-full min-w-0 flex-1 flex-col" role="status" aria-label="Loading conversation">
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
            <div className="animate-breathe size-8.5 rounded-full bg-active" />
            <div className="animate-breathe space-y-1.5">
              <div className="h-2.5 w-28 rounded-full bg-active" />
              <div className="h-2 w-16 rounded-full bg-hover" />
            </div>
          </div>
          <MessageThreadSkeleton />
        </div>
      )
    }
    return (
      <EmptyState
        icon={MessageCircle}
        title="Conversation not found"
        subtitle="It may have been removed, or you don't have access to it."
      />
    )
  }

  if (!participant) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="This person is no longer available"
        subtitle="Their account may have been removed."
      />
    )
  }

  const status = !isConnected
    ? {
        key: 'connection',
        text: connection === 'reconnecting' ? 'Reconnecting…' : 'Connecting…',
        tone: 'text-warning',
        dot: 'animate-breathe bg-warning',
      }
    : isParticipantTyping
      ? { key: 'typing', text: 'typing…', tone: 'text-brand' }
      : isSelfChat
        ? { key: 'self', text: 'Note to self', tone: 'text-fg-3' }
        : isOnline
          ? { key: 'online', text: 'Active now', tone: 'text-fg-3', dot: 'bg-success' }
          : { key: 'offline', text: 'Offline', tone: 'text-fg-4' }

  const renderBody = () => {
    if (isLoading) return <MessageThreadSkeleton />

    if (error) {
      return (
        <EmptyState
          icon={CloudOff}
          title="Couldn't load messages"
          subtitle="Check your connection and try again."
          action={
            <Button size="sm" icon={RefreshCw} onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )
    }

    if (!messages?.length) {
      return (
        <div className="animate-fade-in flex flex-1 flex-col items-center justify-center py-12 text-center [--avatar-ring:var(--color-canvas)]">
          <Avatar user={participant} size={56} online={isOnline} />
          <p className="mt-4 text-title font-semibold text-fg">
            {isSelfChat ? 'Your private space' : participant.name}
          </p>
          <p className="mt-1 max-w-xs text-ui text-fg-3">
            {isSelfChat
              ? 'Jot down notes, links and reminders. Only you can see them.'
              : `This is the beginning of your conversation with ${participant.name}. Say hello 👋`}
          </p>
        </div>
      )
    }

    return (
      <div role="log" aria-label={`Messages with ${participant.name}`} className="flex flex-col">
        <AnimatePresence initial={false}>
          {items.map((item) =>
            item.type === 'day' ? (
              <DaySeparator key={item.key} label={item.label} />
            ) : (
              <MessageBubble
                key={item.key}
                message={item.message}
                isMine={isMine(item.message)}
                isFirstInGroup={item.isFirstInGroup}
                isLastInGroup={item.isLastInGroup}
                onDelete={deleteMessage}
                highlight={normalizedSearch}
                isActiveMatch={item.key === activeMatchId}
              />
            ),
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      {/* Faint warm light spilling from under the header; static, painted
          beneath the messages. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-14 h-48 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgb(244_162_97/0.05),transparent)]"
      />
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-1.5 border-b border-line px-2 md:px-4">
        <IconButton icon={ArrowLeft} label="Back to chats" tooltip={false} onClick={() => navigate('/chats')} className="md:hidden" />

        <button
          type="button"
          onClick={onToggleDetails}
          aria-expanded={detailsOpen}
          aria-label={`${participant.name} — chat details`}
          className="flex min-w-0 items-center gap-3 rounded-control py-1 pl-1 pr-2.5 text-left transition-colors duration-150 [--avatar-ring:var(--color-canvas)] hover:bg-hover hover:[--avatar-ring:var(--color-hover)]"
        >
          <Avatar user={participant} size={34} online={isOnline} />
          <div className="min-w-0">
            <p className="truncate text-body font-semibold text-fg">
              {participant.name}
              {isSelfChat ? (
                <span className="ml-1.5 rounded-chip bg-active px-1.5 py-px align-[1px] text-meta font-medium text-fg-3">
                  You
                </span>
              ) : null}
            </p>
            <div className="relative h-4 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={status.key}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={transitions.fast}
                  className={`flex items-center gap-1.5 truncate text-caption ${status.tone}`}
                >
                  {status.dot ? <span className={`size-1.5 shrink-0 rounded-full ${status.dot}`} /> : null}
                  {status.text}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          <IconButton
            icon={Search}
            label="Search in conversation"
            active={searchOpen}
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
          />
          <IconButton
            icon={PanelRight}
            label={detailsOpen ? 'Hide details' : 'Show details'}
            align="end"
            active={detailsOpen}
            onClick={onToggleDetails}
          />
        </div>
      </header>

      <AnimatePresence initial={false}>
        {searchOpen ? (
          <ThreadSearchBar
            query={searchQuery}
            onQueryChange={(value) => {
              setSearchQuery(value)
              setMatchFromEnd(0)
            }}
            matchCount={matchIds.length}
            position={matchOffset + 1}
            onStep={stepMatch}
            onClose={closeSearch}
          />
        ) : null}
      </AnimatePresence>

      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto overscroll-contain">
          <div className="mx-auto flex min-h-full w-full max-w-205 flex-col justify-end px-4 pb-3 pt-6 md:px-8">
            {renderBody()}

            <AnimatePresence>
              {isParticipantTyping ? (
                <motion.div key="typing" {...fadeUp} transition={transitions.base} className="mt-3">
                  {/* Neutral dots, since this stands in for one of their messages. */}
                  <TypingBubble label={`${firstName} is typing`} dotSize={5} dotColor="var(--color-fg-2)" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {!isConnected ? (
            <motion.div
              key="connection"
              initial={{ opacity: 0, y: -6 }}
              // Delayed, so a normal connect on load never flashes it.
              animate={{ opacity: 1, y: 0, transition: { ...transitions.base, delay: 0.8 } }}
              exit={{ opacity: 0, y: -6 }}
              transition={transitions.base}
              // Phones only: from md up the sidebar carries this notice.
              className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-4 md:hidden"
            >
              <div role="status" className="surface-float flex items-center gap-2 rounded-full px-3 py-1.5 text-caption text-fg-2">
                <span className="animate-breathe size-1.5 rounded-full bg-warning" />
                {connection === 'reconnecting' ? (
                  <span>
                    <span className="font-medium text-fg">Connection interrupted.</span> Trying to reconnect…
                  </span>
                ) : (
                  'Connecting…'
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {awayFrom !== null ? (
            <motion.div
              key="jump"
              {...fadeUp}
              transition={transitions.base}
              className="absolute inset-x-0 bottom-3 z-20 flex justify-center"
            >
              <button
                type="button"
                onClick={scrollToBottom}
                className="surface-float flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-medium text-fg-2 transition-colors duration-150 hover:text-fg"
              >
                <ArrowDown size={13} aria-hidden="true" />
                {hasNewBelow ? 'New messages' : 'Jump to latest'}
                {hasNewBelow ? <span className="size-1.5 rounded-full bg-brand" /> : null}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <Composer
        value={draft}
        onChange={handleDraftChange}
        onSend={handleSend}
        canSend={canSend}
        isConnected={isConnected}
        placeholder={isSelfChat ? 'Write a note to yourself' : `Message ${firstName}`}
      />
    </div>
  )
}

export default MessageThread
