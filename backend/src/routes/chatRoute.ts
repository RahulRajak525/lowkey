import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { deleteChat, getChats, getOrCreateChat } from "../controllers/chatController";

const router = Router()

router.use(protectRoute)

router.get("/" ,getChats)
router.get("/with/:participantId", getOrCreateChat)
router.delete("/:chatId", deleteChat)
export default router