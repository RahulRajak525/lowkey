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
      // Chats this user removed from their list (deleteChat) are skipped
      // until a new message un-hides them (send-message in socket.ts).
      const chats = await Chat.find({participants:userId, hiddenFor:{$ne:userId}})
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

      // Starting a chat with someone you'd removed from your list puts the
      // row back (still without the history you cleared).
      let chat = await Chat.findOneAndUpdate(query, {$pull:{hiddenFor:userId}}, {new:true})
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

/** Loads a chat the requester is in, or answers 400/404 and returns null. */
async function findOwnChat(req:AuthRequest, res:Response){
   const { chatId } = req.params

   if(typeof chatId !== "string" || !Types.ObjectId.isValid(chatId)){
      res.status(400).json({message:"Invalid chat ID"})
      return null
   }

   const chat = await Chat.findOne({_id:chatId, participants:req.userId})
   if(!chat){
      res.status(404).json({message:"Chat not found"})
      return null
   }
   return chat
}

/**
 * "Clear Chat" (Chat Details) — hides every message in the conversation *for
 * this user only*, reusing the per-message `deletedFor` a single message
 * delete uses. The chat row stays in their list, and the other participant's
 * copy is untouched. Old messages stay hidden rather than being restored, so
 * anything sent afterwards shows up on its own.
 */
export async function clearChat(req:AuthRequest, res:Response, next:NextFunction){
   try {
      const chat = await findOwnChat(req, res)
      if(!chat) return

      await Message.updateMany({chat:chat._id}, {$addToSet:{deletedFor:req.userId}})

      res.json({message:"Chat cleared"})
   } catch (error) {
      res.status(500)
      next(error)
   }
}

/**
 * "Delete Chat" (chat-list long-press / hover) — clears the messages exactly
 * like clearChat *and* removes the row from this user's list. Nothing changes
 * for the other participant; if either side sends a new message the row comes
 * back, showing only that new message.
 */
export async function deleteChat(req:AuthRequest, res:Response, next:NextFunction){
   try {
      const chat = await findOwnChat(req, res)
      if(!chat) return

      await Message.updateMany({chat:chat._id}, {$addToSet:{deletedFor:req.userId}})
      await Chat.updateOne({_id:chat._id}, {$addToSet:{hiddenFor:req.userId}})

      res.json({message:"Chat deleted"})
   } catch (error) {
      res.status(500)
      next(error)
   }
}
