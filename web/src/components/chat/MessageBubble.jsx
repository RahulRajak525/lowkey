import { motion } from 'framer-motion'
import { format } from 'date-fns'

// Same guard as the chat list: an unparseable timestamp renders as no
// timestamp rather than taking the whole thread down.
const formatSentAt = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return format(date, 'h:mm a')
}

const MessageBubble = ({ message, isMine }) => (
  <motion.div
    layout="position"
    initial={{ opacity: 0, y: 10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className={`flex w-full flex-col ${isMine ? 'items-end' : 'items-start'}`}
  >
    <div
      className={`max-w-[min(70%,32rem)] px-4 py-2.5 text-[15px] leading-relaxed break-words ${
        isMine
          ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-primary-light to-primary-dark text-surface-dark'
          : 'rounded-2xl rounded-bl-md bg-surface-card text-foreground'
      }`}
      style={{ opacity: message.pending ? 0.6 : 1 }}
    >
      {message.text}
    </div>
    <span className="mt-1 px-1 text-[11px] text-subtle-foreground">
      {message.pending ? 'Sending…' : formatSentAt(message.createdAt)}
    </span>
  </motion.div>
)

export default MessageBubble
