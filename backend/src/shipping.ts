import { Router } from 'express';
import { Request, Response } from "express";
import { stripe } from './server.js';
import Stripe from 'stripe';
import { DistanceUnitEnum, Provider, Shippo, WeightUnitEnum } from "shippo";
import type { Rate } from 'shippo';
const router = Router();

const shippo = new Shippo({apiKeyHeader: `${process.env.SHIPPO_TEST_API}`});

const PACKAGE_SIZE_CLASSES = [
  {
    id: "REGULAR_BUBBLE_MAILER",
    max: { l: 10, w: 6, h: 4 },
    package: { l: 10, w: 6, h: 4 }
  },
  {
    id: "LARGE_BUBBLE_MAILER",
    max: { l: 15, w: 10, h: 4},
    package: { l: 16, w: 10.5, h: 5 }
  },
  {
    id: "MEDIUM_BOX",
    max: { l: 13, w: 11, h: 3 },
    package: { l: 14, w: 12, h: 4 }
  },
  {
    id: "MEDIUM_BOX_ALT",
    max: { l: 11, w: 8, h: 5 },
    package: { l: 11, w: 9, h: 6}
  },
  {
    id: "LARGE_BOX",
    max: { l: 12, w: 12, h: 6 },
    package: { l: 13, w: 12, h: 6 }
  },
  {
    id: "EXTRA_LARGE_BOX",
    max: { l: 18, w: 18, h: 14 },
    package: { l: 20, w: 20, h: 15 }
  }
];

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

type SessionLineItems = {
  weight?:number;
  length:number;
  height:number;
  width:number;
  // quantity:number | null;
}

type ValidationResponse = {
  success: boolean;
  error?: string;
}

