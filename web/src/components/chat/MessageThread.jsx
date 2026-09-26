import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, MessageCircle, RefreshCw } from 'lucide-react'
import Avatar from '@/components/common/Avatar'
import EmptyState from '@/components/common/EmptyState'
import { TypingBubble } from '@/components/common/TypingBubble'
import ChatDetailsModal from './ChatDetailsModal'
import Composer from './Composer'
import MessageBubble from './MessageBubble'
import { MessageThreadSkeleton } from './MessageThreadSkeleton'
import { useMe } from '@/hooks/useAuth'
import { useChats } from '@/hooks/useChats'
import { useDeleteMessage, useMessages, useSendMessage } from '@/hooks/useMessages'
import { emitTyping, setActiveChat, useSocketStore } from '@/lib/socket'
import { hasParticipant } from '@/lib/types'

/** Silence after the last keystroke before the other side stops seeing "typing...". */
const TYPING_IDLE_MS = 2000

const MessageThread = ({ chatId }) => {
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

  const [draft, setDraft] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const scrollRef = useRef(null)
  const isTyping = useRef(false)
  const idleTimer = useRef(null)

  // Joining the room is what makes the server deliver this chat's messages
  // live; leaving on unmount also clears the chat's unread dot.
  useEffect(() => {
    if (!chatId) return undefined
    setActiveChat(chatId)
    return () => setActiveChat(null)
  }, [chatId])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages?.length, isParticipantTyping])

  const isMine = useCallback(
    (message) => {
      if (isSelfChat) return true
      const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id
      // Before /auth/me resolves, fall back to the one thing already known:
      // in a 1:1 chat, anyone who is not the participant is me.
      return me ? senderId === me._id : senderId !== participant?._id
    },
    [isSelfChat, me, participant],
  )

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

  if (!chat) {
    if (isLoadingChats) {
      return <MessageThreadSkeleton />
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

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-surface-light px-5 py-3.5">
        <button
          type="button"
          onClick={() => navigate('/chats')}
          aria-label="Back to chats"
          className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-full text-subtle-foreground hover:bg-surface-card hover:text-foreground md:hidden"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          type="button"
          onClick={() => setShowDetails(true)}
          aria-label={`${participant.name} — chat details`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-colors hover:bg-surface-card/60"
        >
          <Avatar user={participant} size={40} online={isOnline} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-foreground">
              {participant.name}
              {isSelfChat ? <span className="text-subtle-foreground"> (You)</span> : null}
            </p>
            <p className="h-4 truncate text-xs">
              {!isConnected ? (
                <span className="text-primary">Connecting…</span>
              ) : isParticipantTyping ? (
                <span className="italic text-primary">typing…</span>
              ) : isSelfChat ? (
                <span className="text-subtle-foreground">Message yourself</span>
              ) : isOnline ? (
                <span className="text-subtle-foreground">Online</span>
              ) : null}
            </p>
          </div>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <MessageThreadSkeleton />
        ) : error ? (
          <EmptyState
            title="Failed to load messages"
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-surface-dark"
              >
                <RefreshCw size={15} /> Retry
              </button>
            }
          />
        ) : !messages?.length ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="No messages yet"
              subtitle={
                isSelfChat ? 'Send yourself notes, links and reminders' : `Say hi to ${participant.name}`
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isMine={isMine(message)}
                  onDelete={deleteMessage}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {isParticipantTyping ? (
        <div className="px-6 pb-2">
          {/* White dots to match an incoming message's text color, since this
              bubble stands in for one. */}
          <TypingBubble dotColor="var(--color-foreground)" />
        </div>
      ) : null}

      <Composer
        value={draft}
        onChange={handleDraftChange}
        onSend={handleSend}
        canSend={canSend}
        isConnected={isConnected}
      />

      <AnimatePresence>
        {showDetails ? (
          <ChatDetailsModal chat={chat} onClose={() => setShowDetails(false)} />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default MessageThread
