import { useSyncExternalStore } from 'react'
import { io } from 'socket.io-client'
import { API_URL } from '@/lib/axios'

/**
 * Presence state for the chat list: who is online, who is typing where, and
 * which chats have unread messages.
 *
 * The store is transport-agnostic: the socket.io client at the bottom of this
 * file is what calls the `socketStore.*` setters as events arrive, so the
 * components reading this state never touch the connection itself.
 */
let state = {
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  unreadChats: new Set(),
}

const listeners = new Set()

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => state

// Every setter replaces the container and the collection it touches rather
// than mutating in place: useSyncExternalStore compares snapshots by
// reference, so an in-place `set.add()` would update nothing on screen.
const setState = (patch) => {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

export const socketStore = {
  getState: getSnapshot,

  setConnected(isConnected) {
    if (state.isConnected === isConnected) return
    setState({ isConnected })
  },

  /** Replace the whole presence list, e.g. from the initial handshake. */
  setOnlineUsers(userIds) {
    setState({ onlineUsers: new Set(userIds) })
  },

  setUserOnline(userId, isOnline) {
    const onlineUsers = new Set(state.onlineUsers)
    if (isOnline) onlineUsers.add(userId)
    else onlineUsers.delete(userId)
    setState({ onlineUsers })
  },

  /** Pass `null` as the userId to clear the typing indicator for that chat. */
  setTyping(chatId, userId) {
    const typingUsers = new Map(state.typingUsers)
    if (userId) typingUsers.set(chatId, userId)
    else typingUsers.delete(chatId)
    setState({ typingUsers })
  },

  setChatUnread(chatId, hasUnread) {
    const unreadChats = new Set(state.unreadChats)
    if (hasUnread) unreadChats.add(chatId)
    else unreadChats.delete(chatId)
    setState({ unreadChats })
  },

  /** Drop all presence state, e.g. on sign-out. */
  reset() {
    setState({
      isConnected: false,
      onlineUsers: new Set(),
      typingUsers: new Map(),
      unreadChats: new Set(),
    })
  },
}

export const useSocketStore = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

/* ------------------------------------------------------------------------- *
 * Transport
 * ------------------------------------------------------------------------- */

let socket = null

/**
 * How long a received "typing" claim stands without a refresh. Longer than
 * the sender's idle timeout, so the normal stop event wins and this only
 * fires when that event never arrives.
 */
const TYPING_EXPIRY_MS = 6000

/** chat id -> timer that clears a stale typing indicator */
const typingTimers = new Map()

const clearTypingFor = (predicate) => {
  for (const [chatId, typistId] of socketStore.getState().typingUsers) {
    if (!predicate(chatId, typistId)) continue
    const timer = typingTimers.get(chatId)
    if (timer) clearTimeout(timer)
    typingTimers.delete(chatId)
    socketStore.setTyping(chatId, null)
  }
}

/** Tell the other participants whether this user is currently typing. */
export const emitTyping = (chatId, isTyping) => {
  socket?.emit('typing', { chatId, isTyping })
}

/**
 * `forEveryone` requires being the message's own sender (enforced server
 * side) and leaves a "message deleted" placeholder for both sides;
 * otherwise it only hides the message on this account's own devices.
 */
export const emitDeleteMessage = (chatId, messageId, forEveryone) => {
  socket?.emit('delete-message', { chatId, messageId, forEveryone })
}

/**
 * The chat currently on screen. Incoming messages for it are read, not
 * unread, and it is rejoined automatically after a reconnect.
 */
let activeChatId = null

/**
 * Opens the connection, or returns the existing one. Safe to call on every
 * render pass of the component that owns the connection.
 */
export const connectSocket = (getToken) => {
  if (socket) return socket

  const activeSocket = io(API_URL, {
    // Clerk session tokens are short-lived, so `auth` is a callback rather
    // than a captured value: socket.io runs it before every connection
    // attempt, and a reconnect after a long idle tab would otherwise hand the
    // server a token that already expired.
    auth: (cb) => {
      getToken()
        .then((token) => cb({ token }))
        .catch(() => cb({}))
    },
    transports: ['websocket'],
  })

  socket = activeSocket

  activeSocket.on('online-users', ({ userIds }) => {
    socketStore.setOnlineUsers(userIds)
  })
  activeSocket.on('user-online', ({ userId }) => {
    socketStore.setUserOnline(userId, true)
  })
  activeSocket.on('user-offline', ({ userId }) => {
    socketStore.setUserOnline(userId, false)
    // Someone who drops off mid-sentence never sends the closing `false`.
    clearTypingFor((_chatId, typistId) => typistId === userId)
  })

  activeSocket.on('user-typing', ({ chatId, userId, isTyping }) => {
    const existing = typingTimers.get(chatId)
    if (existing) clearTimeout(existing)

    if (!isTyping) {
      typingTimers.delete(chatId)
      socketStore.setTyping(chatId, null)
      return
    }

    socketStore.setTyping(chatId, userId)
    // The sender's own idle timer should clear this, but a dropped packet or
    // a backgrounded tab would otherwise leave "typing..." on screen forever.
    typingTimers.set(
      chatId,
      setTimeout(() => {
        typingTimers.delete(chatId)
        socketStore.setTyping(chatId, null)
      }, TYPING_EXPIRY_MS),
    )
  })

  // Rooms live on the server socket, so a reconnect starts with none of them.
  activeSocket.on('connect', () => {
    socketStore.setConnected(true)
    if (activeChatId) activeSocket.emit('join-chat', activeChatId)
  })

  activeSocket.on('disconnect', () => {
    socketStore.setConnected(false)
  })

  activeSocket.on('connect_error', (error) => {
    socketStore.setConnected(false)
    console.warn('Socket connect error:', error.message)
  })

  return activeSocket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
  activeChatId = null
  typingTimers.forEach((timer) => clearTimeout(timer))
  typingTimers.clear()
  socketStore.reset()
}

export const getActiveChatId = () => activeChatId

/** Enter a chat room; pass `null` when leaving the screen. */
export const setActiveChat = (chatId) => {
  if (activeChatId === chatId) return
  if (activeChatId) socket?.emit('leave-chat', activeChatId)
  activeChatId = chatId
  if (chatId) {
    socket?.emit('join-chat', chatId)
    socketStore.setChatUnread(chatId, false)
  }
}
