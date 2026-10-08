import { LoaderCircle } from 'lucide-react'

const variants = {
  primary: 'brand-gradient text-brand-ink shadow-bubble hover:brightness-[1.05] active:brightness-95',
  secondary: 'border border-line-strong bg-raised text-fg hover:bg-hover',
  ghost: 'text-fg-2 hover:bg-hover hover:text-fg',
  danger: 'border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15',
}

const sizes = {
  sm: 'h-8 gap-1.5 px-3 text-ui',
  md: 'h-10 gap-2 px-4 text-ui',
  lg: 'h-11 gap-2 px-5 text-body',
}

/** Text button. `loading` swaps the leading icon for a spinner and disables it. */
const Button = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon: Icon,
  trailingIcon: TrailingIcon,
  type = 'button',
  disabled,
  className = '',
  children,
  ref,
  ...rest
}) => (
  <button
    ref={ref}
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`inline-flex shrink-0 items-center justify-center rounded-control font-medium transition-[background-color,color,border-color,filter,transform] duration-150 ease-out-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    {...rest}
  >
    {loading ? (
      <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
    ) : Icon ? (
      <Icon size={15} aria-hidden="true" />
    ) : null}
    {children}
    {TrailingIcon && !loading ? <TrailingIcon size={15} aria-hidden="true" /> : null}
  </button>
)

export default Button
