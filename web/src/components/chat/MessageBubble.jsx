import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'

// Same guard as the chat list: an unparseable timestamp renders as no
// timestamp rather than taking the whole thread down.
const formatSentAt = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return format(date, 'h:mm a')
}

const MessageBubble = ({ message, isMine, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  // Already-deleted and still-sending bubbles have nothing to delete, and a
  // pending id is a local placeholder the server has never heard of.
  const canDelete = Boolean(onDelete) && !message.isDeleted && !message.pending

  const handleDelete = (forEveryone) => {
    setMenuOpen(false)
    onDelete(message._id, forEveryone)
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group relative flex w-full flex-col ${isMine ? 'items-end' : 'items-start'}`}
    >
      <div className={`flex items-center gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`max-w-[min(70%,32rem)] px-4 py-2.5 text-[15px] leading-relaxed break-words ${
            isMine
              ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-primary-light to-primary-dark text-surface-dark'
              : 'rounded-2xl rounded-bl-md bg-surface-card text-foreground'
          } ${message.isDeleted ? 'italic opacity-70' : ''}`}
          style={{ opacity: message.pending ? 0.6 : 1 }}
        >
          {message.text}
        </div>

        {canDelete ? (
          <div className="relative">
            <button
              type="button"
              aria-label="Message options"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex size-7 items-center justify-center rounded-full text-subtle-foreground opacity-0 transition-opacity hover:bg-surface-card hover:text-foreground group-hover:opacity-100"
            >
              <MoreHorizontal size={16} />
            </button>

            <AnimatePresence>
              {menuOpen ? (
                <>
                  {/* Click-away target, under the menu so its own buttons still receive the click. */}
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute z-20 top-full mt-1 w-44 overflow-hidden rounded-xl border border-surface-light bg-surface-card py-1 shadow-lg ${isMine ? 'right-0' : 'left-0'}`}
                  >
                    {isMine ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(true)}
                        className="block w-full px-3.5 py-2 text-left text-sm text-red-400 hover:bg-surface-light"
                      >
                        Delete for everyone
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(false)}
                      className="block w-full px-3.5 py-2 text-left text-sm text-foreground hover:bg-surface-light"
                    >
                      Delete for me
                    </button>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </div>

      <span className="mt-1 px-1 text-[11px] text-subtle-foreground">
        {message.pending ? 'Sending…' : formatSentAt(message.createdAt)}
      </span>
    </motion.div>
  )
}

export default MessageBubble
