import { Router } from 'express';
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { requireAdmin } from './Middleware.js';

const router = Router();

router.post('/admin/login', (req: Request ,res:Response) => {
    const { username, password } = req.body;
    const JWT_SECRET = process.env.JWTSECRET;

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    
    if (JWT_SECRET === undefined) return res.status(501).json({ error: "Server error" });
    const token = jwt.sign({ role: "admin" }, JWT_SECRET!, { expiresIn: "1h" });

    res.json({ message: "Logged in", jwt: token });
});

router.post('/admin/page', requireAdmin, (req,res)=>{
    res.json({message: "valid"});
});

export default router;