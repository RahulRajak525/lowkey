import express from "express"
import authRoutes from "./routes/authRoutes"
import chatRoutes from "./routes/chatRoute"
import messageRoutes from "./routes/messageRoutes"
import userRoutes from "./routes/userRoute"
const app = express()
import { clerkMiddleware } from '@clerk/express'
import { errorHandler } from "./middleware/errorHandler"

app.use(express.json()) // parses incoming JSON request bodies and makes them available as req. body in your route handlers.

app.use(clerkMiddleware())
app.get("/health",(req, res)=>{
    res.json({status:"ok", message:"Server is running "})
})



app.use("/api/auth", authRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/users", userRoutes)

// error handlers must come after all the routes and other middleware so they can catch errors passed with next(err) or thrown inside async handlers.

app.use(errorHandler)

export default app