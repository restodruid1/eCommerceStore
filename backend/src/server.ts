import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import checkoutsession from "./checkoutsession.js";
import databasequeries from "./databaseroutes.js";
import handleshipping from "./shipping.js";
import checkoutreturn from "./checkoutreturn.js";
import admin from "./admin.js";
import Stripe from "stripe";

export interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image:string;
}

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
export const stripe = new Stripe(`${process.env.TEST_STRIPE_API}`);

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ["GET", "POST"]
  }));

app.use('/create-checkout-session', checkoutsession);
app.use('/products', databasequeries);
app.use('/calculate-shipping-options', handleshipping);
app.use('/session_status', checkoutreturn);
app.use('/api', admin);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});