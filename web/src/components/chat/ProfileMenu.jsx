import { useState } from 'react'
import { useClerk, useUser } from '@clerk/react'
import { LogOut, UserRound } from 'lucide-react'
import Avatar from '@/components/common/Avatar'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components/ui/Menu'
import { useSocketStore } from '@/lib/socket'

/**
 * The signed-in user's avatar and account menu — the same two actions
 * Clerk's <UserButton/> offered (manage account, sign out), in LowKey's own
 * styling, plus the live connection state.
 */
const ProfileMenu = () => {
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  const { isConnected } = useSocketStore()
  const [open, setOpen] = useState(false)

  const name = user?.fullName || user?.username || 'You'
  const email = user?.primaryEmailAddress?.emailAddress
  // Clerk always has an imageUrl (a generated one when unset); prefer
  // LowKey's own initials over that.
  const avatarUser = { _id: user?.id, name, avatar: user?.hasImage ? user.imageUrl : undefined }

  const close = () => setOpen(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex rounded-full transition-opacity duration-150 hover:opacity-85"
      >
        <Avatar user={avatarUser} size={30} />
      </button>

      <Menu open={open} onClose={close} align="end" label="Account" className="w-64">
        <MenuLabel>
          <div className="flex items-center gap-2.5">
            <Avatar user={avatarUser} size={36} />
            <div className="min-w-0">
              <p className="truncate text-body font-medium text-fg">{name}</p>
              {email ? <p className="truncate text-caption text-fg-3">{email}</p> : null}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-meta text-fg-3">
            <span
              className={`size-1.5 rounded-full ${isConnected ? 'bg-success' : 'animate-breathe bg-warning'}`}
            />
            {isConnected ? 'Connected' : 'Connecting…'}
          </p>
        </MenuLabel>
        <MenuSeparator />
        <MenuItem
          icon={UserRound}
          onSelect={() => {
            close()
            openUserProfile()
          }}
        >
          Manage account
        </MenuItem>
        <MenuItem
          icon={LogOut}
          onSelect={() => {
            close()
            signOut({ redirectUrl: '/' })
          }}
        >
          Sign out
        </MenuItem>
      </Menu>
    </div>
  )
}

export default ProfileMenu
