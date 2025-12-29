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

router.get('/YouTubeVideoId', async (req, res) =>{
    console.log("Fetching YouTube video ID");
    try{
        const result = await db.query(
                `
                SELECT * FROM youtube_videos;
                `
                  ,[]);
        
        if (result && result.rowCount && result.rowCount > 0 ) {
            return res.status(200).json({result: result.rows[0]})
        } else {
            return res.status(404).json({ message: "No videos found"});
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
})

router.get('/FeaturedProducts', async (req, res) =>{
    try{
        const result = await db.query(
                `
                SELECT  
                  p.*,
                  pi.url 
                FROM products p
                JOIN product_images pi
                  ON pi.product_id = p.id
                WHERE 
                  p.featured = true
                  AND pi.main_image = true;
                `
                  ,[]);
        
        if (result && result.rowCount && result.rowCount > 0 ) {
            return res.status(200).json({result: result.rows})
        } else {
            return res.status(404).json({ message: "No Featured Products Found"});
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
})

router.get("/:id", async (req, res)=>{
  try {
      const { id } = req.params;
     
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