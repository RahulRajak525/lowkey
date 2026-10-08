import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CloudOff, EyeOff, Mail, RefreshCw, UserPlus, X } from 'lucide-react'
import { useMe } from '@/hooks/useAuth'
import { useGetOrCreateChat } from '@/hooks/useChats'
import { isLikelyEmail, useSearchUserByEmail } from '@/hooks/useUsers'
import { fadeUp, transitions } from '@/lib/motion'
import EmptyState from '@/components/common/EmptyState'
import { TypingBubble } from '@/components/common/TypingBubble'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import IconButton from '@/components/ui/IconButton'
import Kbd from '@/components/ui/Kbd'
import UserRow from './UserRow'

const SectionLabel = ({ children }) => (
  <p className="mb-1 mt-3 px-2.5 text-meta font-medium uppercase tracking-[0.08em] text-fg-4 first:mt-1">
    {children}
  </p>
)

const NewChatModal = ({ onClose }) => {
  const navigate = useNavigate()
  const titleId = useId()
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
          <p className="mx-auto max-w-xs px-3 pb-4 pt-8 text-center text-ui text-fg-3">
            Enter someone&apos;s email above to start a conversation with them.
          </p>
        </>
      )
    }

    if (!looksLikeEmail) {
      return (
        <EmptyState
          icon={Mail}
          title="Keep typing…"
          subtitle="Enter a full email address, e.g. name@example.com"
        />
      )
    }

    if (isSearching) {
      return (
        <div className="flex flex-1 items-center justify-center py-14">
          <TypingBubble label="Searching" dotSize={5} />
        </div>
      )
    }

    if (searchError) {
      return (
        <EmptyState
          icon={CloudOff}
          title="Search failed"
          subtitle="Check your connection and try again."
          action={
            <Button size="sm" icon={RefreshCw} onClick={() => retrySearch()}>
              Retry
            </Button>
          }
        />
      )
    }

    if (!foundUser) {
      return (
        <EmptyState icon={UserPlus} title="No one found" subtitle={`Nobody is signed up with “${trimmedQuery}”.`} />
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
    <Dialog onClose={onClose} labelledBy={titleId} placement="top" className="max-w-md">
      <div className="flex items-start gap-3 px-5 pb-4 pt-5">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-title font-semibold text-fg">
            New conversation
          </h2>
          <p className="mt-0.5 text-ui text-fg-3">Find someone by their exact email address.</p>
        </div>
        <IconButton icon={X} label="Close" size="sm" tooltip={false} onClick={onClose} className="-mr-1.5 -mt-1" />
      </div>

      <div className="px-5 pb-3">
        <label className="flex h-11 items-center gap-2.5 rounded-control border border-line-strong bg-panel px-3.5 transition-[border-color,box-shadow] duration-150 ease-out-soft focus-within:border-brand/45 focus-within:shadow-[0_0_0_4px_rgb(244_162_97/0.1)]">
          <Mail size={16} className="shrink-0 text-fg-3" aria-hidden="true" />
          <input
            autoFocus
            type="email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="name@example.com"
            aria-label="Email address"
            className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-4"
          />
        </label>
      </div>

      <div className="flex min-h-52 flex-1 flex-col overflow-y-auto px-3 pb-3">{renderBody()}</div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-caption text-fg-4">
        <span className="flex items-center gap-1.5">
          <EyeOff size={13} aria-hidden="true" />
          No public directory
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <Kbd>Esc</Kbd>
          to close
        </span>
      </div>

      <AnimatePresence>
        {isPending ? (
          <motion.div
            {...fadeUp}
            transition={transitions.base}
            className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center"
          >
            <TypingBubble label="Opening chat" dotSize={5} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Dialog>
  )
}

export default NewChatModal
