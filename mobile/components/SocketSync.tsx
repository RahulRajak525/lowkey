import { useMe } from "@/hooks/useAuth";
import { messagesQueryKey } from "@/hooks/useMessages";
import { connectSocket, disconnectSocket, getActiveChatId, socketStore } from "@/lib/socket";
import type { Message } from "@/types";
import { useAuth } from "@clerk/expo";
import * as Sentry from "@sentry/react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Owns the single socket connection for the session, and is the only place
 * incoming messages are written to the query cache — the chat screen just reads
 * it. Mounted next to AuthSync so the connection follows the session.
 */
const SocketSync = () => {
  const { isSignedIn, getToken } = useAuth();
  const { data: me } = useMe();
  const queryClient = useQueryClient();

  const myId = me?._id;

  useEffect(() => {
    // Waiting for `myId` is not an optimisation, it is what keeps the socket
    // alive. The server's handshake middleware looks the Clerk id up in Mongo
    // and rejects with "User not found" until AuthSync's /auth/callback has
    // created that row. socket.io does not reconnect after a middleware
    // rejection — it destroys the socket — so connecting too early leaves the
    // session permanently offline instead of retrying. The callback seeds the
    // "me" query, so `myId` appearing means the row now exists.
    if (!isSignedIn || !myId) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(getToken);

    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData<Message[]>(messagesQueryKey(message.chat), (previous) => {
        // Not cached means the thread has never been opened; the query will
        // fetch it fresh, so there is nothing to keep up to date here.
        if (!previous) return previous;

        // The server emits to the chat room *and* to each participant's
        // personal room, so a user sitting in the chat receives it twice.
        if (previous.some((existing) => existing._id === message._id)) return previous;

        // Retire the local echo this message confirms. Matching on text is the
        // only handle available — the server does not return a client id — so
        // only the oldest pending copy is dropped, leaving a genuine duplicate
        // send as two messages.
        const echoIndex = previous.findIndex(
          (existing) => existing.pending && existing.text === message.text,
        );
        const kept =
          echoIndex === -1
            ? previous
            : [...previous.slice(0, echoIndex), ...previous.slice(echoIndex + 1)];
        return [...kept, message];
      });

      // The chat list shows the last message and orders by it.
      queryClient.invalidateQueries({ queryKey: ["chats"] });

      const senderId = typeof message.sender === "string" ? message.sender : message.sender._id;
      if (senderId !== myId && message.chat !== getActiveChatId()) {
        socketStore.setChatUnread(message.chat, true);
      }
    };

    const handleSocketError = ({ message }: { message: string }) => {
      Sentry.logger.error(Sentry.logger.fmt`Socket error: ${message}`);
      // A refetch is also the recovery path: it replaces the array wholesale,
      // dropping local echoes of messages the server never accepted.
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    };

    socket.on("new-message", handleNewMessage);
    socket.on("socket-error", handleSocketError);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("socket-error", handleSocketError);
    };
  }, [isSignedIn, getToken, queryClient, myId]);

  return null;
};

export default SocketSync;
