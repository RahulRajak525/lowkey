/**
 * Decorative, non-interactive glow blobs used behind hero/empty panels.
 * Pure CSS animation (float/glow-pulse from index.css) — no canvas or JS
 * animation loop, so it costs nothing while sitting behind real content.
 */
const AuroraBackground = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div
      className="animate-float absolute -left-32 -top-32 size-[26rem] rounded-full opacity-40 blur-3xl"
      style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}
    />
    <div
      className="animate-float absolute -bottom-40 -right-20 size-[30rem] rounded-full opacity-30 blur-3xl"
      style={{
        background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
        animationDelay: '-3.5s',
      }}
    />
    <div
      className="animate-glow-pulse absolute left-1/3 top-1/2 size-72 rounded-full opacity-20 blur-3xl"
      style={{ background: 'radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%)' }}
    />
  </div>
)

export default AuroraBackground
