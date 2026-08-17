import mongoose from "mongoose";

export const connectDB = async () => {

    try {
        const mongoUrl = process.env.MONGODB_URI
        if(!mongoUrl){
            throw new Error("MONGODB_URI environment variable in not defined")
        }
        await mongoose.connect(mongoUrl as string)
        console.log("✅MongoDB connected successfully")
        
    } catch (error) {
    console.log("❎ MongoDB connection error: ", error)
        process.exit(1)  // exit with failure
        // status code 1 means failure
        // status code 0 means success

        
    }
    
}