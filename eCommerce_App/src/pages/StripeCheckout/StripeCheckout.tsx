import {loadStripe} from '@stripe/stripe-js';
import { useCart } from '../../CartContext';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_51SPrSR5UVkCvvwZTK49SKzVqU0o1Kbc9q1jQ7XWQNWm8cKkRLk0JOEzxSQj1fYiJSuVehCrokM7tHCKR14xMZH4900eFAVK3uZ');


import React, { useCallback } from 'react';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';



interface ShippingDetailsChangeEvent {
  checkoutSessionId: string;  // ID of the Checkout Session
  shippingDetails: {
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
  };
}



function StripeCheckout() {
  const cartDataState = useCart();
  const {cartItems} = cartDataState;

  const fetchClientSecret = useCallback(() => {
    // Create a Checkout Session
    return fetch("http://localhost:5000/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cartItems,     
    }),
    })
      .then((res) => res.json())
      .then((data:{clientSecret?:string, error?:string}) => {
        if (data.error) {
          alert("SESSION ERROR");
          return undefined;
        }
        else {
          return data.clientSecret;
        }
      });
  }, []);


  const onShippingDetailsChange = async (shippingDetailsChangeEvent:ShippingDetailsChangeEvent) => {
    const {checkoutSessionId, shippingDetails} = shippingDetailsChangeEvent;
    
    const response:any = await fetch("http://localhost:5000/calculate-shipping-options", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        checkout_session_id: checkoutSessionId,
        shipping_details: shippingDetails,
      })
    })
    // alert(response);
    if (response.type === 'error') {
      return Promise.resolve({ type: "reject", errorMessage: response.message });
    } else {
      return Promise.resolve({ type: "accept" });
    }
  };

  const options: any = {
    fetchClientSecret,
    onShippingDetailsChange
  };


  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={options}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default StripeCheckout;

