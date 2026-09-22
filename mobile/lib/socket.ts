import { useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/axios";
import * as Sentry from "@sentry/react-native";

/**
 * Presence state for the chat list: who is online, who is typing where, and
 * which chats have unread messages.
 *
 * The store is transport-agnostic: the socket.io client at the bottom of this
 * file is what calls the `socketStore.*` setters as events arrive, so the
 * components reading this state never touch the connection itself.
 */
export type SocketState = {
  /** whether this device currently has a live connection */
  isConnected: boolean;
  /** user ids currently connected */
  onlineUsers: Set<string>;
  /** chat id -> id of the participant typing in it */
  typingUsers: Map<string, string>;
  /** chat ids with messages the user has not seen */
  unreadChats: Set<string>;
};

let state: SocketState = {
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  unreadChats: new Set(),
};

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;

// Every setter replaces the container and the collection it touches rather than
// mutating in place: useSyncExternalStore compares snapshots by reference, so an
// in-place `set.add()` would update nothing on screen.
const setState = (patch: Partial<SocketState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export const socketStore = {
  getState: getSnapshot,

  setConnected(isConnected: boolean) {
    if (state.isConnected === isConnected) return;
    setState({ isConnected });
  },

  /** Replace the whole presence list, e.g. from the initial handshake. */
  setOnlineUsers(userIds: Iterable<string>) {
    setState({ onlineUsers: new Set(userIds) });
  },

  setUserOnline(userId: string, isOnline: boolean) {
    const onlineUsers = new Set(state.onlineUsers);
    if (isOnline) onlineUsers.add(userId);
    else onlineUsers.delete(userId);
    setState({ onlineUsers });
  },

  /** Pass `null` as the userId to clear the typing indicator for that chat. */
  setTyping(chatId: string, userId: string | null) {
    const typingUsers = new Map(state.typingUsers);
    if (userId) typingUsers.set(chatId, userId);
    else typingUsers.delete(chatId);
    setState({ typingUsers });
  },

  setChatUnread(chatId: string, hasUnread: boolean) {
    const unreadChats = new Set(state.unreadChats);
    if (hasUnread) unreadChats.add(chatId);
    else unreadChats.delete(chatId);
    setState({ unreadChats });
  },

  /** Drop all presence state, e.g. on sign-out. */
  reset() {
    setState({
      isConnected: false,
      onlineUsers: new Set(),
      typingUsers: new Map(),
      unreadChats: new Set(),
    });
  },
};

export const useSocketStore = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);


/* ------------------------------------------------------------------------- *
 * Transport
 * ------------------------------------------------------------------------- */

let socket: Socket | null = null;

/**
 * The chat currently on screen. Incoming messages for it are read, not unread,
 * and it is rejoined automatically after a reconnect.
 */
let activeChatId: string | null = null;

/**
 * Opens the connection, or returns the existing one. Safe to call on every
 * render pass of the component that owns the connection.
 */
export const connectSocket = (getToken: () => Promise<string | null>) => {
  if (socket) return socket;

  // The handlers below close over this local rather than the module-level
  // `socket`: that one is `Socket | null` and reassignable, so TypeScript
  // cannot keep the non-null narrowing alive inside a callback.
  const activeSocket = io(API_URL, {
    // Clerk session tokens are short-lived, so `auth` is a callback rather than
    // a captured value: socket.io runs it before every connection attempt, and
    // a reconnect after the app was backgrounded would otherwise hand the
    // server a token that expired while the phone was asleep.
    auth: (cb) => {
      getToken()
        .then((token) => cb({ token }))
        .catch(() => cb({}));
    },
    transports: ["websocket"],
  });

  socket = activeSocket;

  activeSocket.on("online-users", ({ userIds }: { userIds: string[] }) => {
    console.log("Received online-users:", userIds)
    socketStore.setOnlineUsers(userIds);
  });
  activeSocket.on("user-online", ({ userId }: { userId: string }) => {
    socketStore.setUserOnline(userId, true);
  });
  activeSocket.on("user-offline", ({ userId }: { userId: string }) => {
    socketStore.setUserOnline(userId, false);
  });

  // Rooms live on the server socket, so a reconnect starts with none of them.
  activeSocket.on("connect", () => {
    console.log("Socket connected", {socketId : activeSocket.id})
    socketStore.setConnected(true);
    if (activeChatId) activeSocket.emit("join-chat", activeChatId);
  });

  activeSocket.on("disconnect", () => {
    console.log("Socket disconnect", {socketId : activeSocket.id})
    socketStore.setConnected(false);
  });

  // Sending is socket-only, so a handshake that never succeeds leaves the
  // composer inert. Without this it fails silently: socket.io retries forever
  // and reports nothing.
  activeSocket.on("connect_error", (error) => {
    console.log("Socket connect error", {socketId : activeSocket.id, error: error.message})
    socketStore.setConnected(false);
    Sentry.logger.warn(Sentry.logger.fmt`Socket connect failed: ${error.message}`);
  });

  return activeSocket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
  activeChatId = null;
  socketStore.reset();
};

export const getActiveChatId = () => activeChatId;

/** Enter a chat room; pass `null` when leaving the screen. */
export const setActiveChat = (chatId: string | null) => {
  if (activeChatId === chatId) return;
  if (activeChatId) socket?.emit("leave-chat", activeChatId);
  activeChatId = chatId;
  if (chatId) {
    socket?.emit("join-chat", chatId);
    socketStore.setChatUnread(chatId, false);
  }
};
