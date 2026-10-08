import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClerk } from '@clerk/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CloudOff,
  LogIn,
  MessageSquareDashed,
  RefreshCw,
  Search,
  SearchX,
  SquarePen,
  WifiOff,
  X,
} from 'lucide-react'
import { useMe } from '@/hooks/useAuth'
import { useChats, useDeleteChat } from '@/hooks/useChats'
import { transitions } from '@/lib/motion'
import { hasModKey, modKeyLabel } from '@/lib/platform'
import { useSocketStore } from '@/lib/socket'
import { hasParticipant } from '@/lib/types'
import { useConnectionStatus } from '@/lib/useConnectionStatus'
import EmptyState from '@/components/common/EmptyState'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import IconButton from '@/components/ui/IconButton'
import Kbd from '@/components/ui/Kbd'
import Logo from '@/components/ui/Logo'
import ChatListItem from './ChatListItem'
import { ChatListSkeleton } from './ChatListSkeleton'
import ProfileMenu from './ProfileMenu'

const Sidebar = ({ onNewChat }) => {
  const { data: chats, isLoading, error, refetch } = useChats()
  const { data: me } = useMe()
  const { mutate: deleteChat, isPending: isDeleting } = useDeleteChat()
  const { signOut } = useClerk()
  const { onlineUsers, typingUsers, unreadChats } = useSocketStore()
  const connection = useConnectionStatus()
  const navigate = useNavigate()
  const { chatId: openChatId } = useParams()
  const [query, setQuery] = useState('')
  const [isSearchFocused, setSearchFocused] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const searchRef = useRef(null)

  // ⌘K / Ctrl+K jumps to search from anywhere — unless the sidebar is
  // hidden (a phone with a thread open).
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!hasModKey(event) || event.key.toLowerCase() !== 'k') return
      const input = searchRef.current
      if (!input || input.offsetParent === null) return
      event.preventDefault()
      input.focus()
      input.select()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const confirmDelete = () => {
    const chat = pendingDelete
    if (!chat) return
    // The open thread reads its chat from the same ["chats"] list this
    // removes the row from, so it has to be navigated away from explicitly.
    deleteChat(chat._id, {
      onSuccess: () => {
        setPendingDelete(null)
        if (openChatId === chat._id) navigate('/chats')
      },
    })
  }

  const visibleChats = chats?.filter(hasParticipant) ?? []
  const normalizedQuery = query.trim().toLowerCase()
  const filteredChats = normalizedQuery
    ? visibleChats.filter(
        ({ participant }) =>
          participant.name?.toLowerCase().includes(normalizedQuery) ||
          participant.email?.toLowerCase().includes(normalizedQuery),
      )
    : visibleChats

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      if (query) setQuery('')
      else event.currentTarget.blur()
    } else if (event.key === 'Enter' && normalizedQuery && filteredChats[0]) {
      navigate(`/chats/${filteredChats[0]._id}`)
      event.currentTarget.blur()
    }
  }

  const renderList = () => {
    if (isLoading) return <ChatListSkeleton />

    if (error) {
      return error.response?.status === 401 ? (
        <EmptyState
          icon={LogIn}
          title="Your session has expired"
          subtitle="Sign in again to pick up where you left off."
          action={
            <Button variant="primary" size="sm" icon={LogIn} onClick={() => signOut({ redirectUrl: '/' })}>
              Sign in again
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={CloudOff}
          title="Couldn't load conversations"
          subtitle="Check your connection and try again."
          action={
            <Button size="sm" icon={RefreshCw} onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )
    }

    if (filteredChats.length === 0) {
      return normalizedQuery ? (
        <EmptyState icon={SearchX} title="No conversations found." subtitle={`Nothing matches “${query.trim()}”.`} />
      ) : (
        <EmptyState
          icon={MessageSquareDashed}
          title="Nothing here yet."
          subtitle="Start a conversation."
          action={
            <Button variant="primary" size="sm" icon={SquarePen} onClick={onNewChat}>
              New conversation
            </Button>
          }
        />
      )
    }

    return (
      <div className="flex flex-col gap-0.5">
        {filteredChats.map((chat, index) => {
          const { participant } = chat
          return (
            // Rows glide to their new place when a message re-sorts the list.
            <motion.div key={chat._id} layout="position" transition={transitions.slow}>
              <ChatListItem
                chat={chat}
                myId={me?._id}
                onDelete={setPendingDelete}
                // Presence is about the person on the other side, and in a
                // self chat there is none: the user is always here, and
                // cannot be typing to themselves from somewhere else.
                isOnline={!chat.isSelf && onlineUsers.has(participant._id)}
                isTyping={!chat.isSelf && typingUsers.get(chat._id) === participant._id}
                hasUnread={unreadChats.has(chat._id)}
                query={normalizedQuery}
                isEnterTarget={isSearchFocused && Boolean(normalizedQuery) && index === 0}
              />
            </motion.div>
          )
        })}
      </div>
    )
  }

  const pendingName = pendingDelete?.participant.name

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line pl-4 pr-3">
        <Logo size={22} wordmarkClassName="text-[15px]" />
        <div className="ml-auto flex items-center gap-1.5">
          <IconButton icon={SquarePen} label="New conversation" onClick={onNewChat} />
          <ProfileMenu />
        </div>
      </header>

      <div className="px-3 pb-2 pt-3">
        <label className="group/search flex h-9 items-center gap-2 rounded-control border border-line bg-raised/60 px-3 transition-[border-color,background-color,box-shadow] duration-150 ease-out-soft hover:border-line-strong focus-within:border-brand/40 focus-within:bg-raised focus-within:shadow-[0_0_0_3px_rgb(244_162_97/0.08)] pointer-coarse:h-11">
          <Search
            size={15}
            className="shrink-0 text-fg-4 transition-colors duration-150 group-focus-within/search:text-brand"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-4 pointer-coarse:text-[16px]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
              aria-label="Clear search"
              className="-mr-1 flex size-5 items-center justify-center rounded-full text-fg-3 transition-colors hover:bg-active hover:text-fg pointer-coarse:size-8"
            >
              <X size={12} aria-hidden="true" />
            </button>
          ) : (
            <span className="hidden items-center gap-0.5 md:flex" aria-hidden="true">
              {isSearchFocused ? (
                <Kbd>Esc</Kbd>
              ) : (
                <>
                  <Kbd>{modKeyLabel}</Kbd>
                  <Kbd>K</Kbd>
                </>
              )}
            </span>
          )}
        </label>
      </div>

      <AnimatePresence initial={false}>
        {connection === 'reconnecting' ? (
          <motion.div
            key="connection"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitions.base}
            className="overflow-hidden px-3"
          >
            <div
              role="status"
              className="mb-2 flex items-center gap-2.5 rounded-control border border-warning/15 bg-warning/6 px-3 py-2 text-caption text-fg-2"
            >
              <WifiOff size={14} className="shrink-0 text-warning" aria-hidden="true" />
              <span>
                <span className="font-medium text-fg">Connection interrupted.</span> Trying to reconnect…
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isLoading && !error && visibleChats.length > 0 ? (
        <div className="flex items-center justify-between px-5 pb-1.5 pt-2">
          <p className="text-meta font-medium uppercase tracking-[0.08em] text-fg-4">
            {normalizedQuery ? 'Results' : 'Conversations'}
          </p>
          <span className="text-meta tabular-nums text-fg-4">{filteredChats.length}</span>
        </div>
      ) : null}

      <nav aria-label="Conversations" className="flex flex-1 flex-col overflow-y-auto px-2 pb-3">
        {renderList()}
      </nav>

      <AnimatePresence>
        {pendingDelete ? (
          <ConfirmDialog
            title={pendingDelete.isSelf ? 'Delete this chat?' : `Delete your chat with ${pendingName}?`}
            description={
              pendingDelete.isSelf
                ? 'It will be removed from your chat list and every message cleared.'
                : `${pendingName} will be removed from your chat list and every message cleared for you. They keep their own copy — if either of you sends a new message, the chat comes back.`
            }
            confirmLabel="Delete chat"
            isPending={isDeleting}
            onConfirm={confirmDelete}
            onClose={() => setPendingDelete(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default Sidebar
