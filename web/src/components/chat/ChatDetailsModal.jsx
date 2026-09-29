import { motion } from 'framer-motion'
import { Trash2, X } from 'lucide-react'
import Avatar from '@/components/common/Avatar'
import { useClearChat } from '@/hooks/useChats'

/**
 * Opened by clicking the contact in a thread's header — clears *that one*
 * conversation's history for yourself while keeping the contact in your chat
 * list. (Removing the row too is the chat list's hover "Delete".)
 */
const ChatDetailsModal = ({ chat, onClose }) => {
  const { mutate: clearChat, isPending } = useClearChat()
  const participant = chat.participant

  const handleClearChat = () => {
    const label = chat.isSelf ? 'this chat' : `your chat with ${participant.name}`
    const consequence = chat.isSelf
      ? 'Every message will be cleared. The chat stays in your list.'
      : `Every message will be cleared for you. ${participant.name} keeps their own copy, and stays in your chat list.`
    if (!window.confirm(`Clear ${label}? ${consequence}`)) {
      return
    }
    // The chat row and its history stay put — just close the panel and let
    // the now-cleared thread show through.
    clearChat(chat._id, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[8vh] sm:items-center sm:pt-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-surface-dark/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="glass-panel relative w-full max-w-sm overflow-hidden rounded-3xl p-5 shadow-2xl shadow-black/40"
      >
        <div className="flex items-center gap-3">
          <h2 className="flex-1 font-display text-lg font-semibold text-foreground">
            Chat Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-light text-subtle-foreground hover:text-foreground"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-col items-center py-6">
          <Avatar user={participant} size={80} />
          <p className="mt-3 text-lg font-semibold text-foreground">
            {participant.name}
            {chat.isSelf ? <span className="text-subtle-foreground"> (You)</span> : null}
          </p>
        </div>

        <p className="mb-2 ml-1 text-[11px] font-semibold uppercase tracking-widest text-subtle-foreground">
          Danger Zone
        </p>
        <button
          type="button"
          onClick={handleClearChat}
          disabled={isPending}
          className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-left transition-colors hover:bg-red-500/15 disabled:opacity-50"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-red-400">Clear Chat</p>
            <p className="mt-0.5 text-xs text-subtle-foreground">
              {chat.isSelf
                ? 'Clears every message in this conversation. The chat stays in your list.'
                : `Clears every message with ${participant.name}, for you only. ${participant.name} stays in your list.`}
            </p>
          </div>
        </button>
      </motion.div>
    </div>
  )
}

export default ChatDetailsModal
