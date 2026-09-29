import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { clearChat, deleteChat, getChats, getOrCreateChat } from "../controllers/chatController";

const router = Router()

router.use(protectRoute)

router.get("/" ,getChats)
router.get("/with/:participantId", getOrCreateChat)
router.delete("/:chatId", deleteChat)
router.delete("/:chatId/messages", clearChat)
export default router