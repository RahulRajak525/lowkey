import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

// There is deliberately no "list everyone" endpoint: a signed-in user should
// only be able to find someone else by already knowing their exact email,
// not by browsing the whole directory. Only one row can ever match, since
// email is unique on the model.
export async function searchUserByEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId
        const emailParam = req.query.email

        if (typeof emailParam !== "string" || !emailParam.trim()) {
            res.status(400).json({ message: "email is required" })
            return
        }

        const email = emailParam.trim().toLowerCase()

        // Excluded rather than shown as a search hit: messaging yourself is
        // already offered separately (the always-visible "You" row), so a
        // self-match here would just be a confusing duplicate.
        const user = await User.findOne({ email, _id: { $ne: userId } }).select("name email avatar")

        res.json(user)
    } catch (error) {
        res.status(500)
        next(error)
    }
}
