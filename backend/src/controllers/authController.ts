import type {AuthRequest} from "../middleware/auth"
import type {Response,Request, NextFunction} from "express"
import { User } from "../models/User"
import { clerkClient, getAuth } from "@clerk/express"

export async function getMe(req:AuthRequest, res:Response, next:NextFunction){
    try {
        const userId = req.userId
        const user = await User.findById(userId)
        if(!user) {
            res.status(404).json({message:"Usr not found"})
        return}
        res.status(200).json(user)
    } catch (error) {
        res.status(500)
        next(error)
    }
}

export async function authCallback(req:Request, res:Response,next:NextFunction){
  try {
     const {userId: clerkId} = getAuth(req)
     if(!clerkId) {
        res.status(401).json({message:"Unauthorized"})
        return;
     }
    // Clerk is the source of truth for profile data, so re-read it on every
    // sign-in and write it through. Creating the row only on first login left
    // stale names and avatars behind whenever a user changed them in Clerk.
    const clerkUser = await clerkClient.users.getUser(clerkId)
    const email = clerkUser.emailAddresses[0]?.emailAddress
    const name = clerkUser.firstName
        ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
        : email?.split("@")[0]

    const user = await User.findOneAndUpdate(
        {clerkId},
        {$set: {name, email, avatar: clerkUser.imageUrl}},
        {new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true}
    )

    res.json(user)

  } catch (error) {
    res.status(500)
    next(error)
    
  }
}