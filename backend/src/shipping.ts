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

// TODO: Fix the parcel packaging algorithm
function packItemsIntoOneParcel(products: SessionLineItems[]): ParcelCreateRequest | null {
  if (!products || products.length === 0) return null;

  function combineByDimension(a:{length:number, height:number, width:number}, b:{length:number, height:number, width:number}, dim:string) {
    const dims: Array<keyof typeof a> = ["length", "width", "height"];
  
    const result: { length: number; width: number; height: number } = { length: 0, width: 0, height: 0 };
    for (const d of dims) {
      if (d === dim) {
        result[d] = a[d] + b[d];       // stacked
      } else {
        result[d] = Math.max(a[d], b[d]); // aligned
      }
    }
  
    return result;
  }
  function combineSmallest(a: SessionLineItems, b: SessionLineItems): SessionLineItems {
      const dimensions = ["length", "width", "height"];
    
      const combinations = dimensions.map(dim =>
        combineByDimension(a, b, dim)
      );
    
      // choose the one with the smallest total size
      const bestCombination = combinations.reduce((best, current) => {
        const bestTotal =
          best.length + best.width + best.height;
        const currentTotal =
          current.length + current.width + current.height;
    
        return currentTotal < bestTotal ? current : best;
      });
  
      return {
        ...bestCombination,
        weight: a.weight + b.weight // Combine weights
      };
    }
  const finalBox = products.reduce(combineSmallest);
  console.log("FINAL BOX", finalBox);
  // TODO: Need to known box size tiers in case the next package size is bigger than the parcel size
  return {
    length: finalBox.length.toString(),
    width: finalBox.width.toString(),
    height: finalBox.height.toString(),
    distanceUnit: "in",
    weight: finalBox.weight.toString(),
    massUnit: "oz"
  };
}


