import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CloudOff, Search, UserPlus, X } from 'lucide-react'
import { useMe } from '@/hooks/useAuth'
import { useGetOrCreateChat } from '@/hooks/useChats'
import { useUsers } from '@/hooks/useUsers'
import { ChatListSkeleton } from './ChatListSkeleton'
import UserRow from './UserRow'
import EmptyState from '@/components/common/EmptyState'
import { TypingBubble } from '@/components/common/TypingBubble'

const SectionLabel = ({ children }) => (
  <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-subtle-foreground first:mt-0">
    {children}
  </p>
)

const NewChatModal = ({ onClose }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const { data: allUsers, isLoading, error, refetch } = useUsers()
  const { data: me } = useMe()
  const { mutate: getOrCreateChat, isPending } = useGetOrCreateChat()

  const normalizedQuery = query.trim().toLowerCase()
  const matchesQuery = (user) =>
    !normalizedQuery ||
    user.name.toLowerCase().includes(normalizedQuery) ||
    user.email.toLowerCase().includes(normalizedQuery)

  const filteredUsers = allUsers?.filter(matchesQuery) ?? []
  const selfUser = me && matchesQuery(me) ? me : null

  const handleSelect = (user) => {
    if (isPending) return
    getOrCreateChat(user._id, {
      onSuccess: (chat) => {
        onClose()
        navigate(`/chats/${chat._id}`)
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[8vh] sm:items-center sm:pt-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-surface-dark/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="glass-panel relative flex max-h-[74vh] w-full max-w-md flex-col overflow-hidden rounded-3xl shadow-2xl shadow-black/40"
      >
        <div className="flex items-center gap-3 px-5 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-foreground">New chat</h2>
            <p className="text-xs text-subtle-foreground">Search for a user to start chatting</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-light text-subtle-foreground hover:text-foreground"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-5 pb-4">
          <div className="flex h-11 items-center gap-2 rounded-full border border-surface-light bg-surface px-4">
            <Search size={16} className="text-subtle-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users"
              className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-subtle-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-5">
          {isLoading ? (
            <ChatListSkeleton rows={5} />
          ) : error ? (
            <EmptyState
              icon={CloudOff}
              title="Failed to load users"
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-surface-dark"
                >
                  Retry
                </button>
              }
            />
          ) : filteredUsers.length === 0 && !selfUser ? (
            <EmptyState
              icon={UserPlus}
              title={normalizedQuery ? 'No users found' : 'Nobody to show yet'}
              subtitle={
                normalizedQuery ? `Nothing matches "${query.trim()}"` : 'New people will appear here once they join.'
              }
            />
          ) : (
            <>
              {selfUser ? (
                <>
                  <SectionLabel>You</SectionLabel>
                  <UserRow
                    user={selfUser}
                    subtitle="Message yourself"
                    showPresence={false}
                    disabled={isPending}
                    onSelect={() => handleSelect(selfUser)}
                  />
                </>
              ) : null}

              {filteredUsers.length > 0 ? <SectionLabel>Users</SectionLabel> : null}
              {filteredUsers.map((user) => (
                <UserRow
                  key={user._id}
                  user={user}
                  disabled={isPending}
                  onSelect={() => handleSelect(user)}
                />
              ))}
            </>
          )}
        </div>

        <AnimatePresence>
          {isPending ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center"
            >
              <TypingBubble label="Opening chat" dotSize={7} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default NewChatModal
