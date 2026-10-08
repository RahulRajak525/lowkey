/**
 * Empty/error placeholder used across the chat list, thread, and user
 * picker. `icon` takes a lucide-react component; `size="lg"` is for the
 * full-pane states (no conversation selected).
 */
const EmptyState = ({ icon: Icon, title, subtitle, action, size = 'md', className = '' }) => {
  const isLarge = size === 'lg'

  return (
    <div
      className={`animate-fade-in flex flex-1 flex-col items-center justify-center px-8 py-14 text-center ${className}`}
    >
      {Icon ? (
        <div
          className={`mb-5 flex items-center justify-center rounded-card border border-line bg-raised text-fg-3 shadow-raised ${
            isLarge ? 'size-14' : 'size-11'
          }`}
        >
          <Icon size={isLarge ? 22 : 18} aria-hidden="true" />
        </div>
      ) : null}
      <p className={`font-semibold text-fg ${isLarge ? 'text-heading' : 'text-body'}`}>{title}</p>
      {subtitle ? (
        <p className={`mt-1.5 max-w-xs text-fg-3 ${isLarge ? 'text-body' : 'text-ui'}`}>{subtitle}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export default EmptyState
