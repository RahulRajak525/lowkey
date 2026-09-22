import AuroraBackground from './AuroraBackground'
import { TypingBubble } from './TypingBubble'

/** Full-page loading state shown while Clerk resolves the session. */
const SplashScreen = () => (
  <div className="relative flex h-screen w-screen items-center justify-center bg-surface-dark">
    <AuroraBackground />
    <div className="relative flex flex-col items-center gap-4">
      <span className="font-display text-2xl font-semibold gradient-text">Whisper</span>
      <TypingBubble dotColor="var(--color-primary)" />
    </div>
  </div>
)

export default SplashScreen
