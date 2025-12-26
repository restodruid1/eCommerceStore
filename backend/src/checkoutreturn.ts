import { Router } from 'express';
import { Request, Response } from "express";
import { stripe } from './server.js';  
import * as db from "./db/index.js";
import { terminateReserveUpdateStock } from './checkoutsession.js';
import { Order } from 'shippo';

const router = Router();

router.get('/', async (req:Request, res:Response) => {
    try {
        const raw_session_id = req.query.session_id;
    
        if (typeof raw_session_id !== "string") {
            return res.send({error:"Something went wrong"});
        }
        const session_id = String(raw_session_id);
        const session = await stripe.checkout.sessions.retrieve(session_id);


        if (session.status === "complete") {
            await db.query(
                `DELETE FROM cart_reservations
                WHERE user_id = $1`, [session.metadata!.uuid]
            );
        }
        
        return res.status(200).send({
            status: session.status,
            payment_status: session.payment_status,
            customer_email: session.customer_details?.email ?? "No Email Entered"
        });
    } catch (err) {
        res.status(400).send({error:"Something Went Wrong"});
    }
})
router.post('/check', async (req:Request, res:Response) => {
    try{
        // console.log("REQ BODY: " + req.body);
        const seshId = req.body.seshId;
        const uuid = req.body.uuid;
        const customerSession = await stripe.checkout.sessions.retrieve(seshId);
        
        if (customerSession.status === "expired") {
            await terminateReserveUpdateStock(uuid);
            return res.send({status: "expired"});
        } 
        res.send({status: "not-expired"});
    } catch (e) {
        res.status(400).send({error:"Something Went Wrong"});
    }
})
router.post('/deleteCartReservation', async (req:Request, res:Response) => {
    try{
        const uuid = req.body.uuid;
        if (uuid) {
            const response = await terminateReserveUpdateStock(uuid);
            return res.send(response);
        }
        
        res.send({status: "failed"});
    } catch (e) {
        res.status(400).send({error:"Something Went Wrong"});
    }
})


export default router;