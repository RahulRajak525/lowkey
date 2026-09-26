import { useMe } from '@/hooks/useAuth'
import { messagesQueryKey } from '@/hooks/useMessages'
import { connectSocket, disconnectSocket, getActiveChatId, socketStore } from '@/lib/socket'
import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

/**
 * Owns the single socket connection for the session, and is the only place
 * incoming messages are written to the query cache — screens just read it.
 * Mounted once at the app root, next to AuthSync, so the connection follows
 * the session.
 */
const SocketSync = () => {
  const { isSignedIn, getToken } = useAuth()
  const { data: me } = useMe()
  const queryClient = useQueryClient()

  const myId = me?._id

  useEffect(() => {
    // Waiting for `myId` is not an optimisation, it is what keeps the socket
    // alive. The server's handshake middleware looks the Clerk id up in Mongo
    // and rejects with "User not found" until AuthSync's /auth/callback has
    // created that row. socket.io does not reconnect after a middleware
    // rejection — it destroys the socket — so connecting too early leaves the
    // session permanently offline instead of retrying.
    if (!isSignedIn || !myId) {
      disconnectSocket()
      return
    }

    const socket = connectSocket(getToken)

    const handleNewMessage = (message) => {
      const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id

      queryClient.setQueryData(messagesQueryKey(message.chat), (previous) => {
        // Not cached means the thread has never been opened; the query will
        // fetch it fresh, so there is nothing to keep up to date here.
        if (!previous) return previous

        // The server emits to the chat room *and* to each participant's
        // personal room, so a user sitting in the chat receives it twice.
        if (previous.some((existing) => existing._id === message._id)) return previous

        // Retire the local echo this message confirms. Matching on text is
        // the only handle available — the server does not return a client
        // id — so only the oldest pending copy is dropped, leaving a genuine
        // duplicate send as two messages.
        const echoIndex = previous.findIndex(
          (existing) => existing.pending && existing.text === message.text,
        )
        const kept =
          echoIndex === -1
            ? previous
            : [...previous.slice(0, echoIndex), ...previous.slice(echoIndex + 1)]
        return [...kept, message]
      })

      // The list shows the last message and orders by it, and the event
      // already carries everything that row needs, so the row is updated
      // straight from it rather than from a refetch.
      let isKnownChat = false

      queryClient.setQueryData(['chats'], (previous) => {
        if (!previous) return previous

        const index = previous.findIndex((chat) => chat._id === message.chat)
        if (index === -1) return previous
        isKnownChat = true

        const updated = {
          ...previous[index],
          lastMessage: {
            _id: message._id,
            text: message.text,
            sender: senderId,
            createdAt: message.createdAt,
          },
          lastMessageAt: message.createdAt,
        }

        // The server orders by lastMessageAt, so the row has to move too.
        const rest = previous.filter((_, position) => position !== index)
        return [updated, ...rest].sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
        )
      })

      // Only worth a round trip when the chat is missing from the list, and
      // actively harmful otherwise: messages arriving in quick succession
      // share one in-flight /chats request, and a response generated before
      // the newest message was saved would overwrite the write above.
      if (!isKnownChat) queryClient.invalidateQueries({ queryKey: ['chats'] })

      if (senderId !== myId && message.chat !== getActiveChatId()) {
        socketStore.setChatUnread(message.chat, true)
      }
    }

    const handleSocketError = ({ message }) => {
      console.error('Socket error:', message)
      // A refetch is also the recovery path: it replaces the array wholesale,
      // dropping local echoes of messages the server never accepted.
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    }

    // Authoritative echo of a delete request — including ones this device
    // already applied optimistically (useDeleteMessage) and ones made from
    // another of this user's devices/tabs.
    const handleMessageDeleted = ({ chatId, messageId, forEveryone, message }) => {
      const placeholder = message?.text ?? 'This message was deleted'

      queryClient.setQueryData(messagesQueryKey(chatId), (previous) => {
        if (!previous) return previous
        if (!forEveryone) return previous.filter((existing) => existing._id !== messageId)
        return previous.map((existing) =>
          existing._id === messageId ? { ...existing, isDeleted: true, text: placeholder } : existing,
        )
      })

      // Only a "for everyone" delete can be the chat list's preview text — a
      // "for me" delete never reaches the other participant, and the
      // deleting user's own preview is unaffected by hiding one message.
      if (!forEveryone) return

      queryClient.setQueryData(['chats'], (previous) =>
        previous?.map((chat) =>
          chat._id === chatId && chat.lastMessage?._id === messageId
            ? { ...chat, lastMessage: { ...chat.lastMessage, text: placeholder } }
            : chat,
        ),
      )
    }

    socket.on('new-message', handleNewMessage)
    socket.on('socket-error', handleSocketError)
    socket.on('message-deleted', handleMessageDeleted)

    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('socket-error', handleSocketError)
      socket.off('message-deleted', handleMessageDeleted)
    }
  }, [isSignedIn, getToken, queryClient, myId])

  return null
}

export default SocketSync
