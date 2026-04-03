import { Router } from 'express';
import { stripe } from './server.js';
import * as db from "./db/index.js";
import pool from "./db/index.js";


const router = Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', async (req, res) => {
    const signature = req.headers['stripe-signature'];

    try {
        if (!signature) throw new Error("No Stripe signature found");
        if (!endpointSecret) throw new Error("No endpoint secret found");

        const event = stripe.webhooks.constructEvent(
            req.rawBody!,
            signature,
            endpointSecret
        );

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                console.log("WEBHOOK SESSION EVENT: ", event);

                const session = event.data.object;
                const sessionId = session.id;

                const doesEventExist = await db.query('SELECT event_id FROM orders WHERE event_id = $1', [event.id]);
                if ((doesEventExist.rowCount ?? 0) > 0) {
                    console.log("EVENT ID ALREADY BEING USED");
                    return res.status(200).send({ message: "event received" });
                }

                // Retrieve the complete session with line items
                const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
                    sessionId,
                    { expand: ["line_items", "line_items.data.price.product"] }
                );

                const order: OrderTable = {
                    status: session.status ?? "",
                    eventId: event.id,
                    checkoutSessionId: session.id,
                    customerEmail: session.customer_details?.email ?? "",
                    packageLength: Number(session.metadata?.packageLength),
                    packageWidth: Number(session.metadata?.packageWidth),
                    packageHeight: Number(session.metadata?.packageHeight),
                    packageWeight: Number(session.metadata?.packageWeight),
                    shippingCost: Number(session.shipping_cost?.amount_total) / 100,
                    totalCost: Number(session.amount_total) / 100,
                };

                const orderedItems = sessionWithLineItems.line_items?.data.map((item) => {
                    const metadata = (item.price?.product && typeof item.price.product !== 'string' && 'metadata' in item.price.product)
                        ? item.price.product.metadata
                        : undefined;
                    const productId = Number(metadata?.productId);
                    if (!productId) throw new Error(`Missing productId in metadata for item: ${item.description}`);
                    return {
                        productId,
                        productName: item.description ?? "No Product Name",
                        quantity: item.quantity ?? 0,
                    };
                });

                if (!orderedItems) return;
                await writeOrderToDB(orderedItems, order);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.status(200).send({ message: "event received" });
    } catch(err){
        console.error("WEBHOOK ERROR: ", err);
        res.status(500).send({ error: "Webhook processing failed" });
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

async function writeOrderToDB(orderedItems: ItemsOrderedTable[], orderPlaced: OrderTable) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
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
            await client.query(
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
            );
        }
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
    } finally {
        client.release();
    }
}

export default router;
