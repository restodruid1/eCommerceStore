import { Router } from 'express';
import { Request, Response } from "express";
import { Item } from './server.js';
import * as db from "./db/index.js";
import { stripe } from './server.js';
import { QueryResult } from 'pg';

const router = Router();

async function validateUserCart(cartItems:Item[]){
  const items = cartItems;
  try {
    const result = await db.query(
    `SELECT 
          p.*, 
          pi.product_id,
          pi.url,
          pi.main_image
      FROM products p
      JOIN product_images pi 
          ON pi.product_id = p.id
      WHERE pi.main_image = true;`
    ,[]);

    for (const item of items) {
      const product = result.rows.find(p => p.id === item.id);
      // console.log("ITEM QUANTITY: " + item.quantity);
      if (!product) {
        return { success:false, error: "ITEM NOT FOUND" };
      }
    
      if (item.quantity > product.quantity || item.quantity === 0) {
        // console.log("QUANTITY:", item.quantity);
        return { success:false, error: `Only ${product.quantity} ${item.name} available` };
      }
      // console.log("ITEM QUANTITY2: " + item.quantity);
      // Ensure proper data, not client data
      item.id = product.id;
      item.name = product.name;
      item.price = product.price;
      item.image = product.url;
    }
    return {success:true, items};

  } catch (e) {
    console.error("STRIPE ERROR:", e);
    return {success:false, error:"STRIP CALL ERROR"};
  } 
}
export async function terminateReserveUpdateStock(user_id:string){
  try{
    // console.log("begin");
    console.log("terminating old cart");
    await db.query("BEGIN");
    const resp = await db.query(`
      SELECT * FROM cart_reservations
      WHERE user_id = $1
      `,[user_id]);

    for (const row of resp.rows) {
      await db.query(`
        UPDATE products
        SET quantity = quantity + $1
        WHERE id = $2
      `, [row.quantity, row.product_id]);
    }

    if (resp.rows.length > 0) {
      await db.query(`
        DELETE FROM cart_reservations
        WHERE user_id = $1
        `,[user_id]);
    }
    // console.log("end");
    await db.query("COMMIT");
    return { success: true };
  }catch (err){
    await db.query("ROLLBACK");
    return { success: false, error: err };
  }
}

async function reserveStock(cartItems:Item[], user_id:string|null) {
  const items = cartItems;
  // console.log(user_id);
  // if (user_id != null) {
  //   terminateReserveUpdateStock(user_id);
  // }

  try {
    await db.query("BEGIN");    // All or nothing

    var productRows:{id:number, quantity:number}[] = [];
    for (const item of items){

      // Lock row FOR UPDATE so no one else can modify stock meanwhile
      const productRes:QueryResult = await db.query(
        `
        SELECT id, quantity
        FROM products
        WHERE id = $1
        FOR UPDATE
        `,
        [item.id]
      );
      productRows.push(productRes.rows[0]);
    }
    console.log(productRows);
    
    items.forEach((item, index) => {
      const stock = productRows[index]?.quantity;
      if (stock! < items[index]?.quantity!) throw new Error(`Not enough stock available of ${item.name}`);
    })

    for (const item of items){
      // Decrement stock
      await db.query(
        `
        UPDATE products
        SET quantity = quantity - $1
        WHERE id = $2
        `,
        [item.quantity, item.id]
      );
    }

    const userId = crypto.randomUUID();
    for (const item of items){
      // Create reservation (expires later if user abandons cart)
      await db.query(
        `
        INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes')
        `,
        [userId, item.id, item.quantity]
      );
    }

    await db.query("COMMIT");
    return { success: true, uuid:userId };

  } catch (err) {
    await db.query("ROLLBACK");
    return { success: false, error: err };

  } finally {
    // db.client.release();
  }
}

const checkout = async(items:Item[], req:Request, res:Response, uuid:string)=>{
  try {
        const session = await stripe.checkout.sessions.create({
          ui_mode: 'embedded',
            permissions: {
              update_shipping_details: 'server_only',
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
            invoice_creation:{
              enabled: true
            },
            // automatic_tax: {
            //   enabled: true
            // },
            shipping_address_collection: {
              allowed_countries: ['US'],
            },
            shipping_options: [{
              shipping_rate_data: {
                display_name: "Enter address to determine shipping",
                type: 'fixed_amount',
                fixed_amount: {
                  amount: 0,
                  currency: 'usd',
                },
              },
            }],
          line_items: items.map(item =>({
            price_data: {
                          currency: 'usd',
                          product_data: {
                            name: item.name,
                            images:[item.image],
                          },
                          unit_amount: Math.round(item.price * 100),
                        },
                        quantity: item.quantity,
          })),
          metadata:{
            uuid: uuid
          },
          mode: 'payment',
          return_url: `http://localhost:5173/CheckoutReturn?session_id={CHECKOUT_SESSION_ID}`,
          // success_url: `http://localhost:5173/Cart?success=true`,
          // cancel_url: `http://localhost:5173/Cart?canceled=true`,
        });
        console.log("session: " + session.id);
        // return session;
        return { clientSecret: session.client_secret, sessionId: session.id };
        // res.json({url:session.url!});
      } catch (e) {
        console.error("STRIPE ERROR:", e);
        return res.status(400).send({error:"STRIP CALL ERROR"});
      }
};

router.post('/', async (req, res) => {
  try{
    const items = req.body.items as Item[];
    // console.log(req.body.uuid);
    // const userId = JSON.parse(req.body.uuid) as string | null;
    const userId = req.body.uuid as string | null;
    if (userId != null) {
        await terminateReserveUpdateStock(userId);
    }
    const cartState = await validateUserCart(items);  // Sanatize items to ensure no client side manipulation
    
    if (!cartState?.success) {
      return res.status(500).send({error: cartState?.error});
    }
    const stockResp = await reserveStock(cartState.items!, userId);   // Validate stock & reserve cart on db for 30 minutes
    console.log(stockResp);

    if (!stockResp.success) return res.status(500).send({error: stockResp.error});

    const checkoutResult = await checkout(cartState.items!, req, res, stockResp.uuid!);   // Stripe checkout

    // return res.json(checkoutResult, stockResp.uuid!);
    return res.send({checkoutResult: checkoutResult, uuid: stockResp.uuid!})
  } catch(e) {
    return res.status(500).send({error:e});
  }
});

export default router;