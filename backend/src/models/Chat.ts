import mongoose, {Schema , type Document} from "mongoose";

export interface IChat extends Document {
    participants : mongoose.Types.ObjectId[];
     lastMessage?: mongoose.Types.ObjectId;
     lastMessageAt: Date;
     /** users who removed this chat from their own list; it stays listed for
      * everyone else, and any new message in it clears this (see socket.ts). */
     hiddenFor: mongoose.Types.ObjectId[];
     createdAt:Date,
     updatedAt: Date
}

// Two per-user actions, neither of which touches the other participant:
// - clearChat hides every *message* for that user (Message.deletedFor); the
//   row stays in their list.
// - deleteChat does the same *and* adds them to `hiddenFor`, dropping the row
//   from their list until a new message arrives. The cleared history stays
//   hidden when it comes back, so only the new message shows.
// (Named hiddenFor, not deletedFor: an older, since-removed deletedFor field
// may still be sitting on existing documents and must not hide rows again.)
const ChatSchema = new Schema<IChat>({
    participants:[{
        type :Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
],
lastMessage:{
    type:Schema.Types.ObjectId,
    ref:"Message",
    default:null
},
lastMessageAt :{
    type:Date,
    default:Date.now,
},
hiddenFor:[{
    type:Schema.Types.ObjectId,
    ref:"User",
}],
},{timestamps:true})

export const Chat = mongoose.model("Chat",ChatSchema)
