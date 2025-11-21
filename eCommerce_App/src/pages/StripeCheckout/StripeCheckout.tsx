import {loadStripe} from '@stripe/stripe-js';
import { useCart } from '../../CartContext';
import { useCallback, useState, useEffect } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useOutletContext } from "react-router-dom";
import type { LayoutProps } from "../Layout";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_51SPrSR5UVkCvvwZTK49SKzVqU0o1Kbc9q1jQ7XWQNWm8cKkRLk0JOEzxSQj1fYiJSuVehCrokM7tHCKR14xMZH4900eFAVK3uZ');

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


export function StripeCheckout() {
  const cartDataState = useCart();
  const {cartItems} = cartDataState;
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState("");
  // const [uuid, setUuid] = useState("");
  const [sesh, setSesh] = useState("");
  const { isClicked, isDesktop } = useOutletContext<LayoutProps>();

  const fetchClientSecret = useCallback(() => {
    const userId = localStorage.getItem("uuid");
    // Create a Checkout Session
    return fetch("http://localhost:5000/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cartItems,
        uuid: userId,     
    }),
    })
      .then((res) => res.json())
      .then((data:{checkoutResult: { clientSecret: string, sessionId: string}, uuid?:string , error?:string}) => {
        if (data.error) {
          alert(data.error);
          setErrorMessage(data.error);
          return data.error;
        }
        else {
          const { clientSecret } = data.checkoutResult;
          // alert("here" + data.checkoutResult.sessionId);
          localStorage.setItem("uuid", data.uuid!);
          localStorage.setItem("sessionId", data.checkoutResult.sessionId);
          setSesh(data.checkoutResult.sessionId);
          // setErrorMessage("");
          return clientSecret;
        }
      });
  }, [cartItems]);


  const onShippingDetailsChange = async (shippingDetailsChangeEvent:ShippingDetailsChangeEvent) => {
    const {checkoutSessionId, shippingDetails} = shippingDetailsChangeEvent;
    
    try {
      const response = await fetch("http://localhost:5000/calculate-shipping-options", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          checkout_session_id: checkoutSessionId,
          shipping_details: shippingDetails,
        })
      })
      const result:{type:string, message?:string, value?:{}} = await response.json();
      
      if (result.type === 'error') {
        return {
          type: "reject",
          errorMessage: result.message ?? "We couldn't calculate shipping for this address. Please try again or contact support."
        };
      } else {
        return { type: "accept" };
      }
    }catch (error) {
      // Error handling with custom message
      return {
        type: "reject",
        errorMessage: "We couldn't calculate shipping for this address. Please try again or contact support."
      };
    }
  };

  const options: any = {
    fetchClientSecret,
    onShippingDetailsChange
  };

  // Prevent client from making purchase after 30 minute cart expiration
  useEffect(() => {
    if (!sesh) return;  // don’t run until sesh is ready
  
    const intervalId = setInterval(async () => {
      try {
        // const param = localStorage.getItem("sessionId");
        const response = await fetch(`http://localhost:5000/session_status/check`,{
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            seshId: sesh,
            uuid: localStorage.getItem("uuid")    
          })
        });
       
        const { status } = await response.json();
  
        if (status === 'expired') {
          clearInterval(intervalId);
          setCheckoutErrorMessage("Your checkout session has expired.");
        }
      } catch (error) {
        console.error('Error checking session status:', error);
      }
    }, 61000 * 5);  // little over 5 minutes per check so last check will happen at x > 30 minutes when cart expires
  
    return () => clearInterval(intervalId);
  }, [sesh]);  // runs only when sesh changes from null → value


  if (errorMessage) return <h1 className={`body column ${isClicked && isDesktop ? 'open' : ''}`}>{errorMessage}</h1>
  if (checkoutErrorMessage) return <h1 className={`body column ${isClicked && isDesktop ? 'open' : ''}`}>{checkoutErrorMessage}</h1>
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