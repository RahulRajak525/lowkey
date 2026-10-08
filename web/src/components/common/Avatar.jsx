const initials = (name) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}

// A stable hue per person, so an unset avatar is still recognisable.
const hueOf = (seed = '') => {
  let hue = 0
  for (const char of seed) hue = (hue * 31 + char.codePointAt(0)) % 360
  return hue
}

/**
 * Photo, or initials on a low-saturation tint. The presence dot is outlined
 * in `--avatar-ring` (set by the row it sits on) so it reads as cut out of
 * whatever surface is behind it, including hover states.
 */
const Avatar = ({ user, size = 40, online = false, className = '' }) => {
  const dot = Math.max(8, Math.round(size * 0.24))
  const hue = hueOf(user?._id ?? user?.name)

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {user?.avatar ? (
        <img src={user.avatar} alt="" draggable={false} className="size-full rounded-full object-cover" />
      ) : (
        <div
          className="flex size-full select-none items-center justify-center rounded-full font-medium tracking-tight"
          style={{
            fontSize: Math.round(size * 0.36),
            background: `linear-gradient(160deg, hsl(${hue} 30% 27%), hsl(${hue} 26% 17%))`,
            color: `hsl(${hue} 50% 84%)`,
          }}
        >
          {initials(user?.name)}
        </div>
      )}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/[0.07]" />
      <span
        aria-hidden="true"
        className={`absolute bottom-0 right-0 rounded-full bg-success transition-[transform,opacity] duration-200 ease-out-soft ${
          online ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
        style={{ width: dot, height: dot, boxShadow: '0 0 0 2px var(--avatar-ring, var(--color-panel))' }}
      />
    </div>
  )
}

export default Avatar
