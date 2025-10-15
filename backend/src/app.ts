import express from "express";
import dotenv from "dotenv";
// import { Request, Response } from "express";

dotenv.config();

const app = express();

app.use(express.json()); // middleware to parse JSON
app.get("/", (req, res)=>{
    res.send("<h1>HELLO WORLD</h1>");
})

export default app;