/**
 * Atmospheric lighting behind hero and empty panels: a warm key light, a
 * faint violet fill, a top highlight and film grain. Soft radial gradients,
 * no blur filters. Static by default; `animated` lets the lights drift
 * slowly (used only on the sign-in page, so nothing loops behind the app).
 * `grid` adds a faint dot grid that fades out from the center.
 */
const AuroraBackground = ({ grid = false, animated = false, className = '' }) => (
  <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
    <div
      className={`absolute -left-[12%] -top-[28%] size-[48rem] rounded-full opacity-[0.2] ${animated ? 'animate-float' : ''}`}
      style={{ background: 'radial-gradient(circle, var(--color-brand) 0%, transparent 62%)' }}
    />
    <div
      className={`absolute -bottom-[32%] -right-[14%] size-[44rem] rounded-full opacity-[0.13] ${animated ? 'animate-float' : ''}`}
      style={{
        background: 'radial-gradient(circle, var(--color-iris) 0%, transparent 62%)',
        animationDelay: '-4.5s',
      }}
    />
    <div
      className="absolute inset-0"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgb(255 255 255 / 0.045), transparent 70%)' }}
    />
    {grid ? (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent 75%)',
        }}
      />
    ) : null}
    <div className="noise absolute inset-0" />
  </div>
)

export default AuroraBackground
