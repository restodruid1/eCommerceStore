import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import checkoutsession from "./checkoutsession.js";
import databasequeries from "./databaseroutes.js";
import handleshipping from "./shipping.js";
import checkoutreturn from "./checkoutreturn.js";
import webhook from "./webhook.js";
import awsS3 from "./awsS3.js";
import admin from "./admin.js";
import Stripe from "stripe";
import { Request, Response } from 'express';

export interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image:string;
}

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}


dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
export const stripe = new Stripe(`${process.env.TEST_STRIPE_API}`);


app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST"]
  }));

app.use(express.json({
  verify: (req: Request, res: Response, buf: Buffer) => {
    if (req.originalUrl.startsWith('/webhook')) {
      req.rawBody = buf; // save raw buffer
    }
  }
}));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    skip: (req) => req.path.startsWith('/webhook') || req.path.startsWith('/products'),
    message: { error: "Too many requests, please try again later." }
}));

app.use('/webhook', webhook);
app.use('/create-checkout-session', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: "Too many checkout attempts, please try again later." }
}), checkoutsession);
app.use('/products', databasequeries);
app.use('/calculate-shipping-options', handleshipping);
app.use('/session_status', checkoutreturn);
app.use('/api', admin);
app.use('/api/admin/AwsS3', awsS3);
app.use('/session_status/webhooks', checkoutreturn);

app.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`);
});