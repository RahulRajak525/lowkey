import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { fade, popIn, transitions } from '@/lib/motion'
import { useEscapeLayer } from '@/lib/useEscapeLayer'

const placements = {
  // A bottom sheet on phones, centered from `sm` up.
  center: 'items-end sm:items-center',
  // Top-aligned on phones so an autofocused input stays above the keyboard.
  top: 'items-start pt-[8vh] sm:items-center sm:pt-6',
}

/**
 * Modal shell: dimmed backdrop, floating panel, Escape to close, focus moved
 * into the panel on open and handed back to whatever opened it on close.
 * Render inside <AnimatePresence> so the exit animation plays.
 */
const Dialog = ({ onClose, labelledBy, placement = 'center', className = 'max-w-md', children }) => {
  const panelRef = useRef(null)
  useEscapeLayer(onClose)

  useEffect(() => {
    const opener = document.activeElement
    const panel = panelRef.current
    // An autoFocus field inside has already taken focus; otherwise focus the
    // panel itself rather than guessing at a button.
    if (panel && !panel.contains(document.activeElement)) panel.focus()
    return () => {
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [])

  return (
    <div className={`fixed inset-0 z-50 flex justify-center p-3 sm:p-6 ${placements[placement]}`}>
      <motion.div
        {...fade}
        transition={transitions.base}
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-canvas/75"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        {...popIn}
        transition={transitions.base}
        className={`surface-float relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-panel outline-none ${className}`}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default Dialog
