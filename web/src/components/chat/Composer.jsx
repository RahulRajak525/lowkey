import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, LoaderCircle, Smile } from 'lucide-react'
import IconButton from '@/components/ui/IconButton'
import Kbd from '@/components/ui/Kbd'
import { Menu } from '@/components/ui/Menu'
import { transitions } from '@/lib/motion'

const EMOJIS = [
  '😀', '😂', '🥹', '😊', '😍', '🥰', '😘', '😉',
  '😎', '🤩', '🤔', '🙃', '😅', '😭', '😮', '😴',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '👋', '🤝',
  '❤️', '🧡', '💜', '🔥', '✨', '🎉', '💯', '✅',
  '👀', '💬', '☕', '🍕', '🌙', '☀️', '🚀', '🎧',
]

const MAX_HEIGHT = 192

const Composer = ({ value, onChange, onSend, canSend, isConnected, placeholder }) => {
  const textareaRef = useRef(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  // Bumped on every send, to replay the arrow's "lift off".
  const [sendCount, setSendCount] = useState(0)
  const isWaitingForConnection = value.trim().length > 0 && !isConnected

  // Auto-grows with content up to a cap, then scrolls internally.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  // Ready to type the moment a conversation opens — but only with a real
  // keyboard; on touch it would pop the on-screen keyboard uninvited.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) textareaRef.current?.focus()
  }, [])

  const send = () => {
    onSend()
    if (!canSend) return
    setSendCount((count) => count + 1)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (event) => {
    // Enter sends, Shift+Enter is a newline — never mid IME composition.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send()
    }
  }

  const insertEmoji = (emoji) => {
    const el = textareaRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    onChange(value.slice(0, start) + emoji + value.slice(end))
    setEmojiOpen(false)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  return (
    <div className="shrink-0 px-3 pt-2 md:px-8" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="group/composer mx-auto w-full max-w-205">
        {/* Quiet at rest; on focus it lifts slightly and takes a faint warm
            edge. Radius is concentric with the 10px send button + 6px padding. */}
        <div className="flex items-end gap-1 rounded-bubble border border-line bg-raised/70 p-1.5 transition-[border-color,background-color,box-shadow] duration-200 ease-out-soft hover:border-line-strong focus-within:border-brand/25 focus-within:bg-raised focus-within:shadow-[0_0_0_3px_rgb(244_162_97/0.06),0_12px_32px_-16px_rgb(0_0_0/0.8)]">
          <div className="relative">
            <IconButton
              icon={Smile}
              label="Emoji"
              tooltip="top"
              align="start"
              active={emojiOpen}
              aria-haspopup="menu"
              aria-expanded={emojiOpen}
              onClick={() => setEmojiOpen((open) => !open)}
            />
            <Menu open={emojiOpen} onClose={() => setEmojiOpen(false)} side="top" align="start" label="Emoji" className="w-75">
              <div className="grid grid-cols-8 gap-0.5 p-1">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    role="menuitem"
                    onClick={() => insertEmoji(emoji)}
                    className="flex size-8 items-center justify-center rounded-item text-[18px] outline-none transition-[background-color,transform] duration-150 hover:scale-110 hover:bg-hover focus-visible:bg-hover"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </Menu>
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? placeholder : 'Connecting…'}
            aria-label="Message"
            // 16px on touch screens: iOS zooms the page into any smaller input.
            className="min-h-9 flex-1 resize-none bg-transparent px-1.5 py-2 text-message text-fg caret-brand outline-none placeholder:text-fg-4 pointer-coarse:text-[16px]"
            style={{ maxHeight: MAX_HEIGHT }}
          />

          <motion.button
            type="button"
            onClick={send}
            disabled={!canSend}
            aria-label={isWaitingForConnection ? 'Waiting for connection' : 'Send message'}
            animate={{ scale: canSend ? 1 : 0.94 }}
            whileTap={canSend ? { scale: 0.88 } : undefined}
            transition={transitions.fast}
            className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-control transition-[color,box-shadow] duration-200 pointer-coarse:size-11 ${
              canSend ? 'brand-gradient text-brand-ink shadow-bubble' : 'cursor-not-allowed bg-active text-fg-4'
            }`}
          >
            {isWaitingForConnection ? (
              <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
            ) : (
              <motion.span
                key={sendCount}
                initial={sendCount ? { y: 14, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                transition={transitions.base}
                className="flex"
              >
                <ArrowUp size={18} strokeWidth={2.25} aria-hidden="true" />
              </motion.span>
            )}
          </motion.button>
        </div>

        <p
          aria-hidden="true"
          className={`mt-1.5 hidden h-4 items-center justify-end gap-3 px-2 text-meta text-fg-4 opacity-0 transition-opacity duration-200 md:flex ${
            value.trim() ? 'group-focus-within/composer:opacity-100' : ''
          }`}
        >
          <span className="flex items-center gap-1">
            <Kbd>Enter</Kbd> to send
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Shift</Kbd>
            <Kbd>Enter</Kbd> new line
          </span>
        </p>
      </div>
    </div>
  )
}

export default Composer
