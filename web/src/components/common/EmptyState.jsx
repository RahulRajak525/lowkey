/**
 * Generic empty/error placeholder used across the chat list, thread, and
 * user picker. `icon` takes a lucide-react component so callers stay in
 * control of which glyph fits the moment.
 */
const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
    {Icon ? (
      <div className="flex size-16 items-center justify-center rounded-2xl bg-surface-card text-subtle-foreground">
        <Icon size={30} strokeWidth={1.5} />
      </div>
    ) : null}
    <div>
      <p className="text-base font-medium text-foreground">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-subtle-foreground">{subtitle}</p> : null}
    </div>
    {action}
  </div>
)

export default EmptyState
