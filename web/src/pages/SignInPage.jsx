import { SignIn } from '@clerk/react'
import { motion } from 'framer-motion'
import { EyeOff, Lock, ShieldCheck, Zap } from 'lucide-react'
import AuroraBackground from '@/components/common/AuroraBackground'
import { TypingBubble } from '@/components/common/TypingBubble'
import Logo from '@/components/ui/Logo'
import { EASE } from '@/lib/motion'

const pillars = [
  {
    icon: Zap,
    title: 'Instant by design',
    body: 'Messages, presence and typing sync live over a persistent connection.',
  },
  {
    icon: EyeOff,
    title: 'Unlisted by default',
    body: 'There is no public directory. People reach you only with your exact email.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure sign-in',
    body: 'Google, Apple or email through Clerk. LowKey never stores a password.',
  },
]

const rise = (delay) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE, delay },
})

/** A static glimpse of a conversation, purely decorative. */
const ConversationPreview = () => (
  <div aria-hidden="true" className="animate-float w-full max-w-sm" style={{ animationDuration: '12s' }}>
    <div className="rounded-panel border border-line bg-panel/70 p-4 shadow-float backdrop-blur-md">
      <div className="flex items-center gap-2.5 border-b border-line pb-3">
        <div className="relative flex size-8 items-center justify-center rounded-full bg-active text-ui font-semibold text-fg-2">
          M
          <span className="absolute -bottom-px -right-px size-2.5 rounded-full border-2 border-panel bg-success" />
        </div>
        <div className="min-w-0">
          <p className="text-ui font-medium text-fg">Maya</p>
          <p className="text-meta text-fg-3">Active now</p>
        </div>
      </div>
      <div className="mt-3.5 flex flex-col gap-1.5">
        <p className="max-w-[80%] self-start rounded-bubble rounded-bl-tail border border-line bg-raised px-3 py-2 text-ui text-fg">
          Still on for tonight?
        </p>
        <p className="brand-gradient max-w-[80%] self-end rounded-bubble rounded-br-tail px-3 py-2 text-ui font-medium text-brand-ink shadow-bubble">
          Yes — 8pm. I&apos;ll grab a table.
        </p>
        <div className="mt-1 self-start">
          <TypingBubble dotSize={5} dotColor="var(--color-fg-3)" />
        </div>
      </div>
    </div>
  </div>
)

const SignInPage = () => (
  <div className="relative min-h-dvh w-full overflow-x-hidden bg-canvas">
    <AuroraBackground grid />

    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-295 flex-col px-5 py-6 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-16 lg:px-12 lg:py-10 xl:gap-24">
      {/* Brand story */}
      <section className="flex flex-col lg:min-h-[calc(100dvh-5rem)] lg:justify-between lg:self-stretch">
        <motion.div {...rise(0)}>
          <Logo />
        </motion.div>

        <div className="mt-10 lg:mt-0">
          <motion.p
            {...rise(0.05)}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-3 py-1 text-caption text-fg-2 backdrop-blur"
          >
            <span className="relative flex size-1.5">
              <span className="animate-ping-soft absolute inset-0 rounded-full bg-success" />
              <span className="relative size-1.5 rounded-full bg-success" />
            </span>
            Real-time messaging
          </motion.p>

          <motion.h1 {...rise(0.1)} className="mt-5 text-display font-semibold text-fg">
            Private. Fast.
            <br />
            <span className="font-serif text-[1.08em] font-normal italic tracking-[-0.02em] text-brand-hi">
              Personal.
            </span>
          </motion.h1>

          <motion.p {...rise(0.15)} className="mt-5 max-w-md text-body text-fg-2 sm:text-[15px] sm:leading-6">
            A quiet, real-time messenger for the people who matter. No feeds, no noise — just your
            conversations, the moment they happen.
          </motion.p>

          <motion.ul {...rise(0.2)} className="mt-10 hidden max-w-lg gap-5 lg:grid">
            {pillars.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-brand">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-body font-medium text-fg">{title}</span>
                  <span className="mt-0.5 block text-ui text-fg-3">{body}</span>
                </span>
              </li>
            ))}
          </motion.ul>

          <motion.div {...rise(0.3)} className="mt-12 hidden xl:block">
            <ConversationPreview />
          </motion.div>
        </div>

        <p className="hidden items-center gap-1.5 text-caption text-fg-4 lg:flex">
          <Lock size={12} aria-hidden="true" />
          Encrypted in transit · © {new Date().getFullYear()} LowKey
        </p>
      </section>

      {/* Authentication */}
      <motion.section
        {...rise(0.12)}
        className="mt-10 flex flex-1 flex-col items-center justify-center lg:mt-0"
        aria-label="Sign in"
      >
        <div className="relative w-full max-w-105">
          <div aria-hidden="true" className="absolute -inset-12 -z-10 rounded-full bg-brand/[0.07] blur-3xl" />
          {/* Gradient hairline border: a 1px gradient layer peeking out
              around the opaque card. */}
          <div
            aria-hidden="true"
            className="absolute -inset-px rounded-[21px] bg-linear-to-b from-white/14 via-white/5 to-white/2"
          />
          <div className="relative overflow-hidden rounded-panel bg-[#0f0f12]/95 shadow-float backdrop-blur-xl">
            <SignIn routing="path" path="/" />
          </div>
        </div>

        <p className="mt-5 flex items-center gap-1.5 text-caption text-fg-4">
          <ShieldCheck size={13} aria-hidden="true" />
          Protected sign-in · no passwords stored by LowKey
        </p>
      </motion.section>

      <p className="mt-10 flex items-center justify-center gap-1.5 text-caption text-fg-4 lg:hidden">
        <Lock size={12} aria-hidden="true" />
        Encrypted in transit · © {new Date().getFullYear()} LowKey
      </p>
    </div>
  </div>
)

export default SignInPage
