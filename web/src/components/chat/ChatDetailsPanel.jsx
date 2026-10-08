import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Eraser, Link2, MessagesSquare, Trash2, X } from 'lucide-react'
import Avatar from '@/components/common/Avatar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import IconButton from '@/components/ui/IconButton'
import { useClearChat, useDeleteChat } from '@/hooks/useChats'
import { useMessages } from '@/hooks/useMessages'
import { formatFullDate } from '@/lib/format'
import { extractLinks, prettyUrl } from '@/lib/links'
import { fade, transitions } from '@/lib/motion'
import { useSocketStore } from '@/lib/socket'
import { useEscapeLayer } from '@/lib/useEscapeLayer'

const PANEL_WIDTH = 320

const SectionLabel = ({ children }) => (
  <p className="mb-1.5 mt-7 px-1 text-meta font-medium uppercase tracking-[0.08em] text-fg-4">{children}</p>
)

const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-center gap-3 px-3.5 py-3">
    <Icon size={15} className="shrink-0 text-fg-4" aria-hidden="true" />
    <span className="text-ui text-fg-3">{label}</span>
    <span className="ml-auto min-w-0 truncate text-ui tabular-nums text-fg">{children}</span>
  </div>
)

const ActionRow = ({ icon: Icon, title, description, tone = 'default', onClick }) => {
  const isDanger = tone === 'danger'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-control px-2.5 py-2.5 text-left transition-colors duration-150 ${
        isDanger ? 'hover:bg-danger/10' : 'hover:bg-hover'
      }`}
    >
      <span
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[8px] border ${
          isDanger ? 'border-danger/20 bg-danger/10 text-danger' : 'border-line bg-raised text-fg-2'
        }`}
      >
        <Icon size={14} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className={`block text-ui font-medium ${isDanger ? 'text-danger' : 'text-fg'}`}>{title}</span>
        <span className="mt-0.5 block text-caption text-fg-3">{description}</span>
      </span>
    </button>
  )
}

/**
 * One conversation's context: who it's with, a few facts, links shared in
 * it, and the two per-user actions — Clear Chat (history goes, row stays)
 * and Delete Chat (row leaves my list too). Neither touches the other side.
 */
