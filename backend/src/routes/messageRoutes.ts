import { Router } from "express";

const router = Router()

router.get("/message", (req, res)=>{
    res.json({status:"ok", message:"Running for message"})
})

export default router