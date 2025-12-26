import { Router } from 'express';
import { Request, Response } from "express";
import { stripe } from './server.js';  
import * as db from "./db/index.js";
import express from 'express';


const router = Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// TODO: Populate items_ordered and orders tables with checkout session data
router.post('/', async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) throw new Error("No Stripe signature found");
    if (!endpointSecret) throw new Error("No endpoint secret found");

    try{

        const event = stripe.webhooks.constructEvent(
            req.rawBody!, // This is already raw because of express.raw middleware
            signature,
            endpointSecret
        );

        // Return 200 to prevent Stripe from resending
        res.status(200).send({message:"event received"});


        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                // console.log('Payment succeeded!');
                // // console.log(event);
                console.log("WEBHOOK SESSION EVENT: ", event);
                // console.log("CUSTOMER DETAILS ", event.data.object.customer_details);
                // console.log("STATUS ", event.data.object.status);
                // console.log("PACKAGE DETAILS ", event.data.object.metadata);
                // console.log("SHIPPING COST ", event.data.object.shipping_cost);
                // console.log("TOTALS ",  event.data.object.total_details);
                
                const session = event.data.object;
                const sessionId = session.id;
                
                const doesEventExist = await db.query('SELECT event_id FROM orders WHERE event_id = $1', [event.id]);
                if ((doesEventExist.rowCount ?? 0) > 0) {
                    console.log("EVENT ID ALREADY BEING USED");
                    return;
                }

                // Retrieve the complete session with line items
                const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
                    sessionId,
                    {
                        expand : ["line_items", "line_items.data.price.product"],
                    }
                    );

                // console.log("LINE ITEMS: ", sessionWithLineItems.line_items);
                // console.log("LINE ITEMS NAME: ", sessionWithLineItems.line_items?.data[0]?.description);
                // console.log("LINE ITEMS PRICE: ", sessionWithLineItems.line_items?.data[0]?.price);
                // console.log("WEBHOOK SESSION RETRIVE: ", sessionWithLineItems);
                const order:OrderTable = {
                    status: session.status ?? "",
                    eventId: event.id,
                    checkoutSessionId: session.id,
                    customerEmail: session.customer_details?.email ?? "",
                    packageLength: Number(session.metadata?.packageLength),
                    packageWidth: Number(session.metadata?.packageWidth),
                    packageHeight: Number(session.metadata?.packageHeight),
                    packageWeight: Number(session.metadata?.packageWeight),
                    shippingCost: Number(session.shipping_cost?.amount_total) / 100,        // Convert from cents to dollars
                    totalCost: Number(session.amount_total) / 100,
                };
                const orderedItems = sessionWithLineItems.line_items?.data.map((item)=>{
                    const metadata = (item.price?.product && typeof item.price.product !== 'string' && 'metadata' in item.price.product) 
                        ? item.price.product.metadata 
                        : undefined;
                    return {
                        productId: Number(metadata?.productId ?? 0),
                        productName: item.description ?? "No Product Name",
                        quantity: item.quantity ?? 0,       
                    }
                });

                if (!orderedItems) return;
                // console.log("ORDER ", order);
                // console.log("ORDERED ITEMS ", orderedItems);
                writeOrderToDB(orderedItems, order);
        break;
        default:
        console.log(`Unhandled event type ${event.type}`);
        }
    } catch(err){
        console.error("WEBHOOK ERROR: ", err);
    }
});

type ItemsOrderedTable = {
    productId: number;
    productName: string;
    quantity: number;
}
type OrderTable = {
    status: string;
    eventId: string;
    checkoutSessionId: string;
    customerEmail: string;
    packageLength: number;
    packageWidth: number;
    packageHeight: number;
    packageWeight: number;
    shippingCost: number;
    totalCost: number;
}

async function writeOrderToDB(orderedItems:ItemsOrderedTable[], orderPlaced:OrderTable){
    try {
        await db.query("BEGIN");
        const result = await db.query(
            `
                INSERT INTO orders
                (status, event_id, checkout_session_id, customer_email, package_length, package_width, package_height, package_weight, shipping_cost, total_cost)
                VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `, [
                orderPlaced.status,
                orderPlaced.eventId,
                orderPlaced.checkoutSessionId, 
                orderPlaced.customerEmail, 
                orderPlaced.packageLength, 
                orderPlaced.packageWidth,
                orderPlaced.packageHeight,
                orderPlaced.packageWeight,
                orderPlaced.shippingCost,
                orderPlaced.totalCost
            ]
        );
        
        const orderId = result.rows[0].id;

        for (let i = 0; i < orderedItems.length; i++) {
            await db.query(
                `
                    INSERT INTO ordered_items
                    (order_id, product_id, product_name, quantity)
                    VALUES
                    ($1, $2, $3, $4)
                `, [
                    orderId, 
                    orderedItems[i]?.productId, 
                    orderedItems[i]?.productName, 
                    orderedItems[i]?.quantity
                ]
            )
        }
        await db.query("COMMIT");
    } catch (err) {
        await db.query("ROLLBACK");
        console.error(err);
    }   
}

export default router;