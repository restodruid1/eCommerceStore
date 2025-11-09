import * as db from "./db/index.js";
import { Router } from 'express';
const router = Router();

router.get("/customnail", async (req, res)=>{
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
router.get("/artprintsandstickers", async (req, res)=>{
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
router.get("/otherhandmadecrafts", async (req, res)=>{
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
router.get("/channelmerch", async (req, res)=>{
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

router.get("/:id", async (req, res)=>{
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

export default router;