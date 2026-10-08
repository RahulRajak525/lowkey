// Uneven on purpose, so the placeholder reads as conversations rather than a table.
const rowWidths = [
  ['46%', '78%'],
  ['34%', '62%'],
  ['52%', '70%'],
  ['40%', '84%'],
  ['30%', '58%'],
  ['48%', '74%'],
  ['38%', '66%'],
]

/** Rows match ChatListItem's metrics so nothing jumps when real rows land. */
export const ChatListSkeleton = ({ rows = 7 }) => (
  <div className="flex flex-col gap-0.5" role="status" aria-label="Loading conversations">
    {rowWidths.slice(0, rows).map(([name, preview], index) => (
      <div
        key={index}
        className="animate-breathe flex items-center gap-3 px-2.5 py-2.5"
        style={{ animationDelay: `${index * 110}ms` }}
      >
        <div className="size-10 shrink-0 rounded-full bg-active" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-6">
            <div className="h-2.5 rounded-full bg-active" style={{ width: name }} />
            <div className="h-2 w-8 rounded-full bg-hover" />
          </div>
          <div className="h-2 rounded-full bg-hover" style={{ width: preview }} />
        </div>
      </div>
    ))}
  </div>
)

export default ChatListSkeleton
