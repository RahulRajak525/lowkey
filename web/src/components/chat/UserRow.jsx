import { ArrowRight } from 'lucide-react'
import Avatar from '@/components/common/Avatar'
import { useSocketStore } from '@/lib/socket'

const UserRow = ({ user, onSelect, disabled, subtitle, showPresence = true }) => {
  const { onlineUsers } = useSocketStore()
  const isOnline = showPresence && onlineUsers.has(user._id)

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-left outline-none transition-colors duration-150 [--avatar-ring:var(--color-raised)] hover:bg-hover hover:[--avatar-ring:var(--color-hover)] focus-visible:bg-hover disabled:opacity-50"
    >
      <Avatar user={user} size={36} online={isOnline} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-fg">{user.name}</p>
        <p className="truncate text-caption text-fg-3">{subtitle ?? user.email}</p>
      </div>
      <ArrowRight
        size={15}
        aria-hidden="true"
        className="shrink-0 -translate-x-1 text-fg-4 opacity-0 transition-[translate,opacity] duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
      />
    </button>
  )
}

export default UserRow