type SessionLineItems = {
  weight:number;
  length:number;
  height:number;
  width:number;
  // quantity:number | null;
}
// Return an array of the updated shipping options or the original options if no update is needed.
async function calculateShippingOptions(addressTo:ShippoShippingDetails, session:Stripe.Checkout.Session):Promise<ShippingRateWrapper[] | false> {
  if (!session.line_items?.data) return false;

  const products:SessionLineItems[] = session.line_items?.data.map(item => {
    const product = item.price?.product as Stripe.Product;
    console.log("Shipping Session Details: ", product.metadata);
    return {
      weight: Number(product.metadata.weight) * (item.quantity ?? 0),   // TODO: Stack on smallest dimension
      length: Number(product.metadata.length),
      height: Number(product.metadata.height),
      width: Number(product.metadata.width)   * (item.quantity ?? 0),
    };
  });
  console.log("Products for shipping: ", products);

  // const parcel:ParcelCreateRequest = {
  //   length: "10",
  //   width: "5",
  //   height: "2",
  //   distanceUnit: "in",
  //   weight: "1",
  //   massUnit: "oz"
  // };
  const parcel = packItemsIntoOneParcel(products);
  if (!parcel) return false;

  const shipment = await shippo.shipments.create({
    addressFrom: addressFrom,
    addressTo: addressTo,
    parcels: [parcel],
    async: false
  });
  // console.log( typeof(process.env.SENDER_PHONE));
  // console.log( process.env.SENDER_ADDRESS);

  const rates = getFilteredRates(shipment.rates);
  // console.log(rates);
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
    const session = await stripe.checkout.sessions.retrieve(checkout_session_id, {expand: ['line_items', 'line_items.data.price.product']});
    // console.log("Shipping session retrieved: ", session.line_items?.data);
    if (!session) return res.json({type:'error', message: "Checkout session not found."});

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

// const dims = ["length", "width", "height"];
// const products = [
//   // {length: 11,height: 8,width: 2},
//   {length: 11,height: 9,width: 3},
//   // {length: 13,height: 2,width: 4},
// ]

// const totalPackageDimensions = {
//   // totalWeight: products[0].totalWeight,
//   height: 8 || products[0].height,
//   length: 4 || products[0].length,
//   width: 6 || products[0].width,
// }



// products.forEach((product) => {
//   const smallestDimensionKeyValue = Object.entries(product).reduce(
//   (min, current) => current[1] < min[1] ? current : min
// );
//   // console.log(smallestDimensionKeyValue);
//   // delete product[smallestDimensionKeyValue[0]];

//   const smallestDimensionKeyValueFromTotal = Object.entries(totalPackageDimensions).reduce(
//   (min, current) => current[1] < min[1] ? current : min
// );
//   // console.log(smallestDimensionKeyValueFromTotal);
//   const keyFromTotalProductMin = smallestDimensionKeyValueFromTotal[0];
//   const keyFromCurProductMin = smallestDimensionKeyValue[0];
//   const valueFromCurProductMin = smallestDimensionKeyValue[1];
//   const valueFromTotalProductMin = smallestDimensionKeyValueFromTotal[1];

//   totalPackageDimensions[keyFromTotalProductMin] = valueFromTotalProductMin + valueFromCurProductMin;

  
//   product[keyFromCurProductMin] = product[keyFromTotalProductMin];
//   // console.log("AFTER", product);

//   delete product[keyFromTotalProductMin];

//   console.log("AFTER", product);
//   console.log("AFTER", totalPackageDimensions);



//   // FIND LAST TWO <DIMENSIONS>
//   const largestDimensionProductRemaining = Object.entries(product).reduce(
//   (max, current) => current[1] > max[1] ? current : max
//   );

//   // const tmpObj = totalPackageDimensions;
//   // delete tmpObj[keyFromTotalProductMin];
//   const deletedKey = keyFromTotalProductMin
//   // const filteredArray = Object.entries(totalPackageDimensions).filter((val)=> val !== )
//   const largestDimensionTotalRemaining = Object.entries(totalPackageDimensions).reduce(
//   (max, current) => current[1] > max[1] ? current : max
//   );

//   const largestProductRemainingKey = largestDimensionProductRemaining[0];
//   const largestProductRemainingValue = largestDimensionProductRemaining[1];
//   const largestTotalRemainingKey = largestDimensionTotalRemaining[0];
//   const largestTotalRemainingValue = largestDimensionTotalRemaining[1];


//   // Find the smallest difference (optimal packaging)
//   let smallestDifference = 100;
//   let tmpObjKeyFound = ""
//   let valueOfDimension = 0;

//   if (largestProductRemainingValue > largestTotalRemainingValue) {  // product will determine the size
//     for (const key of Object.keys(tmpObj)) {
//       if (largestProductRemainingValue - tmpObj[key] < smallestDifference) {
//         tmpObjKeyFound = key;
//         valueOfDimension = largestProductRemainingValue;
//         smallestDifference = largestProductRemainingValue - tmpObj[key];
//       }


//     }
//     // console.log(tmpObjKeyFound)
//     // console.log(totalPackageDimensions);
//     totalPackageDimensions[tmpObjKeyFound] = valueOfDimension;
//     // console.log(totalPackageDimensions);
//   } else {  // Total will determine the size
//     for (const key of Object.keys(totalPackageDimensions)) {
//       if (key in Object.keys(product)) {
//         const productKey = key;
//         console.log("here")
//         if (totalPackageDimensions[key] - smallestDimensionProductRemaining[1]  < smallestDifference) {
//           newObj = {"hello": totalPackageDimensions[key]}
//         }
//       }
//       else {
//         console.log("hi")
//       }
//     }
//   }
//   // console.log(product);
//   // console.log(tmpObj);
//   // console.log(newObj);
//   // const newObjKey = newObj;
//   // const newObjValue = Object.values(newObj);
//   // tmpObj[newObjKey] = newObjValue;
//   // if (smallestDimensionProductRemaining[1] > totalPackageDimensions[maxObjKey]) {
//   //   const dif1 = smallestDimensionProductRemaining[1] -
//   //   const dif2 =
//   // }

//   const maxRemainingDimensions = smallestDimensionProductRemaining[1] > largestDimensionTotalRemaining[1] ? smallestDimensionProductRemaining : largestDimensionTotalRemaining;
// })