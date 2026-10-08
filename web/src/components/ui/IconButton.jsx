const sizes = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
}

const iconSizes = { sm: 16, md: 18, lg: 18 }

const variants = {
  ghost: 'text-fg-3 hover:bg-hover hover:text-fg',
  subtle: 'border border-line bg-raised text-fg-2 hover:border-line-strong hover:bg-hover hover:text-fg',
  brand: 'brand-gradient text-brand-ink shadow-bubble hover:brightness-[1.05]',
}

const tooltipAlign = {
  center: 'left-1/2 -translate-x-1/2',
  start: 'left-0',
  end: 'right-0',
}

/**
 * Square icon-only button. `label` is both the accessible name and a small
 * tooltip shown on hover/keyboard focus (pass `tooltip={false}` to skip it).
 */
const IconButton = ({
  icon: Icon,
  label,
  size = 'md',
  variant = 'ghost',
  active = false,
  tooltip = 'bottom',
  align = 'center',
  className = '',
  ref,
  ...rest
}) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    className={`group/ib relative inline-flex shrink-0 items-center justify-center rounded-control transition-[background-color,color,border-color,transform,filter] duration-150 ease-out-soft active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 ${sizes[size]} ${
      active ? 'bg-active text-fg' : variants[variant]
    } ${className}`}
    {...rest}
  >
    <Icon size={iconSizes[size]} aria-hidden="true" />
    {tooltip ? (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-[7px] border border-line-strong bg-raised px-2 py-1 text-meta font-medium text-fg-2 opacity-0 shadow-float transition-opacity duration-150 group-hover/ib:opacity-100 group-hover/ib:delay-500 group-focus-visible/ib:opacity-100 ${
          tooltip === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        } ${tooltipAlign[align]}`}
      >
        {label}
      </span>
    ) : null}
  </button>
)

export default IconButton
