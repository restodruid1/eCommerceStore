import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import pool from "./db/index.js";
import * as db from "./db/index.js";
// import { Request, Response } from "express";

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json()); // middleware to parse JSON
app.get("/products/customnail", async (req, res)=>{
    try {
        // const result = await db.query(
        //   `SELECT * 
        //   FROM products
        //   WHERE CATEGORY = 1`
        //   ,[]);

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