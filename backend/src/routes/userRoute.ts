import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { searchUserByEmail } from "../controllers/userController";

const router = Router()

// GET /api/users/search?email=someone@example.com
router.get("/search", protectRoute, searchUserByEmail)

export default router