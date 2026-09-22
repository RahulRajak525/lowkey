import { motion } from 'framer-motion'

const dotTransition = (index) => ({
  duration: 0.9,
  repeat: Infinity,
  ease: 'easeInOut',
  delay: index * 0.14,
})

/**
 * The "someone is typing" bubble — also reused as this app's loading
 * signature (a bouncing three-dot chat tail), matching the mobile app.
 */
export const TypingBubble = ({ label, dotSize = 8, dotColor = 'var(--color-primary)' }) => (
  <div className="flex items-center gap-3">
    <div
      className="flex items-end gap-1.5 rounded-2xl rounded-bl-md bg-surface-card px-4 py-3"
      style={{ gap: dotSize * 0.75 }}
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="block rounded-full"
          style={{ width: dotSize, height: dotSize, backgroundColor: dotColor }}
          animate={{ y: [0, -dotSize * 0.9, 0], opacity: [0.4, 1, 0.4] }}
          transition={dotTransition(index)}
        />
      ))}
    </div>
    {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
  </div>
)

export default TypingBubble
