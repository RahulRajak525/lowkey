const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="size-12 shrink-0 animate-pulse rounded-full bg-surface-light" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-2/5 animate-pulse rounded-full bg-surface-light" />
      <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-surface-light" />
    </div>
  </div>
)

export const ChatListSkeleton = ({ rows = 7 }) => (
  <div className="flex flex-col">
    {Array.from({ length: rows }).map((_, index) => (
      <SkeletonRow key={index} />
    ))}
  </div>
)

export default ChatListSkeleton
