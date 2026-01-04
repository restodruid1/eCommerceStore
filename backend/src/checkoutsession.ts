import { Router } from 'express';
import { Request, Response } from "express";
import { Item } from './server.js';
import * as db from "./db/index.js";
import { stripe } from './server.js';
import { QueryResult } from 'pg';
import dotenv from "dotenv";
dotenv.config();

const router = Router();

type DataInterface = {
  id: number,
  category: number,
  name: string,
  quantity: number,
  weight: number,
  length: number,
  height: number,
  width: number,
  price: number,
  url: string,
};


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
    console.log("product information: ", result.rows);
    var newItemsArray:DataInterface[] = [];
    for (const item of items) {
      const product = result.rows.find(p => p.id === item.id);
      if (!product) {
        return { success:false, error: "ITEM NOT FOUND" };
      }
    
      if (item.quantity > product.quantity || item.quantity === 0) {
        return { 
          success:false, 
          error: product.quantity === 0 ? `${item.name} is out of stock` : `Only ${product.quantity} ${item.name} available`, 
        };
      }
      
      // Ensure proper data, not client data
      const object = new Object({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        url: product.url,
        weight: product.weight,
        height: product.height,
        length: product.length,
        width: product.width,
      });
      newItemsArray.push(object as DataInterface);
    }
    // return {success:true, items};
    return {success:true, newItemsArray};

  } catch (e) {
    console.error("STRIPE ERROR:", e);
    return {success:false, error:"STRIP CALL ERROR"};
  } 
}
export async function terminateReserveUpdateStock(user_id:string){
  try{
    await db.query("BEGIN");

    await db.query(
      `
      UPDATE products p
      SET quantity = p.quantity + c.quantity
      FROM cart_reservations c
      WHERE c.user_id = $1
        AND p.id = c.product_id
      `,
      [user_id]
    );

    await db.query(`
      DELETE FROM cart_reservations
      WHERE user_id = $1
      `,[user_id]);
    
    await db.query("COMMIT");

    return { success: true };
  }catch (err){
    await db.query("ROLLBACK");
    return { success: false, error: err };
  }
}

async function reserveStock(cartItems:DataInterface[], user_id:string|null) {
  const items = cartItems;
  
  try {
    await db.query("BEGIN");    // All or nothing

    const ids = items.map((item)=>item.id);
    const qtys = items.map(i => i.quantity);

    const result = await db.query(
      `
      UPDATE products
      SET quantity = products.quantity - x.qty
      FROM (
        SELECT UNNEST($1::int[]) AS id,
               UNNEST($2::int[]) AS qty
      ) x
      WHERE products.id = x.id
      AND products.quantity >= x.qty
      RETURNING products.id;
      `,
      [ids, qtys]
    );
    if (!result.rowCount || result.rowCount < items.length) throw new Error("Bad Cart Data");

    const userId = crypto.randomUUID();
    await db.query(
      `
      INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
      SELECT $1, x.id, x.qty, NOW() + INTERVAL '30 minutes'
      FROM UNNEST($2::int[], $3::int[]) AS x(id, qty)
      `,
      [userId, ids, qtys]
    );

    await db.query("COMMIT");
    return { success: true, uuid:userId };

  } catch (err) {
    await db.query("ROLLBACK");
    return { success: false, error: err };

  } finally {
    // db.client.release();
  }
}

const checkout = async(items:DataInterface[], req:Request, res:Response, uuid:string)=>{
  try {
        const session = await stripe.checkout.sessions.create({
          ui_mode: 'embedded',
            permissions: {
              update_shipping_details: 'server_only',
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
            // invoice_creation:{
            //   enabled: true
            // },
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
                            images:[item.url],
                            metadata:{
                              weight: item.weight.toString(),
                              length: item.length.toString(),
                              height: item.height.toString(),
                              width: item.width.toString(),
                              productId: item.id
                            },
                          },
                          unit_amount: Math.round(item.price * 100),
                        },
                        quantity: item.quantity,
          })),
          metadata:{
            uuid: uuid
          },
          mode: 'payment',
          // return_url: `http://localhost:5173/CheckoutReturn?session_id={CHECKOUT_SESSION_ID}`,
          return_url: process.env.CLIENT_URL + `/CheckoutReturn?session_id={CHECKOUT_SESSION_ID}`,
          // success_url: `http://localhost:5173/Cart?success=true`,
          // cancel_url: `http://localhost:5173/Cart?canceled=true`,
        });
        
        return { clientSecret: session.client_secret, sessionId: session.id };
      } catch (e) {
        console.error("STRIPE ERROR:", e);
        return {error:"STRIP CALL ERROR"};
      }
};

router.post('/', async (req, res) => {
  var newUuid = "";
  try{
    const items = req.body.items as Item[];
    const userId = req.body.uuid as string | null;

    if (userId != null) {
        await terminateReserveUpdateStock(userId);
    }
    const cartState = await validateUserCart(items);  // Sanatize items to ensure no client side manipulation
    
    if (!cartState?.success) {
      return res.status(500).send({error: cartState?.error});
    }
    const stockResp = await reserveStock(cartState.newItemsArray!, userId);   // Validate stock & reserve cart on db for 30 minutes
    console.log(stockResp);
    newUuid = stockResp.uuid ?? "";
    
    if (!stockResp.success) return res.status(500).send({error: stockResp.error});

    const checkoutResult = await checkout(cartState.newItemsArray!, req, res, stockResp.uuid!);   // Stripe checkout
    if (checkoutResult.error) return res.status(500).send({error: checkoutResult.error, uuid:stockResp.uuid!});
    

    return res.send({checkoutResult: checkoutResult, uuid: stockResp.uuid!})
  } catch(e) {
    return res.status(500).send({error:e, uuid:newUuid});
  }
});

export default router;