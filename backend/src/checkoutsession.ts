import { Router } from 'express';
import { Request, Response } from "express";
import { Item } from './server.js';
import * as db from "./db/index.js";
import { stripe } from './server.js';

const router = Router();


router.post('/', async (req, res) => {
  // console.log(req.body.items);
  const items = req.body.items as Item[];
  console.log("HERE");
  // Validate client cart data before checkout
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
        
        if (!product) {
          return res.json({ message: "ITEM NOT FOUND" });
        }
      
        if (item.quantity > product.quantity || item.quantity === 0) {
          console.log("QUANTITY:", item.quantity);
          return res.json({ message: "ITEM QUANTITY NOT AVAILABLE" });
        }
      
        // Ensure proper data, not client data
        item.id = product.id;
        item.name = product.name;
        item.price = product.price;
        item.image = product.url;
      }
      
      checkout(items, req, res);    // Stripe checkout
      
    } catch (e) {
      console.error("STRIPE ERROR:", e);
      res.status(400).send({error:"STRIP CALL ERROR"});
    } 
});


const checkout = async(items:Item[], req:Request, res:Response)=>{
  try {
        const session = await stripe.checkout.sessions.create({
          ui_mode: 'embedded',
            permissions: {
              update_shipping_details: 'server_only',
            },
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
          mode: 'payment',
          return_url: `http://localhost:5173/CheckoutReturn?session_id={CHECKOUT_SESSION_ID}`,
          // success_url: `http://localhost:5173/Cart?success=true`,
          // cancel_url: `http://localhost:5173/Cart?canceled=true`,
        });
        console.log(session);
        // return session;
        res.json({clientSecret: session.client_secret});
        // res.json({url:session.url!});
      } catch (e) {
        console.error("STRIPE ERROR:", e);
        return res.status(400).send({error:"STRIP CALL ERROR"});
      }
};

export default router;