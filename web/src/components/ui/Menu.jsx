import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { transitions } from '@/lib/motion'
import { useEscapeLayer } from '@/lib/useEscapeLayer'

/**
 * Lightweight dropdown: click-away layer, Escape to close, arrow keys move
 * between items, and focus returns to the trigger when it closes. Wrap the
 * trigger and the menu in a `relative` element; `side`/`align` choose which
 * corner of it the menu opens from.
 */
export const Menu = ({ open, onClose, side = 'bottom', align = 'end', label, className = 'w-52', children }) => {
  const menuRef = useRef(null)
  useEscapeLayer(onClose, open)

  useEffect(() => {
    if (!open) return undefined
    const trigger = document.activeElement
    const menu = menuRef.current
    menu?.querySelector('[role="menuitem"]:not(:disabled)')?.focus()
    return () => {
      const focusIsLost = document.activeElement === document.body || menu?.contains(document.activeElement)
      if (focusIsLost && trigger instanceof HTMLElement) trigger.focus()
    }
  }, [open])

  const handleKeyDown = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')]
    if (items.length === 0) return
    const index = items.indexOf(document.activeElement)
    const step = event.key === 'ArrowDown' ? 1 : -1
    items[(index + step + items.length) % items.length].focus()
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, scale: 0.96, y: side === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={transitions.fast}
            style={{ transformOrigin: `${side === 'top' ? 'bottom' : 'top'} ${align === 'end' ? 'right' : 'left'}` }}
            className={`surface-float absolute z-50 rounded-card p-1 ${
              side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } ${align === 'end' ? 'right-0' : 'left-0'} ${className}`}
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export const MenuItem = ({ icon: Icon, tone = 'default', shortcut, onSelect, disabled, children }) => (
  <button
    type="button"
    role="menuitem"
    disabled={disabled}
    onClick={onSelect}
    className={`flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-ui outline-none transition-colors duration-150 disabled:opacity-40 ${
      tone === 'danger'
        ? 'text-danger hover:bg-danger/10 focus-visible:bg-danger/10'
        : 'text-fg-2 hover:bg-hover hover:text-fg focus-visible:bg-hover focus-visible:text-fg'
    }`}
  >
    {Icon ? <Icon size={15} aria-hidden="true" className="shrink-0" /> : null}
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {shortcut ? <span className="font-mono text-meta text-fg-4">{shortcut}</span> : null}
  </button>
)

export const MenuLabel = ({ children }) => (
  <div className="px-2.5 pb-1.5 pt-2">{children}</div>
)

export const MenuSeparator = () => <div role="separator" className="-mx-1 my-1 h-px bg-line" />
