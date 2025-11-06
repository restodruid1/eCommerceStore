import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import pool from "./db/index.js";
import * as db from "./db/index.js";
import Stripe from "stripe";
// import { Request, Response } from "express";

interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image:string;
}

dotenv.config();
const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"]
  }));
// app.use(cors());
app.use(express.json()); 
const stripe = new Stripe(`${process.env.TEST_STRIPE_API}`);

app.post('/create-checkout-session', async (req, res) => {
  // console.log(req.body.items);
  const items = req.body.items as Item[];
  try {
    const session = await stripe.checkout.sessions.create({
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
      success_url: `http://localhost:5173/Cart?success=true`,
      cancel_url: `http://localhost:5173/Cart?canceled=true`,
    });
  
    res.json({url:session.url!});
  } catch (e) {
    console.error("STRIPE ERROR:", e);
    res.status(400).send("STRIP CALL ERROR");
  }
  
});



app.get("/products/customnail", async (req, res)=>{
    try {
        const result = await db.query(
          `SELECT 
              p.*, 
              pi.url
          FROM products p
          JOIN product_images pi 
              ON pi.product_id = p.id
          WHERE p.category = 1
            AND pi.main_image = TRUE;`
          ,[]);
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
      }
})
app.get("/products/artprintsandstickers", async (req, res)=>{
    try {
        const result = await db.query(
          `SELECT 
              p.*, 
              pi.url
          FROM products p
          JOIN product_images pi 
              ON pi.product_id = p.id
          WHERE p.category = 2
            AND pi.main_image = TRUE;`
          ,[]);
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
      }
})
app.get("/products/otherhandmadecrafts", async (req, res)=>{
    try {
        const result = await db.query(
          `SELECT 
              p.*, 
              pi.url
          FROM products p
          JOIN product_images pi 
              ON pi.product_id = p.id
          WHERE p.category = 3
            AND pi.main_image = TRUE;`
          ,[]);
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
      }
})
app.get("/products/channelmerch", async (req, res)=>{
    try {
        const result = await db.query(
          `SELECT 
              p.*, 
              pi.url
          FROM products p
          JOIN product_images pi 
              ON pi.product_id = p.id
          WHERE p.category = 4
            AND pi.main_image = TRUE;`
          ,[]);
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
      }
})

app.get("/products/:id", async (req, res)=>{
  try {
      const { id } = req.params;
      console.log(id);
      const result = await db.query(
        `SELECT 
            p.*, 
            pi.product_id,
            pi.url,
            pi.main_image
        FROM products p
        JOIN product_images pi 
            ON pi.product_id = p.id
        WHERE p.id = $1;`
        ,[id]);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send("Database error");
    }
  // res.send("<h1>HELLO WORLD</h1>");
})

export default app;