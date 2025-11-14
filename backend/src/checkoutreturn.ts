import { Router } from 'express';
import { Request, Response } from "express";
import { stripe } from './server.js';  

const router = Router();

router.get('/', async (req:Request, res:Response) => {
    try {
        const raw_session_id = req.query.session_id;
        console.log(raw_session_id);
        console.log(typeof raw_session_id);
    
        if (typeof raw_session_id !== "string") {
            res.send({error:"Something went wrong"});
        }
        const session_id = String(raw_session_id);
        const session = await stripe.checkout.sessions.retrieve(session_id);
    
        res.status(200).send({
            status: session.status,
            payment_status: session.payment_status,
            customer_email: session.customer_details?.email ?? "No Email Entered"
        });
    } catch (err) {
        res.status(400).send({error:"Something Went Wrong"});
    }
})

export default router;