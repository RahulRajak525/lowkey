import express from "express"
import authRoutes from "./routes/authRoutes"
import chatRoutes from "./routes/chatRoute"
import messageRoutes from "./routes/messageRoutes"
import userRoutes from "./routes/userRoute"
const app = express()
import { clerkMiddleware } from '@clerk/express'
import { errorHandler } from "./middleware/errorHandler"
import cors from "cors"
import path from "path"
import fs from "fs"

// browsers enforce CORS, so the deployed web origin must be listed explicitly
const allowedOrigins = [
    "http://localhost:5173",  // Vite web dev
    "http://localhost:8081",  // Expo mobile
    process.env.FRONTEND_URL, // production web
].filter(Boolean) as string[]

app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use(express.json()) // parses incoming JSON request bodies and makes them available as req. body in your route handlers.

app.use(clerkMiddleware())
app.get("/health",(req, res)=>{
    res.json({status:"ok", message:"Server is running "})
})



app.use("/api/auth", authRoutes)
app.use("/api/chats", chatRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/users", userRoutes)

// error handlers must come after all the routes and other middleware so they can catch errors passed with next(err) or thrown inside async handlers.

app.use(errorHandler)

// serve frontend in production, but only when the build is actually next to us
// (single-service deploy). When the web app is deployed separately, this is skipped.
const webDist = path.join(__dirname, "../../web/dist")

if(process.env.NODE_ENV==="production" && fs.existsSync(webDist)){
    app.use(express.static(webDist))

    app.get("/{*any}",(_, res)=>{
        res.sendFile(path.join(webDist,"index.html"))
    })
}
export default app