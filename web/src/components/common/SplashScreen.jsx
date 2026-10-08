import { motion } from 'framer-motion'
import { LogoMark } from '@/components/ui/Logo'
import { transitions } from '@/lib/motion'
import AuroraBackground from './AuroraBackground'
import { TypingBubble } from './TypingBubble'

/** Full-page loading state shown while Clerk resolves the session. */
const SplashScreen = () => (
  <div className="relative flex h-dvh w-screen items-center justify-center bg-canvas">
    <AuroraBackground />
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={transitions.slow}
      className="relative flex flex-col items-center gap-6"
      role="status"
      aria-label="Loading LowKey"
    >
      <div className="relative">
        <div className="animate-glow-pulse absolute -inset-6 -z-10 rounded-full bg-brand/20 blur-2xl" />
        <LogoMark size={64} tile />
      </div>
      <TypingBubble dotSize={5} />
    </motion.div>
  </div>
)

export default SplashScreen
