import mongoose, {Schema , type Document} from "mongoose";

export interface IChat extends Document {
    participants : mongoose.Types.ObjectId[];
     lastMessage?: mongoose.Types.ObjectId;
     lastMessageAt: Date;
     /** users who removed this chat from their own list only; it still exists
      * for any participant not in this array, and a new message clears it. */
     deletedFor: mongoose.Types.ObjectId[];
     createdAt:Date,
     updatedAt: Date
}

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
deletedFor:[{
    type:Schema.Types.ObjectId,
    ref:"User",
}],
},{timestamps:true})

export const Chat = mongoose.model("Chat",ChatSchema)

