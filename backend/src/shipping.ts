import { Router } from 'express';
import { Request, Response } from "express";
import { stripe } from './server.js';
import Stripe from 'stripe';
import { Shippo } from "shippo";
import type { Rate } from 'shippo';
const router = Router();

const shippo = new Shippo({apiKeyHeader: `${process.env.SHIPPO_TEST_API}`});

interface ParcelCreateRequest {
  length: string;
  width: string;
  height: string;
  distanceUnit: "in" | "cm";
  weight: string;
  massUnit: "oz" | "lb" | "g" | "kg";
}

interface ShippingRateWrapper {
  shipping_rate_data: ShippingRateData;
}
interface ShippingRateData {
  display_name: string;
  type: "fixed_amount";
  fixed_amount: {
    amount: number;
    currency: string;
  };
  delivery_estimate: {
    minimum: {
      unit: "business_day";
      value: number;
    },
    maximum: {
      unit: "business_day";
      value: number;
    }
  };
}

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

interface ShippingDetailsChangeEvent {
  checkout_session_id: string;  // ID of the Checkout Session
  shipping_details: StripeShippingDetails;
}
interface StripeShippingDetails {
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

interface ShippoShippingDetails {
  name: string;
  street1: string;      
  street2?: string;     
  city: string;       
  state: string;      
  zip: string;
  country: string;
  phone?: string;    
}


export interface SimplifiedShippoRate {
  provider: string;
  servicelevel: {
    name: string;
  };
  amount: string;
  currency: string;
  estimatedDays: number;
}

const addressFrom: AddressCreateRequest = {
    name: process.env.SENDER_NAME!,
    company: process.env.SENDER_COMPANY!,
    street1: process.env.SENDER_ADDRESS!,
    city: process.env.SENDER_CITY!,
    state: process.env.SENDER_STATE!,
    zip: process.env.SENDER_ZIP!,
    country: process.env.SENDER_COUNTRY!, // iso2 country code e.g., "US"
    phone: process.env.SENDER_PHONE!,
    email: process.env.SENDER_EMAIL!,
};

const allowedCarriers = ["USPS", "UPS", "FedEx", "DHL Express"];
function getFilteredRates(rates:Rate[]): SimplifiedShippoRate[] {
  return rates
  .filter(rate => allowedCarriers.includes(rate.provider))
  .filter(rate => parseFloat(rate.amount) < 100)
  .map(rate => ({
    provider: rate.provider,
    servicelevel: { name: rate.servicelevel.name ?? "Name Not Found" },
    amount: rate.amount,
    currency: rate.currency,
    estimatedDays: rate.estimatedDays ?? 5
  }))
  .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount)) 
  .slice(0, 5); 
}

type ValidationResponse = {
  success: boolean;
  error?: string;
}
async function validateShippingDetails(shippingDetails:ShippoShippingDetails): Promise<ValidationResponse> {
  const addressData = await shippo.addresses.create({...shippingDetails, validate:true});   // Shippo validates address & provides message
  const results = addressData.validationResults;
  const firstMessage = results?.messages?.[0];
  console.log(results?.messages);
  // Address is invalid
  if (!results?.isValid) {
    return { success: false, error: firstMessage?.text! };
  }

  // Address valid but contains warnings (like missing apt number)
  if (firstMessage?.type === "address_warning") {
    return { success: false, error: firstMessage.text! };
  }

  // Fully valid
  return { success: true };
}

function packParcelItems() {
  
}


// Return an array of the updated shipping options or the original options if no update is needed.
async function calculateShippingOptions(addressTo:ShippoShippingDetails, session:Stripe.Checkout.Session):Promise<ShippingRateWrapper[] | false> {
  const parcel:ParcelCreateRequest = {
    length: "10",
    width: "5",
    height: "2",
    distanceUnit: "in",
    weight: "20",
    massUnit: "lb"
  };
  const parcel2 = packParcelItems();
  const shipment = await shippo.shipments.create({
    addressFrom: addressFrom,
    addressTo: addressTo,
    parcels: [parcel],
    async: false
  });
  // console.log( typeof(process.env.SENDER_PHONE));
  // console.log( process.env.SENDER_ADDRESS);

  const rates = getFilteredRates(shipment.rates);
  console.log(rates);
  const shipping_options:ShippingRateWrapper[] = rates.map(rate => ({
      shipping_rate_data: {
        display_name: `${rate.provider} - ${rate.servicelevel.name}`,
        type: "fixed_amount",
        fixed_amount: {
          amount: Math.round(Number(rate.amount) * 100),
          currency: rate.currency,
        },
        delivery_estimate: {
          minimum: {
            unit: "business_day",
            value: rate.estimatedDays,
          },
          maximum: {
            unit: "business_day",
            value: rate.estimatedDays! + 2,
          }
        }    
    }
  }));

  if (shipping_options.length > 0) {
    return shipping_options;
  } else {
    return false;
  }

}


router.post('/', async (req:Request, res:Response) => {
    const {checkout_session_id, shipping_details} = req.body as ShippingDetailsChangeEvent;
    const { name, address, phone } = shipping_details;
    // Translate Stripe address form data to Shippo address data
    const addressTo = {
      name: name,
      street1: address.line1,
      ...(address.line2 ? { street2: address.line2 } : {}),
      city: address.city,
      state: address.state,
      zip: address.postal_code,
      country: address.country,
      ...(phone ? { phone: phone } : {})
    };
    // 1. Retrieve the Checkout Session
    const session = await stripe.checkout.sessions.retrieve(checkout_session_id);

    // 2. Validate the shipping details
    const validateAddress = await validateShippingDetails(addressTo)!;
    if (!validateAddress.success) {
        return res.json({type:'error', message: validateAddress.error || "NOT SURE"});
    }

    // 3. Calculate the shipping options
    const shippingOptions: ShippingRateWrapper[] | false = await calculateShippingOptions(addressTo, session);

    // 4. Update the Checkout Session with the customer's shipping details and shipping options
    if (shippingOptions) {
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
