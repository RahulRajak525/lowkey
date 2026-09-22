import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { MessagesSquare } from 'lucide-react'
import Sidebar from '@/components/chat/Sidebar'
import MessageThread from '@/components/chat/MessageThread'
import NewChatModal from '@/components/chat/NewChatModal'
import EmptyState from '@/components/common/EmptyState'
import AuroraBackground from '@/components/common/AuroraBackground'

/**
 * The two-pane messenger shell. On narrow viewports the two panes are
 * mutually exclusive full-width screens — the chat list, or the open
 * thread — exactly like the mobile app's list/detail navigation; on wider
 * viewports both are visible side by side.
 */
const ChatsLayout = () => {
  const { chatId } = useParams()
  const [isNewChatOpen, setNewChatOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-dark">
      <aside
        className={`w-full shrink-0 border-r border-surface-light bg-surface md:block md:w-[380px] ${
          chatId ? 'hidden' : 'block'
        }`}
      >
        <Sidebar onNewChat={() => setNewChatOpen(true)} />
      </aside>

      <main className={`relative flex-1 ${chatId ? 'flex' : 'hidden md:flex'}`}>
        {chatId ? (
          // Keyed by chatId so switching conversations remounts the thread —
          // draft text, typing timers and scroll position should not leak
          // from one chat into the next.
          <MessageThread key={chatId} chatId={chatId} />
        ) : (
          <div className="relative flex flex-1 items-center justify-center">
            <AuroraBackground />
            <div className="relative">
              <EmptyState
                icon={MessagesSquare}
                title="Select a conversation"
                subtitle="Choose a chat from the list, or start a new one."
              />
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {isNewChatOpen ? <NewChatModal onClose={() => setNewChatOpen(false)} /> : null}
      </AnimatePresence>
    </div>
  )
}

export default ChatsLayout
