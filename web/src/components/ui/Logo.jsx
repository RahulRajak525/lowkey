import { useId } from 'react'

/**
 * The LowKey mark: the favicon's gradient chat bubble with three "typing"
 * dots. `tile` adds the dark rounded square it sits on in the favicon.
 */
export const LogoMark = ({ size = 28, tile = false, className = '' }) => {
  // useId output isn't guaranteed to be a valid url(#id) reference.
  const gradientId = `lk-${useId().replace(/[^\w-]/g, '')}`

  return (
    <svg
      width={size}
      height={size}
      viewBox={tile ? '0 0 48 48' : '7 7 34 34'}
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="9" x2="38" y2="39" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F8BD8F" />
          <stop offset="1" stopColor="#E76F51" />
        </linearGradient>
      </defs>
      {tile ? (
        <rect x="2.5" y="2.5" width="43" height="43" rx="13.5" fill="#0E0E11" stroke="rgb(255 255 255 / 0.1)" />
      ) : null}
      <path
        d="M24 9c-7.732 0-14 5.85-14 13.07 0 3.94 1.87 7.47 4.83 9.86-.16 1.9-.78 3.55-1.83 4.9a.75.75 0 0 0 .78 1.19c2.62-.6 4.85-1.77 6.6-3.2 1.14.27 2.34.41 3.6.41 7.732 0 14-5.85 14-13.16S31.732 9 24 9Z"
        fill={`url(#${gradientId})`}
      />
      <circle cx="17.5" cy="22.5" r="2.15" fill="#1C1009" />
      <circle cx="24" cy="22.5" r="2.15" fill="#1C1009" />
      <circle cx="30.5" cy="22.5" r="2.15" fill="#1C1009" />
    </svg>
  )
}

const Logo = ({ size = 24, className = '', wordmarkClassName = 'text-title' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <LogoMark size={size} />
    <span className={`font-semibold tracking-[-0.025em] text-fg ${wordmarkClassName}`}>LowKey</span>
  </span>
)

export default Logo
