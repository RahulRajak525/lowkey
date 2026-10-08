const Kbd = ({ children, className = '' }) => (
  <kbd
    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong bg-hover px-1.5 font-mono text-[10px] font-medium leading-none text-fg-3 ${className}`}
  >
    {children}
  </kbd>
)

export default Kbd
