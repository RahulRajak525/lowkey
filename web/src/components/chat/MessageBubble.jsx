import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Ban, Check, Clock3, Copy, Ellipsis, EyeOff, Trash2 } from 'lucide-react'
import IconButton from '@/components/ui/IconButton'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { formatMessageTime } from '@/lib/format'
import { transitions } from '@/lib/motion'
import RichText from './RichText'

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|️|‍|\s)+$/u
const PICTOGRAPH = /\p{Extended_Pictographic}/gu

/** One to three emoji and nothing else render large, without a bubble. */
const isJumboEmoji = (text) => {
  if (!text || text.length > 24 || !EMOJI_ONLY.test(text)) return false
  const count = text.match(PICTOGRAPH)?.length ?? 0
  return count >= 1 && count <= 3
}

const MessageBubble = ({
  message,
  isMine,
  isFirstInGroup = true,
  isLastInGroup = true,
  onDelete,
  highlight = '',
  isActiveMatch = false,
}) => {
  const rowRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuSide, setMenuSide] = useState('bottom')
  const [copied, setCopied] = useState(false)

  const isDeleted = Boolean(message.isDeleted)
  // Already-deleted and still-sending bubbles have nothing to delete, and a
  // pending id is a local placeholder the server has never heard of.
  const canDelete = Boolean(onDelete) && !isDeleted && !message.pending
  const canCopy = !isDeleted && Boolean(message.text)
  const isJumbo = !isDeleted && isJumboEmoji(message.text)
  const time = formatMessageTime(message.createdAt)

  // Open upward near the bottom of the screen so the composer never hides it.
  const openMenu = () => {
    const rect = rowRef.current?.getBoundingClientRect()
    setMenuSide(rect && rect.bottom > window.innerHeight - 220 ? 'top' : 'bottom')
    setMenuOpen(true)
  }

  const handleCopy = () => {
    setMenuOpen(false)
    navigator.clipboard
      ?.writeText(message.text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      })
      .catch(() => {})
  }

  const handleDelete = (forEveryone) => {
    setMenuOpen(false)
    onDelete(message._id, forEveryone)
  }

  // Right-click on desktop, long-press on touch — touch screens never see
  // the hover toolbar.
  const handleContextMenu = (event) => {
    if (!canDelete) return
    event.preventDefault()
    openMenu()
  }

  // Grouped bubbles get a tight corner where they meet their neighbour.
  const shape = isMine
    ? `rounded-bubble rounded-br-tail ${isFirstInGroup ? '' : 'rounded-tr-tail'}`
    : `rounded-bubble rounded-bl-tail ${isFirstInGroup ? '' : 'rounded-tl-tail'}`

  const surface = isDeleted
    ? 'border border-dashed border-line-strong text-fg-3'
    : isMine
      ? 'brand-gradient text-brand-ink shadow-bubble selection:bg-brand-ink/25 selection:text-brand-ink'
      : 'border border-line bg-raised text-fg shadow-raised'

  return (
    <motion.div
      ref={rowRef}
      id={`msg-${message._id}`}
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={transitions.base}
      className={`group/msg flex w-full flex-col ${isMine ? 'items-end' : 'items-start'} ${
        isFirstInGroup ? 'mt-3' : 'mt-0.5'
      }`}
    >
      <div className="relative flex min-w-0 max-w-[min(80%,34rem)]" onContextMenu={handleContextMenu}>
        {isJumbo ? (
          <p className={`text-[2.5rem] leading-[1.15] ${message.pending ? 'opacity-60' : ''}`}>{message.text}</p>
        ) : (
          <div
            className={`min-w-0 whitespace-pre-wrap px-3.5 py-2 text-message [overflow-wrap:anywhere] transition-opacity duration-200 ${shape} ${surface} ${
              message.pending ? 'opacity-70' : ''
            } ${isActiveMatch ? 'ring-2 ring-brand/70 ring-offset-2 ring-offset-canvas' : ''}`}
          >
            {isDeleted ? (
              <span className="inline-flex items-center gap-1.5 italic">
                <Ban size={13} aria-hidden="true" />
                {message.text}
              </span>
            ) : (
              <RichText text={message.text} query={highlight} tone={isMine ? 'mine' : 'theirs'} />
            )}
          </div>
        )}

        {canCopy ? (
          // Positioned with inset-y + items-center rather than a translate:
          // a transformed ancestor would trap the menu's fixed click-away layer.
          <div
            className={`absolute inset-y-0 flex items-center gap-0.5 transition-opacity duration-150 ${
              isMine ? 'right-full mr-1.5 flex-row-reverse' : 'left-full ml-1.5'
            } ${
              menuOpen
                ? 'z-30 opacity-100'
                : 'pointer-events-none z-10 opacity-0 focus-within:pointer-events-auto focus-within:opacity-100 group-hover/msg:pointer-events-auto group-hover/msg:opacity-100'
            }`}
          >
            <IconButton icon={copied ? Check : Copy} label={copied ? 'Copied' : 'Copy'} size="sm" tooltip="top" onClick={handleCopy} />
            {canDelete ? (
              <div className="relative">
                <IconButton
                  icon={Ellipsis}
                  label="More"
                  size="sm"
                  tooltip="top"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
                />
                <Menu
                  open={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  side={menuSide}
                  align={isMine ? 'end' : 'start'}
                  label="Message actions"
                  className="w-48"
                >
                  <MenuItem icon={Copy} onSelect={handleCopy}>
                    Copy text
                  </MenuItem>
                  <MenuSeparator />
                  {isMine ? (
                    <MenuItem icon={Trash2} tone="danger" onSelect={() => handleDelete(true)}>
                      Delete for everyone
                    </MenuItem>
                  ) : null}
                  <MenuItem icon={EyeOff} tone="danger" onSelect={() => handleDelete(false)}>
                    Delete for me
                  </MenuItem>
                </Menu>
              </div>
            ) : null}
            <span className="hidden whitespace-nowrap px-1 text-meta tabular-nums text-fg-4 sm:inline">{time}</span>
          </div>
        ) : null}
      </div>

      {isLastInGroup || message.pending ? (
        <p className="mt-1 flex items-center gap-1 px-1 text-meta tabular-nums text-fg-4">
          {message.pending ? (
            <>
              <Clock3 size={11} aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              {time}
              {isMine && !isDeleted ? (
                <>
                  <Check size={12} className="text-fg-3" aria-hidden="true" />
                  <span className="sr-only">Sent</span>
                </>
              ) : null}
            </>
          )}
        </p>
      ) : null}
    </motion.div>
  )
}

export default MessageBubble
