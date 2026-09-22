const initials = (name) => name?.[0]?.toUpperCase() ?? '?'

/**
 * Falls back to a gradient initial when the user has no avatar image — the
 * gradient uses the brand colors so every "unset avatar" still feels
 * designed rather than a placeholder.
 */
const Avatar = ({ user, size = 44, online = false, className = '' }) => {
  const px = `${size}px`
  const dot = Math.max(10, Math.round(size * 0.28))

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: px, height: px }}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name ?? ''}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary-light to-primary-dark font-display font-semibold text-surface-dark"
          style={{ fontSize: size * 0.42 }}
        >
          {initials(user?.name)}
        </div>
      )}
      {online ? (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-surface bg-emerald-400"
          style={{ width: dot, height: dot }}
        />
      ) : null}
    </div>
  )
}

export default Avatar
