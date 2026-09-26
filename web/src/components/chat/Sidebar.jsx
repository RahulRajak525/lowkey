import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { CloudOff, MessageSquareDashed, Plus, Search, Trash2 } from 'lucide-react'
import { useChats, useDeleteAllChats, useDeleteChat } from '@/hooks/useChats'
import { hasParticipant } from '@/lib/types'
import ChatListItem from './ChatListItem'
import { ChatListSkeleton } from './ChatListSkeleton'
import EmptyState from '@/components/common/EmptyState'

const Sidebar = ({ onNewChat }) => {
  const { data: chats, isLoading, error, refetch } = useChats()
  const { mutate: deleteChat } = useDeleteChat()
  const { mutate: deleteAllChats, isPending: isDeletingAll } = useDeleteAllChats()
  const navigate = useNavigate()
  const { chatId: openChatId } = useParams()
  const [query, setQuery] = useState('')

  const handleDelete = (chat) => {
    const label = chat.isSelf ? 'this chat' : `your chat with ${chat.participant.name}`
    if (!window.confirm(`Delete ${label}? It will be removed from your list. If they message you again, it comes back.`)) {
      return
    }
    // The open thread reads from the same ["chats"] list this removes the
    // row from, so it has to be navigated away from explicitly.
    if (openChatId === chat._id) navigate('/chats')
    deleteChat(chat._id)
  }

  const handleDeleteAll = () => {
    if (!chats?.length) return
    if (
      !window.confirm(
        'Delete all chats? Every conversation will be removed from your list. Anyone who messages you again will reappear there.',
      )
    ) {
      return
    }
    // Every row is about to disappear, including whichever thread is open.
    navigate('/chats')
    deleteAllChats()
  }

  const visibleChats = chats?.filter(hasParticipant) ?? []
  const normalizedQuery = query.trim().toLowerCase()
  const filteredChats = normalizedQuery
    ? visibleChats.filter((chat) => chat.participant.name.toLowerCase().includes(normalizedQuery))
    : visibleChats

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <span className="font-display text-xl font-semibold gradient-text">Whisper</span>
        <div className="ml-auto flex items-center gap-2">
          {chats?.length ? (
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              aria-label="Delete all chats"
              title="Delete all chats"
              className="flex size-9 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:bg-surface-card hover:text-red-400 disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNewChat}
            aria-label="New chat"
            className="flex size-9 items-center justify-center rounded-full bg-primary text-surface-dark transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
          </button>
          <UserButton />
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex h-10 items-center gap-2 rounded-full bg-surface-card px-4">
          <Search size={15} className="text-subtle-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <ChatListSkeleton />
        ) : error ? (
          <EmptyState
            icon={CloudOff}
            title="Failed to load chats"
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
        ) : filteredChats.length === 0 ? (
          <EmptyState
            icon={MessageSquareDashed}
            title={normalizedQuery ? 'No chats found' : 'No chats yet'}
            subtitle={normalizedQuery ? `Nothing matches "${query.trim()}"` : 'Start a conversation!'}
            action={
              !normalizedQuery ? (
                <button
                  type="button"
                  onClick={onNewChat}
                  className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-surface-dark"
                >
                  New chat
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-0.5">
            {filteredChats.map((chat) => (
              <ChatListItem key={chat._id} chat={chat} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
