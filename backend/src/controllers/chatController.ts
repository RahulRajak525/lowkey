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

   return {
      _id: chat._id,
      participant: (isSelfChat(chat) ? self : otherParticipant) ?? null,
      isSelf: isSelfChat(chat),
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt
   }
}

export async function getChats(req:AuthRequest, res:Response, next:NextFunction){
   try {
    const userId = req.userId
      // A chat this user deleted "for me" is excluded here but not dropped
      // from the database — send-message clears deletedFor when the other
      // side messages again, which is what brings it back.
      const chats = await Chat.find({participants:userId, deletedFor:{$ne:userId}})
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

       } else if (userId && chat.deletedFor.some((id) => id.toString() === userId)) {
         // Picking this person again after having deleted the chat means
         // starting over, so it un-hides for this user (only) rather than
         // staying gone until the other side happens to message first.
         chat.deletedFor = chat.deletedFor.filter((id) => id.toString() !== userId)
         await chat.save()
       }

       res.json(formatChat(chat, userId))

   } catch (error) {
     res.status(500)
      next(error)
   }
}

/**
 * Whether deleting this chat "for me" would leave nobody else holding onto
 * it — i.e. every other participant already has. Shared by the single- and
 * bulk-delete routes so the "nothing left to keep, drop it for good" rule
 * only lives in one place.
 */
function wouldBeFullyDeleted(chat: { participants: Types.ObjectId[]; deletedFor: Types.ObjectId[] }, userId: string) {
   return chat.participants
      .filter((id) => id.toString() !== userId)
      .every((id) => chat.deletedFor.some((deletedId) => deletedId.toString() === id.toString()))
}

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

      if (userId && wouldBeFullyDeleted(chat, userId)) {
         // Every participant has now deleted it (a self chat clears this
         // immediately, since there is no "other side" to wait on) — nothing
         // left to keep, so the conversation is dropped for good.
         await Message.deleteMany({chat:chatId})
         await chat.deleteOne()
      } else {
         await Chat.updateOne({_id:chatId}, {$addToSet:{deletedFor:userId}})
      }

      res.json({message:"Chat deleted"})
   } catch (error) {
      res.status(500)
      next(error)
   }
}

/**
 * "Delete for me" applied to every chat at once — one tap in Settings rather
 * than clearing the list one conversation at a time. Same per-chat rules as
 * `deleteChat`: a chat only disappears from *this* user's list, and only
 * gets dropped from the database once every other participant has also
 * deleted their copy.
 */
export async function deleteAllChats(req:AuthRequest, res:Response, next:NextFunction){
   try {
      const userId = req.userId
      const chats = await Chat.find({participants:userId, deletedFor:{$ne:userId}})

      const toHardDelete: string[] = []
      const toSoftDelete: string[] = []

      for (const chat of chats) {
         const target = userId && wouldBeFullyDeleted(chat, userId) ? toHardDelete : toSoftDelete
         target.push(chat._id.toString())
      }

      if (toHardDelete.length) {
         await Message.deleteMany({chat:{$in:toHardDelete}})
         await Chat.deleteMany({_id:{$in:toHardDelete}})
      }

      if (toSoftDelete.length) {
         await Chat.updateMany({_id:{$in:toSoftDelete}}, {$addToSet:{deletedFor:userId}})
      }

      res.json({message:"All chats deleted", count: chats.length})
   } catch (error) {
      res.status(500)
      next(error)
   }
}
