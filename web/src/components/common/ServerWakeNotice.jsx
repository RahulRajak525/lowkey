import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { API_URL } from '@/lib/axios'
import { TypingBubble } from './TypingBubble'

// How long /health may take before it's treated as a cold start. A warm
// Render instance answers in well under this, so the notice never flashes.
const SLOW_AFTER_MS = 2500
const RETRY_EVERY_MS = 3000
const ATTEMPT_TIMEOUT_MS = 20000
// Render's free plan sleeps after ~15 min without traffic, so a tab left in
// the background for longer than this re-checks when it comes back.
const RECHECK_AFTER_HIDDEN_MS = 10 * 60 * 1000
const CONNECTED_VISIBLE_MS = 1800

const pingHealth = async () => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS)
  try {
    const response = await fetch(`${API_URL}/health`, { signal: controller.signal, cache: 'no-store' })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Tells the user when the API is waking from Render's free-tier sleep instead
 * of leaving them staring at a spinner for ~30s. Deliberately keeps no
 * persisted "seen" flag: every page load (and every return to a long-hidden
 * tab) measures /health afresh, so a visit after a long break gets the notice
 * again, and a warm server never shows it at all.
 */
const ServerWakeNotice = () => {
  // 'hidden' | 'waking' | 'connected'
  const [status, setStatus] = useState('hidden')

  useEffect(() => {
    // Bumped by every new check and by unmount, so a stale check stops.
    let latestRun = 0
    const check = async () => {
      const run = ++latestRun
      const isCurrent = () => run === latestRun

      let shown = false
      const slowTimer = setTimeout(() => {
        if (!isCurrent()) return
        shown = true
        setStatus('waking')
      }, SLOW_AFTER_MS)

      for (;;) {
        const started = Date.now()
        const ok = await pingHealth()
        if (!isCurrent()) return clearTimeout(slowTimer)
        if (ok) break
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, RETRY_EVERY_MS - (Date.now() - started))))
        if (!isCurrent()) return clearTimeout(slowTimer)
      }

      clearTimeout(slowTimer)
      // A fast answer never showed anything, so there's nothing to confirm.
      if (!shown) return
      setStatus('connected')
      setTimeout(() => {
        if (isCurrent()) setStatus('hidden')
      }, CONNECTED_VISIBLE_MS)
    }

    check()

    let hiddenAt = null
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt && Date.now() - hiddenAt >= RECHECK_AFTER_HIDDEN_MS) {
        hiddenAt = null
        check()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      latestRun++ // cancels any in-flight check
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <AnimatePresence>
        {status !== 'hidden' ? (
          <motion.div
            key="server-wake"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-panel pointer-events-auto w-full max-w-sm rounded-2xl px-4 py-3 shadow-2xl shadow-black/40"
          >
            {status === 'waking' ? (
              <div className="flex items-center gap-3">
                <TypingBubble dotSize={6} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Waking up the server…</p>
                  <p className="mt-0.5 text-xs text-subtle-foreground">
                    Whisper runs on a free server that naps when idle. This can take up to a minute —
                    thanks for your patience!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="shrink-0 text-primary" />
                <p className="text-sm font-semibold text-foreground">Server is awake — you’re all set!</p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default ServerWakeNotice
