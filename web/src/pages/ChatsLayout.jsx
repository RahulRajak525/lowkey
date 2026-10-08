import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MessagesSquare, SquarePen } from 'lucide-react'
import Sidebar from '@/components/chat/Sidebar'
import MessageThread from '@/components/chat/MessageThread'
import NewChatModal from '@/components/chat/NewChatModal'
import ChatDetailsPanel from '@/components/chat/ChatDetailsPanel'
import EmptyState from '@/components/common/EmptyState'
import AuroraBackground from '@/components/common/AuroraBackground'
import Button from '@/components/ui/Button'
import Kbd from '@/components/ui/Kbd'
import { useChats } from '@/hooks/useChats'
import { transitions } from '@/lib/motion'
import { modKeyLabel } from '@/lib/platform'
import { hasParticipant } from '@/lib/types'
import { useMediaQuery } from '@/lib/useMediaQuery'

/**
 * The messenger shell, in up to three zones: conversation list, open thread,
 * and an optional details panel.
 *
 * - Phones: list and thread are mutually exclusive full screens, like the
 *   mobile app's list/detail navigation; the thread slides in.
 * - Tablet and laptop: list + thread side by side; details is a drawer.
 * - Wide (≥1280px): details docks as a third column and stays open as you
 *   move between conversations.
 */
const ChatsLayout = () => {
  const { chatId } = useParams()
  const [isNewChatOpen, setNewChatOpen] = useState(false)
  const [details, setDetails] = useState({ open: false, chatId: null })
  const isWide = useMediaQuery('(min-width: 1280px)')
  const isPhone = !useMediaQuery('(min-width: 768px)')
  const { data: chats } = useChats()

  const chat = chats?.find((candidate) => candidate._id === chatId)
  const detailsChat = chat && hasParticipant(chat) ? chat : null
  // The drawer belongs to the chat it was opened on; the docked column
  // follows whichever chat is open.
  const isDetailsOpen = Boolean(detailsChat) && details.open && (isWide || details.chatId === chatId)

  const toggleDetails = () => setDetails({ open: !isDetailsOpen, chatId })
  const closeDetails = () => setDetails({ open: false, chatId: null })

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      <aside
        className={`w-full shrink-0 border-r border-line bg-panel md:block md:w-75 lg:w-[320px] 2xl:w-90 ${
          chatId ? 'hidden' : 'block'
        }`}
      >
        <Sidebar onNewChat={() => setNewChatOpen(true)} />
      </aside>

      <main className={`relative min-w-0 flex-1 ${chatId ? 'flex' : 'hidden md:flex'}`}>
        {chatId ? (
          // Keyed by chatId so switching conversations remounts the thread —
          // draft text, typing timers and scroll position should not leak
          // from one chat into the next.
          <motion.div
            key={chatId}
            initial={isPhone ? { x: 28, opacity: 0 } : { y: 6, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={transitions.base}
            className="flex min-w-0 flex-1"
          >
            <MessageThread chatId={chatId} detailsOpen={isDetailsOpen} onToggleDetails={toggleDetails} />
          </motion.div>
        ) : (
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <AuroraBackground />
            <div className="relative">
              <EmptyState
                size="lg"
                icon={MessagesSquare}
                title="Your conversations, in one place."
                subtitle="Select a conversation to start messaging."
                action={
                  <div className="flex flex-col items-center gap-4">
                    <Button variant="primary" icon={SquarePen} onClick={() => setNewChatOpen(true)}>
                      New conversation
                    </Button>
                    <p className="flex items-center gap-1.5 text-caption text-fg-4">
                      <Kbd>{modKeyLabel}</Kbd>
                      <Kbd>K</Kbd>
                      <span className="ml-0.5">to search</span>
                    </p>
                  </div>
                }
              />
            </div>
          </div>
        )}
      </main>

      {isWide ? (
        <AnimatePresence initial={false}>
          {isDetailsOpen ? (
            <ChatDetailsPanel key="details" variant="inline" chat={detailsChat} onClose={closeDetails} />
          ) : null}
        </AnimatePresence>
      ) : (
        <AnimatePresence>
          {isDetailsOpen ? (
            <ChatDetailsPanel key="details" variant="overlay" chat={detailsChat} onClose={closeDetails} />
          ) : null}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {isNewChatOpen ? <NewChatModal onClose={() => setNewChatOpen(false)} /> : null}
      </AnimatePresence>
    </div>
  )
}

export default ChatsLayout
