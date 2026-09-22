const bubbleWidths = ['w-40', 'w-56', 'w-32', 'w-64', 'w-44', 'w-52']

export const MessageThreadSkeleton = () => (
  <div className="flex flex-1 flex-col justify-end gap-3 px-6 py-6">
    {bubbleWidths.map((width, index) => (
      <div
        key={index}
        className={`h-10 ${width} animate-pulse rounded-2xl bg-surface-light ${
          index % 2 === 0 ? 'self-start' : 'self-end'
        }`}
      />
    ))}
  </div>
)

export default MessageThreadSkeleton
