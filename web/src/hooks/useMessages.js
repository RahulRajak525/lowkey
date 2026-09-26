import { useMe } from '@/hooks/useAuth'
import { useApi } from '@/lib/axios'
import { emitDeleteMessage, getSocket } from '@/lib/socket'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

export const messagesQueryKey = (chatId) => ['messages', chatId]

export const useMessages = (chatId) => {
  const { apiWithAuth } = useApi()

  return useQuery({
    queryKey: messagesQueryKey(chatId),
    queryFn: async () => {
      const { data } = await apiWithAuth({ method: 'GET', url: `/messages/chat/${chatId}` })
      return data
    },
    enabled: Boolean(chatId),
  })
}

/**
 * Sending goes over the socket, not REST — the backend has no POST route for
 * messages, `send-message` is the only writer. The server's `new-message`
 * echo is what puts the real message in the cache (see SocketSync); the
 * local echo added here just keeps the thread from looking frozen until it
 * arrives.
 *
 * Returns false when the message could not be handed to the socket, so the
 * composer can keep the user's text instead of clearing it.
 */
export const useSendMessage = (chatId) => {
  const queryClient = useQueryClient()
  const { data: me } = useMe()

  return useCallback(
    (text) => {
      const trimmed = text.trim()
      const socket = getSocket()
      if (!trimmed || !chatId || !me || !socket?.connected) return false

      const now = new Date().toISOString()
      const optimistic = {
        _id: `pending:${now}:${Math.random()}`,
        chat: chatId,
        sender: me,
        text: trimmed,
        createdAt: now,
        updatedAt: now,
        pending: true,
      }

      queryClient.setQueryData(messagesQueryKey(chatId), (previous) => [
        ...(previous ?? []),
        optimistic,
      ])

      socket.emit('send-message', { chatId, text: trimmed })
      return true
    },
    [chatId, me, queryClient],
  )
}

/**
 * Applied optimistically here and confirmed by the server's `message-deleted`
 * echo (see SocketSync) — the same pattern `useSendMessage` uses. "For
 * everyone" leaves the placeholder bubble in place; "for me" removes the
 * message from this device's view entirely.
 */
export const useDeleteMessage = (chatId) => {
  const queryClient = useQueryClient()

  return useCallback(
    (messageId, forEveryone) => {
      const socket = getSocket()
      if (!chatId || !socket?.connected) return false

      queryClient.setQueryData(messagesQueryKey(chatId), (previous) => {
        if (!previous) return previous
        if (!forEveryone) return previous.filter((message) => message._id !== messageId)
        return previous.map((message) =>
          message._id === messageId
            ? { ...message, isDeleted: true, text: 'This message was deleted' }
            : message,
        )
      })

      emitDeleteMessage(chatId, messageId, forEveryone)
      return true
    },
    [chatId, queryClient],
  )
}