type StripeLineItem = {
  productId: number;
  productName: string;
  quantity: number;
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


async function validateShippingDetails(shippingDetails:ShippoShippingDetails): Promise<ValidationResponse> {
  const addressData = await shippo.addresses.create({...shippingDetails, validate:true});   // Shippo validates address & provides message
  const results = addressData.validationResults;
  const firstMessage = results?.messages?.[0];
 
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

function createPackage(session:Stripe.Checkout.Session): ParcelCreateRequest | false {
  if (!session.line_items?.data) return false;

  const normalizedProducts:SessionLineItems[] = session.line_items?.data.map(item => {
    const product = item.price?.product as Stripe.Product;
    const length = Number(product.metadata.length);
    const width = Number(product.metadata.width);
    const height = Number(product.metadata.height);
    const { l:newLength, w:newWidth, h:newHeight } = normalizeProductDimensions({length, width, height});
    
    return {
      weight: Number(product.metadata.weight) * (item.quantity ?? 0), 
      length: newLength ?? 0,
      width:  newWidth ?? 0,
      height: (newHeight ?? 0) * (item.quantity ?? 0),
    };
  });

  if (!normalizedProducts) return false;

  const packageReadyForShip = packItemsIntoOneParcel(normalizedProducts);
  if (!packageReadyForShip) return false;

  return packageReadyForShip;
}

function packItemsIntoOneParcel(products: SessionLineItems[]): ParcelCreateRequest | null {
  if (!products || products.length === 0) return null;

  const optimzedPackage = optimalPackingAlgo(products);
  if (!optimzedPackage) return null;
  console.log("OPTIMIZED BOX", optimzedPackage);

  const finalBox = selectFinalPackageSize({length: optimzedPackage.packageLength, width: optimzedPackage.packageWidth, height: optimzedPackage.packageHeight, weight: optimzedPackage.packageWeight});
  console.log("FINAL BOX", finalBox);
  
  return {
    length: finalBox.l.toString(),
    width: finalBox.w.toString(),
    height: finalBox.h.toString(),
    distanceUnit: DistanceUnitEnum.In ?? "in",
    weight: (optimzedPackage.packageWeight * 1.1).toString(), // 10% for packaging material
    massUnit: WeightUnitEnum.Oz ?? "oz"
  };
}

// Combine on smallest dimension, then fit other 2 dimensions based on smallest difference
function optimalPackingAlgo( products:SessionLineItems[]){
  if (!products || products[0] === undefined) return null;
  let { l, w, h } = normalizeProductDimensions(products[0]);

  if (!products[0]?.weight) return null;
  let weight = products[0]?.weight;
  if (weight >= 60) return null;

  for (let i = 1; i < products.length; i++) {
    const product = products[i];

    if (!product || product === undefined) return null;

    const normalizeDimensions = normalizeProductDimensions(product);
    h = h + normalizeDimensions.h;

    if (normalizeDimensions.l > l) {
      l = normalizeDimensions.l;
      w = Math.max(normalizeDimensions.w, w);
    } else {
      w = Math.max(normalizeDimensions.w, w);
    }
    const normalizeTotalPackage = normalizeProductDimensions({length:l, width:w, height:h});
    l = normalizeTotalPackage.l;
    w = normalizeTotalPackage.w;
    h = normalizeTotalPackage.h;
    weight = weight + (product.weight ?? 0);
  }
 return {packageLength:l, packageWidth:w , packageHeight:h, packageWeight:weight};
}

// { height: 4, width: 12, length: 6} -> { length:12, width: 6, height: 4}
function normalizeProductDimensions({ length, width, height }:SessionLineItems) {
  if (
    (length == null || length === 0) ||
    (width == null || width === 0) ||
    (height == null || height === 0)
  ) {
    throw new Error("Product dimensions are required");
  }
  const dims = [length, width, height] as [number, number, number];
  const [L, W, H] = dims.sort((a, b) => b - a);

  return { l: L, w: W, h: H };
}

function fits(item:SessionLineItems, packageClass:any) {
  return (
    item.length <= packageClass.max.l &&
    item.width <= packageClass.max.w &&
    item.height <= packageClass.max.h
  );
}

function selectFinalPackageSize(packageDimensions:SessionLineItems) {
  const { length, width, height } = packageDimensions;
  const norm = normalizeProductDimensions({length, width, height});
  const finalPackageDimensions = PACKAGE_SIZE_CLASSES.find(packageClass => fits({length:norm.l, width:norm.w, height:norm.h}, packageClass))
    ?? (() => { throw new Error("Oversize item"); })();

  return finalPackageDimensions.package;
}


// Return an array of the updated shipping options or the original options if no update is needed.
async function calculateShippingOptions(addressTo:ShippoShippingDetails, packageToBeShipped:ParcelCreateRequest):Promise<ShippingRateWrapper[] | false> {
  const shipment = await shippo.shipments.create({
    addressFrom: addressFrom,
    addressTo: addressTo,
    parcels: [packageToBeShipped],
    async: false
  });

  const rates = getFilteredRates(shipment.rates);
  
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
  try {
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
      const session = await stripe.checkout.sessions.retrieve(checkout_session_id, {expand: ['line_items', 'line_items.data.price.product']});
      if (!session) return res.json({type:'error', message: "Checkout session not found."});

      // 2. Validate the shipping details
      const validateAddress = await validateShippingDetails(addressTo)!;
      if (!validateAddress.success) {
          return res.json({type:'error', message: validateAddress.error || "NOT SURE"});
      }

      const packageToBeShipped = createPackage(session);
      if (!packageToBeShipped) return res.json({type:'error', message: "Could not find packaging options. Please try again."});

      // 3. Calculate the shipping options
      const shippingOptions: ShippingRateWrapper[] | false = await calculateShippingOptions(addressTo, packageToBeShipped);

      // 4. Update the Checkout Session with the customer's shipping details and shipping options
      if (shippingOptions) {
        await stripe.checkout.sessions.update(checkout_session_id, {
        collected_information: {shipping_details},
        shipping_options: shippingOptions,
        metadata: {
          "packageLength":  packageToBeShipped.length,
          "packageWidth":   packageToBeShipped.width,
          "packageHeight":  packageToBeShipped.height,
          "packageWeight":  packageToBeShipped.weight
        }
        });

          return res.json({type:'object', value: {succeeded: true}});
      } else {
          return res.json({type:'error', message: "We can't find shipping options. Please try again."});
      }
    } catch (err) {
      return res.json({type:'error', message: "We can't find shipping options. Please try again."});
    }
});

export default router;