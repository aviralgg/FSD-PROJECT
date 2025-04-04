import { Router } from "express";

const router = Router();

router.route("/").get((req,res)=>{
    res.send("<h1>hello</h1>");
})

export default router;