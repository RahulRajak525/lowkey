import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";
import { Types } from "mongoose";

/**
 * A chat with yourself is stored as a one-element participants array, so it is
 * the participant count — not a flag — that identifies it. Kept in one place
 * because both the list and the get-or-create route have to agree on it.
 */
const isSelfChat = (chat: { participants: unknown[] }) => chat.participants.length === 1;

/**
 * The single shape both chat endpoints return. A normal chat resolves to the
 * other participant; a self chat has none, so it resolves to the user
 * themselves and the client labels it "(You)".
 */
function formatChat(chat: any, userId: string | undefined) {
   const self = chat.participants.find((p: any) => p?._id.toString() === userId)
   const otherParticipant = chat.participants.find((p: any) => p?._id.toString() !== userId)

   // `chat.lastMessage` is one shared field, but a message can be hidden for
   // just this viewer (deleteChat clears "for me" only) — so it is only
   // handed back if *this* user hasn't deleted it, and the client already
   // renders a missing lastMessage as "No messages yet".
   const lastMessageHiddenForMe = chat.lastMessage?.deletedFor?.some(
      (id: any) => id.toString() === userId,
   )

   return {
      _id: chat._id,
      participant: (isSelfChat(chat) ? self : otherParticipant) ?? null,
      isSelf: isSelfChat(chat),
      lastMessage: lastMessageHiddenForMe ? null : chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt
   }
}

export async function getChats(req:AuthRequest, res:Response, next:NextFunction){
   try {
    const userId = req.userId
      // Chats are never hidden for one side — deleting one only clears its
      // messages (see deleteChat) — so every chat the user is in is listed.
      const chats = await Chat.find({participants:userId})
       .populate("participants", "name email avatar")
       .populate("lastMessage").sort({lastMessageAt:-1})

       res.json(chats.map(chat => formatChat(chat, userId)))
   } catch (error) {
      res.status(500)
      next(error)
   }
}
export async function getOrCreateChat(req:AuthRequest, res:Response, next:NextFunction){
   try {
      const userId = req.userId;
      const {participantId} = req.params
      // check if chat already exist

      if(typeof participantId !== "string" || !participantId){
           res.status(400).json({message:"Participant ID is required"})
           return
      }

      if(!Types.ObjectId.isValid(participantId)){
         res.status(400).json({message:"Invalid participant ID"})
         return
      }

      // Messaging yourself is allowed, and gets a chat of its own holding only
      // you. The two lookups have to stay separate: `$all` ignores duplicates,
      // so `$all: [userId, userId]` would match any chat the user is in and
      // hand back whichever conversation happened to be first.
      const isSelf = userId === participantId
      const query = isSelf
         // Exact array equality, so a two-person chat cannot satisfy it.
         ? { participants: [userId] }
         : { participants: { $all: [userId, participantId] } }

      let chat = await Chat.findOne(query)
      .populate("participants", "name email avatar")
       .populate("lastMessage")
       if(!chat){
         const newChat = new Chat({participants : isSelf ? [userId] : [userId , participantId]})
         await newChat.save()
         chat  = await newChat.populate("participants","name email avatar")
       }

       res.json(formatChat(chat, userId))

   } catch (error) {
     res.status(500)
      next(error)
   }
}

/**
 * "Delete Chat" clears every message in the conversation *for this user
 * only* (reusing the same per-message `deletedFor` a single message delete
 * uses) — the chat row, the contact, and the other participant's copy are
 * all untouched. Because old messages stay marked hidden-for-me rather than
 * being un-hidden, a message the other side sends afterwards shows up on its
 * own without dragging the cleared history back into view.
 */
export async function deleteChat(req:AuthRequest, res:Response, next:NextFunction){
   try {
      const userId = req.userId
      const { chatId } = req.params

      if(typeof chatId !== "string" || !Types.ObjectId.isValid(chatId)){
         res.status(400).json({message:"Invalid chat ID"})
         return
      }

      const chat = await Chat.findOne({_id:chatId, participants:userId})
      if(!chat){
         res.status(404).json({message:"Chat not found"})
         return
      }

      await Message.updateMany({chat:chatId}, {$addToSet:{deletedFor:userId}})

      res.json({message:"Chat cleared"})
   } catch (error) {
      res.status(500)
      next(error)
   }
}
