import mongoose, {Schema , type Document} from "mongoose";

export interface IChat extends Document {
    participants : mongoose.Types.ObjectId[];
     lastMessage?: mongoose.Types.ObjectId;
     lastMessageAt: Date;
     createdAt:Date,
     updatedAt: Date
}

// A chat is never hidden or removed for one side only — "deleting" it (see
// deleteChat) clears its *messages* for that user instead (Message.deletedFor),
// so the row and the contact stay reachable and a new incoming message never
// has to "bring back" anything.
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
}
},{timestamps:true})

export const Chat = mongoose.model("Chat",ChatSchema)
