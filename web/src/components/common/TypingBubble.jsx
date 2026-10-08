import { motion } from 'framer-motion'

const dotTransition = (index) => ({
  duration: 1,
  repeat: Infinity,
  ease: 'easeInOut',
  delay: index * 0.15,
})

/**
 * The "someone is typing" bubble — also reused as this app's loading
 * signature (three dots in a chat tail), matching the mobile app.
 */
export const TypingBubble = ({ label, dotSize = 6, dotColor = 'var(--color-brand)' }) => (
  <div className="flex items-center gap-2.5">
    <div
      className="flex items-center rounded-bubble rounded-bl-tail border border-line bg-raised px-3.5 py-2.5"
      style={{ gap: dotSize * 0.7 }}
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="block rounded-full"
          style={{ width: dotSize, height: dotSize, backgroundColor: dotColor }}
          animate={{ y: [0, -dotSize * 0.6, 0], opacity: [0.35, 1, 0.35] }}
          transition={dotTransition(index)}
        />
      ))}
    </div>
    {label ? <span className="text-ui text-fg-3">{label}</span> : null}
  </div>
)

export default TypingBubble
