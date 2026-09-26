import mongoose, {Schema , type Document} from "mongoose";

export interface IMessage extends Document{
    chat:mongoose.Types.ObjectId;
    sender:mongoose.Types.ObjectId;
    text:string;
    /** true once the sender has deleted this message "for everyone"; the row
     * (and its place in the thread) stays, only the text is hidden. */
    isDeleted: boolean;
    deletedAt?: Date;
    /** users who deleted this message "for me" only; still exists for
     * everyone else and unaffected by isDeleted. */
    deletedFor: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt :Date

}

const MessageSchema = new Schema<IMessage>({
    chat: {
        type:Schema.Types.ObjectId,
        ref:"Chat",
        required:true,
    },
    sender:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    text:{
        type:String,
      required: true,
      trim :true ,

    },
    isDeleted:{
        type:Boolean,
        default:false,
    },
    deletedAt:{
        type:Date,
    },
    deletedFor:[{
        type:Schema.Types.ObjectId,
        ref:"User",
    }],
},{timestamps:true})

// indexes for faster queries

MessageSchema.index({chat:1, createdAt : 1}); // oldest one first

// 1 -> asc
// -1 -> desc

// The original text stays in the document even after a "delete for everyone"
// (simplest way to keep the row and its ordering intact) — this transform is
// what actually keeps it from ever reaching a client once isDeleted is set.
MessageSchema.set("toJSON", {
    transform: (_doc, ret) => {
        if (ret.isDeleted) {
            ret.text = "This message was deleted"
        }
        const { deletedFor, ...rest } = ret
        return rest
    },
})

export const Message = mongoose.model("Message", MessageSchema)