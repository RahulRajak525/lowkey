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
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-surface-card disabled:opacity-50"
    >
      <Avatar user={user} size={42} online={isOnline} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-foreground">{user.name}</p>
        <p className="truncate text-xs text-subtle-foreground">{subtitle ?? user.email}</p>
      </div>
    </button>
  )
}

export default UserRow
