import { Send } from 'lucide-react'
import { useEffect, useRef } from 'react'

const Composer = ({ value, onChange, onSend, canSend, isConnected }) => {
  const textareaRef = useRef(null)

  // Auto-grows with content up to a cap, then scrolls internally.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSend()
    }
  }

  return (
    <div className="flex items-end gap-3 border-t border-surface-light px-5 py-4">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isConnected ? 'Message' : 'Connecting…'}
        className="max-h-40 flex-1 resize-none rounded-2xl bg-surface-card px-4 py-3 text-[15px] text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
        className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-150 ${
          canSend
            ? 'bg-gradient-to-br from-primary-light to-primary-dark text-surface-dark shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'
            : 'cursor-not-allowed bg-surface-light text-subtle-foreground'
        }`}
      >
        <Send size={18} />
      </button>
    </div>
  )
}

export default Composer
