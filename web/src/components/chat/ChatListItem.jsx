import { NavLink } from 'react-router-dom'
import { formatDistanceToNowStrict } from 'date-fns'
import { Trash2 } from 'lucide-react'
import Avatar from '@/components/common/Avatar'
import { useSocketStore } from '@/lib/socket'

// date-fns throws "Invalid time value" on an unparseable date, which would
// take the whole list down, so bad timestamps just render as no timestamp.
const formatLastMessageAt = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNowStrict(date, { addSuffix: false })
}

const ChatListItem = ({ chat, onDelete }) => {
  const participant = chat.participant
  const { onlineUsers, typingUsers, unreadChats } = useSocketStore()

  // Presence is about the person on the other side, and in a self chat there
  // is none: the user is always here, and cannot be typing to themselves
  // from somewhere else.
  const isOnline = !chat.isSelf && onlineUsers.has(participant._id)
  const isTyping = !chat.isSelf && typingUsers.get(chat._id) === participant._id
  const hasUnread = unreadChats.has(chat._id)

  const handleDeleteClick = (event) => {
    // This button sits inside the NavLink, so its click has to be stopped
    // from also opening the chat.
    event.preventDefault()
    event.stopPropagation()
    onDelete(chat)
  }

  return (
    <NavLink
      to={`/chats/${chat._id}`}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
          isActive ? 'bg-surface-card' : 'hover:bg-surface-card/60'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-primary" />
          ) : null}

          <Avatar user={participant} size={48} online={isOnline} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p
                className={`truncate text-[15px] font-medium ${hasUnread ? 'text-foreground' : 'text-foreground/90'}`}
              >
                {participant.name}
                {chat.isSelf ? <span className="text-subtle-foreground"> (You)</span> : null}
              </p>
              <span className="shrink-0 text-[11px] text-subtle-foreground group-hover:hidden">
                {formatLastMessageAt(chat.lastMessageAt)}
              </span>
              {onDelete ? (
                <button
                  type="button"
                  aria-label="Delete chat"
                  onClick={handleDeleteClick}
                  className="hidden shrink-0 rounded-full p-1 text-subtle-foreground hover:bg-surface-light hover:text-red-400 group-hover:block"
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>

            <div className="mt-0.5 flex items-center justify-between gap-2">
              {isTyping ? (
                <p className="truncate text-sm italic text-primary">typing…</p>
              ) : (
                <p
                  className={`truncate text-sm ${hasUnread ? 'font-medium text-foreground/80' : 'text-subtle-foreground'}`}
                >
                  {chat.lastMessage?.text ||
                    (chat.isSelf ? 'Message yourself' : 'No messages yet')}
                </p>
              )}
              {hasUnread ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
            </div>
          </div>
        </>
      )}
    </NavLink>
  )
}

export default ChatListItem
