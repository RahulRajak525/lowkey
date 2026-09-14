export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface MessageSender {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Message {
  _id: string;
  chat: string;
  sender: MessageSender | string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatLastMessage {
  _id: string;
  text: string;
  sender: string;
  createdAt: string;
}

export interface Chat {
  _id: string;
  participant: MessageSender | null;
  lastMessage: ChatLastMessage | null;
  lastMessageAt: string;
  createdAt: string;
}

/**
 * A chat the UI can actually render. The API returns `participant: null` when
 * the other side of a conversation can no longer be resolved (removed user, or
 * a chat row whose participants array lost them), and those chats have no name,
 * avatar or id to navigate with.
 */
export type ChatWithParticipant = Chat & { participant: MessageSender };

export const hasParticipant = (chat: Chat): chat is ChatWithParticipant =>
  chat.participant !== null;