const DetailsContent = ({ chat, onClose }) => {
  const navigate = useNavigate()
  const participant = chat.participant
  const name = participant.name
  const { onlineUsers } = useSocketStore()
  const { data: messages } = useMessages(chat._id)
  const { mutate: clearChat, isPending: isClearing } = useClearChat()
  const { mutate: deleteChat, isPending: isDeleting } = useDeleteChat()
  const [confirming, setConfirming] = useState(null) // 'clear' | 'delete' | null

  const isOnline = !chat.isSelf && onlineUsers.has(participant._id)
  const visibleMessages = messages?.filter((message) => !message.isDeleted) ?? []
  const links = extractLinks(visibleMessages, 5)

  const handleConfirm = () => {
    if (confirming === 'clear') {
      // The row and contact stay put — only the history goes.
      clearChat(chat._id, { onSuccess: () => setConfirming(null) })
      return
    }
    // The open thread reads its chat from the ["chats"] list this removes
    // the row from, so it has to be navigated away from explicitly.
    deleteChat(chat._id, {
      onSuccess: () => {
        setConfirming(null)
        onClose()
        navigate('/chats')
      },
    })
  }

  const confirmCopy =
    confirming === 'clear'
      ? {
          title: chat.isSelf ? 'Clear this chat?' : `Clear your chat with ${name}?`,
          description: chat.isSelf
            ? 'Every message will be cleared. The chat stays in your list.'
            : `Every message will be cleared for you. ${name} keeps their own copy, and stays in your chat list.`,
          confirmLabel: 'Clear chat',
        }
      : {
          title: chat.isSelf ? 'Delete this chat?' : `Delete your chat with ${name}?`,
          description: chat.isSelf
            ? 'It will be removed from your chat list and every message cleared.'
            : `${name} will be removed from your chat list and every message cleared for you. They keep their own copy — if either of you sends a new message, the chat comes back.`,
          confirmLabel: 'Delete chat',
        }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-5 pr-3">
        <p className="text-ui font-medium text-fg-2">Details</p>
        <IconButton icon={X} label="Close details" size="sm" align="end" onClick={onClose} />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex flex-col items-center px-2 pb-6 pt-8 text-center [--avatar-ring:var(--color-panel)]">
          <Avatar user={participant} size={72} online={isOnline} />
          <p className="mt-4 text-title font-semibold text-fg">{name}</p>
          {participant.email ? <p className="mt-0.5 text-caption text-fg-3">{participant.email}</p> : null}
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-meta font-medium ${
              isOnline ? 'border-success/20 bg-success/10 text-success' : 'border-line bg-raised text-fg-3'
            }`}
          >
            {isOnline ? <span className="size-1.5 rounded-full bg-success" /> : null}
            {chat.isSelf ? 'Note to self' : isOnline ? 'Active now' : 'Offline'}
          </span>
        </div>

        <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-raised/40">
          <InfoRow icon={CalendarDays} label="Started">
            {formatFullDate(chat.createdAt) || '—'}
          </InfoRow>
          <InfoRow icon={MessagesSquare} label="Messages">
            {messages ? visibleMessages.length : '—'}
          </InfoRow>
        </div>

        {links.length > 0 ? (
          <>
            <SectionLabel>Shared links</SectionLabel>
            <ul className="flex flex-col gap-0.5">
              {links.map((link) => (
                <li key={link}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-control px-2.5 py-2 text-ui text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg"
                  >
                    <Link2 size={14} className="shrink-0 text-fg-4" aria-hidden="true" />
                    <span className="truncate">{prettyUrl(link)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <SectionLabel>Manage</SectionLabel>
        <div className="flex flex-col gap-0.5">
          <ActionRow
            icon={Eraser}
            title="Clear chat"
            description={
              chat.isSelf
                ? 'Clears every message. The chat stays in your list.'
                : `Clears messages for you only. ${name} stays in your list.`
            }
            onClick={() => setConfirming('clear')}
          />
          <ActionRow
            icon={Trash2}
            tone="danger"
            title="Delete chat"
            description="Removes it from your list and clears its messages for you."
            onClick={() => setConfirming('delete')}
          />
        </div>
      </div>

      <AnimatePresence>
        {confirming ? (
          <ConfirmDialog
            {...confirmCopy}
            isPending={isClearing || isDeleting}
            onConfirm={handleConfirm}
            onClose={() => setConfirming(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/**
 * The optional third zone. `inline` is a column beside the thread (wide
 * screens); `overlay` is a drawer over it (everything narrower).
 */
const ChatDetailsPanel = ({ chat, variant, onClose }) => {
  useEscapeLayer(onClose)

  if (variant === 'inline') {
    return (
      <motion.aside
        aria-label="Conversation details"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: PANEL_WIDTH, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={transitions.slow}
        className="h-full shrink-0 overflow-hidden border-l border-line bg-panel"
      >
        <div className="h-full" style={{ width: PANEL_WIDTH }}>
          <DetailsContent key={chat._id} chat={chat} onClose={onClose} />
        </div>
      </motion.aside>
    )
  }

  return (
    <div className="fixed inset-0 z-40">
      <motion.div
        {...fade}
        transition={transitions.base}
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-canvas/60 backdrop-blur-[2px]"
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Conversation details"
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 32, opacity: 0 }}
        transition={transitions.slow}
        className="absolute inset-y-0 right-0 w-full max-w-[360px] border-l border-line bg-panel shadow-float"
      >
        <DetailsContent key={chat._id} chat={chat} onClose={onClose} />
      </motion.aside>
    </div>
  )
}

export default ChatDetailsPanel
