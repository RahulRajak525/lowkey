import { SignIn } from '@clerk/react'
import { dark } from '@clerk/themes'
import { motion } from 'framer-motion'
import { MessageCircle, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import AuroraBackground from '@/components/common/AuroraBackground'

const highlights = [
  {
    icon: Zap,
    title: 'Real-time, always',
    subtitle: 'Messages, presence and typing indicators sync instantly over a live socket.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    subtitle: 'Authentication is handled end-to-end by Clerk — no passwords to manage.',
  },
  {
    icon: Sparkles,
    title: 'Built for focus',
    subtitle: 'A calm, distraction-free surface that keeps every conversation close at hand.',
  },
]

const clerkAppearance = {
  theme: dark,
  variables: {
    colorPrimary: '#F4A261',
    colorBackground: '#1A1A1D',
    colorInput: '#242428',
    colorInputForeground: '#FFFFFF',
    colorForeground: '#FFFFFF',
    colorMutedForeground: '#A0A0A5',
    colorNeutral: '#FFFFFF',
    borderRadius: '1rem',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  elements: {
    card: 'shadow-none bg-transparent',
    rootBox: 'w-full',
  },
}

const SignInPage = () => (
  <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-surface-dark lg:flex-row">
    <AuroraBackground />

    <div className="relative z-10 flex flex-1 flex-col justify-between px-8 py-10 lg:px-16 lg:py-14">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-light to-primary-dark">
          <MessageCircle size={18} className="text-surface-dark" strokeWidth={2.5} />
        </div>
        <span className="font-display text-xl font-semibold text-foreground">Whisper</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-lg py-16 lg:py-0"
      >
        <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          Conversations, <span className="gradient-text">reimagined.</span>
        </h1>
        <p className="mt-5 text-base text-muted-foreground sm:text-lg">
          A fast, focused messenger built for the moments that matter — with presence, typing
          indicators, and delivery that feels instant.
        </p>

        <div className="mt-10 flex flex-col gap-5">
          {highlights.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-card text-primary">
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="mt-0.5 text-sm text-subtle-foreground">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <p className="text-xs text-subtle-foreground">Whisper &middot; real-time messaging</p>
    </div>

    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      className="relative z-10 flex flex-1 items-center justify-center px-6 pb-14 lg:pb-6"
    >
      <div className="glass-panel w-full max-w-sm rounded-3xl p-2 shadow-2xl shadow-black/40 sm:p-4">
        <SignIn routing="path" path="/" appearance={clerkAppearance} />
      </div>
    </motion.div>
  </div>
)

export default SignInPage
