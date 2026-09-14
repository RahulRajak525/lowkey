import { useSyncExternalStore } from "react";

/**
 * Presence state for the chat list: who is online, who is typing where, and
 * which chats have unread messages.
 *
 * This is the state container only — there is no networking in here yet. The
 * realtime transport (socket.io or otherwise) is expected to call the
 * `socketStore.*` setters below as events arrive, so swapping this file for a
 * socket-backed store later needs no changes in the components that read it.
 */
export type SocketState = {
  /** user ids currently connected */
  onlineUsers: Set<string>;
  /** chat id -> id of the participant typing in it */
  typingUsers: Map<string, string>;
  /** chat ids with messages the user has not seen */
  unreadChats: Set<string>;
};

let state: SocketState = {
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
      onlineUsers: new Set(),
      typingUsers: new Map(),
      unreadChats: new Set(),
    });
  },
};

export const useSocketStore = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
