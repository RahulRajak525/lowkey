import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CloudOff, Loader2, Mail, Search, UserPlus, X } from 'lucide-react'
import { useMe } from '@/hooks/useAuth'
import { useGetOrCreateChat } from '@/hooks/useChats'
import { isLikelyEmail, useSearchUserByEmail } from '@/hooks/useUsers'
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

  const { data: me } = useMe()
  const { mutate: getOrCreateChat, isPending } = useGetOrCreateChat()

  const trimmedQuery = query.trim()
  // There is no "browse everyone" endpoint — someone can only be found by
  // already knowing their exact email — so a query never fires until the
  // text actually looks like a complete address.
  const looksLikeEmail = isLikelyEmail(trimmedQuery)
  const {
    data: foundUser,
    isFetching: isSearching,
    error: searchError,
    refetch: retrySearch,
  } = useSearchUserByEmail(trimmedQuery)

  // With the search box empty there is nothing to look up yet, so the only
  // option offered is the always-available self chat.
  const showingSelf = trimmedQuery.length === 0

  const handleSelect = (user) => {
    if (isPending) return
    getOrCreateChat(user._id, {
      onSuccess: (chat) => {
        onClose()
        navigate(`/chats/${chat._id}`)
      },
    })
  }

  const renderBody = () => {
    if (showingSelf) {
      return (
        <>
          {me ? (
            <>
              <SectionLabel>You</SectionLabel>
              <UserRow
                user={me}
                subtitle="Message yourself"
                showPresence={false}
                disabled={isPending}
                onSelect={() => handleSelect(me)}
              />
            </>
          ) : null}
          <p className="px-3 pt-8 text-center text-sm text-subtle-foreground">
            Enter someone&apos;s email above to start a new conversation with them.
          </p>
        </>
      )
    }

    if (!looksLikeEmail) {
      return (
        <EmptyState
          icon={Mail}
          title="Keep typing…"
          subtitle="Enter a full email address to search, e.g. name@example.com"
        />
      )
    }

    if (isSearching) {
      return (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-subtle-foreground" />
        </div>
      )
    }

    if (searchError) {
      return (
        <EmptyState
          icon={CloudOff}
          title="Search failed"
          action={
            <button
              type="button"
              onClick={() => retrySearch()}
              className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-surface-dark"
            >
              Retry
            </button>
          }
        />
      )
    }

    if (!foundUser) {
      return (
        <EmptyState
          icon={UserPlus}
          title="No user found"
          subtitle={`Nobody is signed up with "${trimmedQuery}"`}
        />
      )
    }

    return (
      <>
        <SectionLabel>Found</SectionLabel>
        <UserRow user={foundUser} disabled={isPending} onSelect={() => handleSelect(foundUser)} />
      </>
    )
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
            <p className="text-xs text-subtle-foreground">Find someone by their email address</p>
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
              type="email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by email"
              className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-subtle-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-5">{renderBody()}</div>

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
