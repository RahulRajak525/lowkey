import mongoose, {Schema , type Document} from "mongoose";
export interface IUser extends Document{
    name :string;
    email:string;
    avatar: string;
    createdAt : Date;
    updatedAt : Date;
    clerkId : string
}
const UserSchema  = new Schema<IUser>({
    clerkId :{
        type : String,
        required : true,
        unique : true
    },
    name:{
        type: String,
        required: true,
        unique: true,
        trim: true, //  "....Jhon" => "Jhon"
        lowercase : true  // jHOn@gMail.com => jhon@gmail.com
    },
    avatar:{
        type: String,
        default: "",
      
    },


},

{
    timestamps: true
}
)

export const User = mongoose.model("User", UserSchema)