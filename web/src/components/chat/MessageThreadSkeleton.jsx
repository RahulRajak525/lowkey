const bubbles = [
  ['start', 'w-44'],
  ['start', 'w-60'],
  ['end', 'w-36'],
  ['start', 'w-52'],
  ['end', 'w-64'],
  ['end', 'w-40'],
]

export const MessageThreadSkeleton = () => (
  <div
    className="mx-auto flex w-full max-w-205 flex-1 flex-col justify-end gap-2 px-4 py-6 md:px-8"
    role="status"
    aria-label="Loading messages"
  >
    {bubbles.map(([side, width], index) => (
      <div
        key={index}
        className={`animate-breathe h-9 max-w-[80%] rounded-bubble ${width} ${
          side === 'end' ? 'self-end rounded-br-tail bg-brand/15' : 'self-start rounded-bl-tail bg-raised'
        }`}
        style={{ animationDelay: `${index * 110}ms` }}
      />
    ))}
  </div>
)

export default MessageThreadSkeleton
