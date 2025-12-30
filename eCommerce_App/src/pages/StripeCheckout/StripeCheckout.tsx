import {loadStripe} from '@stripe/stripe-js';
import { useCart } from '../../CartContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useNavigate } from "react-router-dom";
import './stripCheckout.css'

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
  // const [checkoutErrorMessage, setCheckoutErrorMessage] = useState("");
  const [ clientSecret, setClientSecret ] = useState<string>("");
  const [sesh, setSesh] = useState("");
  const navigate = useNavigate();

  
  useEffect(() => {
    const fetchClientSecret = async () => {
      const userId = localStorage.getItem("uuid");
  
      // Create a Checkout Session
      const response = await fetch("http://localhost:5000/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems,
          uuid: userId,     
      }),
      });
      const checkoutSession:{checkoutResult: { clientSecret: string, sessionId: string}, uuid?:string , error?:string} = await response.json();

      if (checkoutSession.error) {
        if (checkoutSession.uuid) {
          localStorage.setItem("uuid", checkoutSession.uuid);
        }
        navigate("/Cart", {
                state: { error: checkoutSession.error },
                replace: true, // optional; prevents user going "forward" back into broken checkout
              });
      } else {
          const { clientSecret } = checkoutSession.checkoutResult;
          localStorage.setItem("uuid", checkoutSession.uuid!);
          localStorage.setItem("sessionId", checkoutSession.checkoutResult.sessionId);
          setSesh(checkoutSession.checkoutResult.sessionId);
          // setIsLoadingCheckout(false);
          setClientSecret(clientSecret);
      }
    }
    fetchClientSecret();
  }, []);
  

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

      if (!response.ok) throw new Error;

      const result:{type:string, message?:string, value?:{}} = await response.json();
      
      // TODO: DYNAMIC SHIPPING CALCULATIONS

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
        errorMessage: "An error occured. Please try again or contact support."
      };
    }
  };

  

  // Prevent client from making purchase after 30 minute cart expiration
  useEffect(() => {
    if (!sesh) return;  
  
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
          navigate("/CheckoutReturn", {
            replace: true, //prevents user going "forward" back into broken checkout
          });
          // setCheckoutErrorMessage("Your checkout session has expired.");
        }
      } catch (error) {
        console.error('Error checking session status:', error);
      }
    }, 61000 * 5);  // little over 5 minutes per check so last check will happen at x > 30 minutes when cart expires
  
    return () => clearInterval(intervalId);
  }, [sesh]); 

  // className={`body column ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}

  // if (checkoutErrorMessage) return (
  //   <div style={{textAlign:"center"}}>
  //     <Link replace={true} to={"/cart"}><h1>Anne Elizabeth Boutique</h1></Link>
  //     <h1 >{checkoutErrorMessage}</h1>
  //   </div>
  // )

  const options: any = {
    // fetchClientSecret,
    clientSecret,
    onShippingDetailsChange,
  };

  if (!clientSecret) return <p style={{textAlign:"center"}}>Loading...</p>

  return (
    <div style={{textAlign:"center"}}>
      <Link replace={true} to={"/Cart"}><h1>Anne Elizabeth</h1></Link>
      <Link replace={true} to={"/Cart"}>
        <button style={{margin:"20px", color:"white"}}>Back</button>
      </Link>
      <div className='checkout-container'>
        <EmbeddedCheckoutProvider 
          stripe={stripePromise}
          options={options}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
};