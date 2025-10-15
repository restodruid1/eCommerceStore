import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import pool from "./config/db.js";
// import { Request, Response } from "express";

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json()); // middleware to parse JSON
app.get("/", async (req, res)=>{
    try {
        const result = await pool.query("SELECT * FROM people2");
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
      }
    // res.send("<h1>HELLO WORLD</h1>");
})

export default app;