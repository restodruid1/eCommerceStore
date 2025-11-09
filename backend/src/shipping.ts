import { Router } from 'express';
import { Request, Response } from "express";
import { stripe } from './server.js';
import Stripe from 'stripe';
const router = Router();

function validateShippingDetails(shippingDetails:ShippingDetails) {
    // TODO: Remove error and implement...
    return true;
    throw new Error(`
      Validate the shipping details the customer has entered.
    `);
  }
  
// Return an array of the updated shipping options or the original options if no update is needed.
function calculateShippingOptions(shippingDetails:ShippingDetails, session:Stripe.Checkout.Session) {
// TODO: Remove error and implement...
// throw new Error(`
//     Calculate shipping options based on the customer's shipping details and the
//     Checkout Session's line items.
// `);
return [
    {
      shipping_rate_data: {
        display_name: "Standard Shipping",
        type: "fixed_amount",
        fixed_amount: {
          amount: 500, // $5.00
          currency: "usd",
        },
        delivery_estimate: {
          minimum: {
            unit: "business_day",
            value: 3,
          },
          maximum: {
            unit: "business_day",
            value: 5,
          },
        },
      },
    }];
}

interface ShippingDetailsChangeEvent {
  checkout_session_id: string;  // ID of the Checkout Session
  shipping_details: ShippingDetails;
}
interface ShippingDetails {
  name: string;             // Customer's full name (e.g., "Jane Smith")
  address: {
    line1: string;          // Address line 1 (e.g., "123 Main St")
    line2?: string;         // Address line 2 (e.g., "Apt 4B") - optional
    city: string;           // City (e.g., "San Francisco")
    state: string;          // State/province/region (e.g., "CA")
    postal_code: string;    // ZIP or postal code (e.g., "94111")
    country: string;        // Two-letter country code (e.g., "US")
  };
  phone?: string;           // Phone number - optional, may not be present if not collected
  
}

router.post('/', async (req:Request, res:Response) => {
    const {checkout_session_id, shipping_details} = req.body as ShippingDetailsChangeEvent;

    // 1. Retrieve the Checkout Session
    const session = await stripe.checkout.sessions.retrieve(checkout_session_id);

    // 2. Validate the shipping details
    if (!validateShippingDetails(shipping_details)!) {
        return res.json({type: 'error', message: "We can't ship to your address. Please choose a different address."});
    }

    // 3. Calculate the shipping options
    const shippingOptions:any = calculateShippingOptions(shipping_details, session);

    // 4. Update the Checkout Session with the customer's shipping details and shipping options
    if (shippingOptions!) {
        console.log("HERE " + shippingOptions);
        await stripe.checkout.sessions.update(checkout_session_id, {
        collected_information: {shipping_details},
        shipping_options: shippingOptions,
        });

        return res.json({type:'object', value: {succeeded: true}});
    } else {
        return res.json({type:'error', message: "We can't find shipping options. Please try again."});
    }
});

export default router;
