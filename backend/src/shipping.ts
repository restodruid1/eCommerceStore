import { Router } from 'express';
import { Request, Response } from "express";
import { stripe } from './server.js';
import Stripe from 'stripe';
import { Shippo } from "shippo";
const router = Router();

function validateShippingDetails(shippingDetails:ShippingDetails) {
    // TODO: Remove error and implement...
    return true;
    throw new Error(`
      Validate the shipping details the customer has entered.
    `);
  }
 
const allowedCarriers = ["USPS", "UPS", "FedEx", "DHL Express"];
interface ParcelCreateRequest {
  length: string;
  width: string;
  height: string;
  distanceUnit: "in" | "cm";
  weight: string;
  massUnit: "oz" | "lb" | "g" | "kg";
}

const shippo = new Shippo({apiKeyHeader: `${process.env.SHIPPO_TEST_API}`});

interface AddressCreateRequest {
  name: string;
  company: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

const addressFrom: AddressCreateRequest = {
    name: process.env.SENDER_NAME!,
    company: process.env.SENDER_COMPANY!,
    street1: process.env.SENDER_ADDRESS!,
    city: process.env.SENDER_CITY!,
    state: process.env.SENDER_STATE!,
    zip: process.env.SENDER_ZIP!,
    country: process.env.SENDER_COUNTRY!, // iso2 country code
    phone: process.env.SENDER_PHONE!,
    email: process.env.SENDER_EMAIL!,
};

export interface SimplifiedShippoRate {
  provider: string;
  servicelevel: {
    name: string;
  };
  amount: string;
  currency: string;
  estimated_days?: number;
}

type AllowedCarrier = "USPS" | "UPS" | "FedEx" | "DHL";
function getFilteredRates(rates: any[]): SimplifiedShippoRate[] {
  return rates
  .filter(rate => allowedCarriers.includes(rate.provider))
  .filter(rate => parseFloat(rate.amount) < 100)
  .map(rate => ({
    provider: rate.provider,
    servicelevel: { name: rate.servicelevel?.name },
    amount: rate.amount,
    currency: rate.currency,
    estimated_days: rate.estimatedDays
  }))
  .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount)) 
  .slice(0, 5); 
}



// Return an array of the updated shipping options or the original options if no update is needed.
async function calculateShippingOptions(shippingDetails:ShippingDetails, session:Stripe.Checkout.Session) {
// TODO: Remove error and implement...
// throw new Error(`
//     Calculate shipping options based on the customer's shipping details and the
//     Checkout Session's line items.
// `);
const addressTo = {
  name: "Mr Hippo",
  street1: "Broadway 1",
  city: "New York",
  state: "NY",
  zip: "10007",
  country: "US",
};

const parcel:ParcelCreateRequest = {
  length: "5",
  width: "5",
  height: "5",
  distanceUnit: "in",
  weight: "2",
  massUnit: "lb"
};

const parcel2 = {
  length: "10",
  width: "10",
  height: "10",
  distanceUnit: "In",
  weight: "2",
  massUnit: "Lb"
};

const shipment = await shippo.shipments.create({
  addressFrom: addressFrom,
  addressTo: addressTo,
  parcels: [parcel],
  async: false
});
console.log( typeof(process.env.SENDER_PHONE));
console.log( process.env.SENDER_ADDRESS);
const rates = getFilteredRates(shipment.rates);
console.log(rates);
const shipping_options = rates.map(rate => {
  return {
    shipping_rate_data: {
      display_name: rate.servicelevel.name,
      type: "fixed_amount",
      fixed_amount: {
        amount: Number(rate.amount) * 100,
        currency: rate.currency,
      },
      delivery_estimate: {
        minimum: {
          unit: "business_day",
          value: rate.estimated_days,
        },
        maximum: {
          unit: "business_day",
          value: rate.estimated_days! + 2,
        }
      }
    }
  };
 
})
return shipping_options;
// return [
//     {
//       shipping_rate_data: {
//         display_name: "Standard Shipping",
//         type: "fixed_amount",
//         fixed_amount: {
//           amount: 500, // $5.00
//           currency: "usd",
//         },
//         delivery_estimate: {
//           minimum: {
//             unit: "business_day",
//             value: 3,
//           },
//           maximum: {
//             unit: "business_day",
//             value: 5,
//           },
//         },
//       },
//     }];
}
interface ShippingRateData {
  display_name: String;
  type: String;
  fixed_amount: {
    amount: Number;
    currency: String;
  };
  delivery_estimate: {
    minimum: {
      unit: String;
      value: Number;
    },
    maximum: {
      unit: String;
      value: Number;
    }
  };
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
    const shippingOptions:any = await calculateShippingOptions(shipping_details, session);

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
