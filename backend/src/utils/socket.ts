import { Socket, Server as SocketServer } from "socket.io";

import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { User } from "../models/User";



// store online users in memory : userId -> socketId
export const onlineUsers: Map<string, string> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    "http://localhost:8081",   // Expo mobile
    "http://localhost:5173",   // Vite web dev
    process.env.FRONTEND_URL  // production
  ].filter(Boolean) as string[];
  const io = new SocketServer(httpServer, { cors: { origin: allowedOrigins } });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token; // this is what user send from client
    if (!token) return next(new Error("Authentication error"));
    try {
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      const clerkId = session.sub;
      const user = await User.findOne({ clerkId });
      if (!user) return next(new Error("User not found"));
      socket.data.userId = user._id.toString();
      next();
    } catch (error: any) {
      next(new Error(error));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    // sent list of currently online users to the newly connected client

    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

    // store user in the onlineUsers map

    onlineUsers.set(userId, socket.id);

    // notify others that this current user is online

    socket.broadcast.emit("user-online", { userId: userId });

    socket.join(`user:${userId}`);
    socket.on("join-chat", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });
    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    // handle sending messages

    socket.on(
      "send-message",
      async (data: { chatId: string; text: string }) => {
        try {
          const { chatId, text } = data;

          const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
          });

          if (!chat) {
            socket.emit("socket-error", { message: "Chat not found" });
            return;
          }
          const message = await Message.create({
            chat: chatId,
            sender: userId,
            text,
          });

          chat.lastMessage = message._id;
          chat.lastMessageAt = new Date();
          await chat.save();

          await message.populate("sender", "name avatar");
          //emit to chat room (for users inside the chat)

          io.to(`chat:${chatId}`).emit("new-message", message);
          // also emit to participants personal rooms (for chat list view)

          for (const participantId of chat.participants) {
            io.to(`user:${participantId}`).emit("new-message", message);
          }
        } catch (error) {
          socket.emit("socket-error", { message: "Failed to send message" });
        }
      },
    );
  
  // Typing is broadcast to the other participants' personal rooms rather than
  // the chat room: every client joins `user:<id>` on connect, so this reaches
  // them whether they have the thread open or are looking at the chat list,
  // and each recipient gets it exactly once.
  socket.on("typing", async (data: { chatId: string; isTyping: boolean }) => {
    try {
      const { chatId, isTyping } = data ?? {};
      if (!chatId) return;

      const chat = await Chat.findOne({ _id: chatId, participants: userId });
      if (!chat) return;

      for (const participantId of chat.participants) {
        if (participantId.toString() === userId) continue;
        io.to(`user:${participantId}`).emit("user-typing", {
          chatId,
          userId,
          isTyping: Boolean(isTyping),
        });
      }
    } catch {
      // A failed typing hint is not worth surfacing to the sender; the
      // indicator simply stays as it was and clears on the receiver's timeout.
    }
  })
  socket.on("disconnect",()=>{
    // A reconnect registers the new socket before the old one times out, so the
    // replaced socket's disconnect arrives late and would otherwise clear the
    // entry that the live socket just wrote — marking an online user offline
    // until their next reconnect. Only the socket still holding the slot may
    // release it.
    if (onlineUsers.get(userId) !== socket.id) return

    onlineUsers.delete(userId)

    // Notify Others. This has to stay inside the disconnect handler: at the
    // connection level it ran immediately after "user-online", so every client
    // marked the user who had just connected as offline again.

    socket.broadcast.emit("user-offline", {userId})
  })

});

return io
};
