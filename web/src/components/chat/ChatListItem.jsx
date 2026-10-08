import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import Avatar from '@/components/common/Avatar'
import IconButton from '@/components/ui/IconButton'
import { formatListTime } from '@/lib/format'
import { transitions } from '@/lib/motion'
import { useSocketStore } from '@/lib/socket'

const TypingDots = () => (
  <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
    {[0, 1, 2].map((index) => (
      <span
        key={index}
        className="animate-breathe size-1 rounded-full bg-brand"
        style={{ animationDelay: `${index * 0.18}s` }}
      />
    ))}
  </span>
)

const ChatListItem = ({ chat, myId, onDelete }) => {
  const participant = chat.participant
  const { onlineUsers, typingUsers, unreadChats } = useSocketStore()

  // Presence is about the person on the other side, and in a self chat there
  // is none: the user is always here, and cannot be typing to themselves
  // from somewhere else.
  const isOnline = !chat.isSelf && onlineUsers.has(participant._id)
  const isTyping = !chat.isSelf && typingUsers.get(chat._id) === participant._id
  const hasUnread = unreadChats.has(chat._id)

  const lastMessage = chat.lastMessage
  const sentByMe = !chat.isSelf && Boolean(myId) && lastMessage?.sender === myId

  // Right-click on desktop, long-press on touch: the same delete flow as the
  // hover button, which touch screens never get to see.
  const handleContextMenu = (event) => {
    if (!onDelete) return
    event.preventDefault()
    onDelete(chat)
  }

  return (
    <div className="group relative" onContextMenu={handleContextMenu}>
      <NavLink
        to={`/chats/${chat._id}`}
        className={({ isActive }) =>
          `relative flex items-center gap-3 rounded-card px-2.5 py-2.5 outline-none transition-colors duration-150 ${
            isActive
              ? 'bg-raised shadow-[inset_0_0_0_1px_var(--color-line)] [--avatar-ring:var(--color-raised)]'
              : '[--avatar-ring:var(--color-panel)] hover:bg-hover hover:[--avatar-ring:var(--color-hover)] focus-visible:bg-hover'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive ? (
              <motion.span
                layoutId="active-chat-indicator"
                transition={transitions.base}
                className="absolute inset-y-3.5 left-0 w-[3px] rounded-full bg-brand shadow-[0_0_10px_rgb(244_162_97/0.7)]"
              />
            ) : null}

            <Avatar user={participant} size={40} online={isOnline} />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p
                  className={`min-w-0 flex-1 truncate text-body ${
                    hasUnread ? 'font-semibold text-fg' : 'font-medium text-fg/90'
                  }`}
                >
                  {participant.name}
                  {chat.isSelf ? (
                    <span className="ml-1.5 rounded-[5px] bg-active px-1.5 py-px align-[1px] text-meta font-medium text-fg-3">
                      You
                    </span>
                  ) : null}
                </p>
                <span
                  className={`shrink-0 text-meta tabular-nums transition-opacity duration-150 ${
                    onDelete ? 'group-focus-within:opacity-0 group-hover:opacity-0' : ''
                  } ${hasUnread ? 'font-medium text-brand' : 'text-fg-4'}`}
                >
                  {formatListTime(chat.lastMessageAt)}
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-2">
                {isTyping ? (
                  <p className="flex min-w-0 flex-1 items-center gap-1.5 text-ui text-brand">
                    <TypingDots />
                    typing
                  </p>
                ) : (
                  <p
                    className={`min-w-0 flex-1 truncate text-ui ${
                      lastMessage?.isDeleted ? 'italic text-fg-4' : hasUnread ? 'text-fg-2' : 'text-fg-3'
                    }`}
                  >
                    {sentByMe ? <span className="text-fg-4">You: </span> : null}
                    {lastMessage?.text || (chat.isSelf ? 'Message yourself' : 'No messages yet')}
                  </p>
                )}
                {hasUnread ? (
                  <span className="size-2 shrink-0 rounded-full bg-brand shadow-[0_0_8px_rgb(244_162_97/0.7)]">
                    <span className="sr-only">Unread</span>
                  </span>
                ) : null}
              </div>
            </div>
            {isOnline ? <span className="sr-only">Online</span> : null}
          </>
        )}
      </NavLink>

      {onDelete ? (
        // Positioned by a wrapper: IconButton is `relative` itself (for its
        // tooltip), which would override an `absolute` passed in className.
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center opacity-0 transition-opacity duration-150 focus-within:pointer-events-auto focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
          <IconButton
            icon={Trash2}
            label="Delete chat"
            size="sm"
            variant="subtle"
            align="end"
            onClick={() => onDelete(chat)}
            className="hover:border-danger/30! hover:bg-danger/10! hover:text-danger!"
          />
        </div>
      ) : null}
    </div>
  )
}

export default ChatListItem
