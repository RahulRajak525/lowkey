/** Narrows the populated sender the message list renders from. */
export const senderOf = (message) => (typeof message.sender === 'string' ? null : message.sender)

/**
 * The API returns `participant: null` when the other side of a conversation
 * can no longer be resolved (removed user, or a chat row whose participants
 * array lost them). Those chats have no name, avatar or id to navigate with.
 */
export const hasParticipant = (chat) => chat.participant !== null
