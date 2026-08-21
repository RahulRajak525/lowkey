import app from "./src/app"
import {connectDB} from "./src/config/database"
const PORT = process.env.PORT || 3000

import {createServer} from "http"
import { initializeSocket } from "./src/utils/socket"

const httpServer = createServer(app)

initializeSocket(httpServer)

connectDB().then(()=>{
    app.listen(PORT, ()=>{
    console.log('Server is up and running on Port:', PORT)

})
}).catch((err)=>{
    console.log("Failed to start server:", err)
    process.exit(1)
})

