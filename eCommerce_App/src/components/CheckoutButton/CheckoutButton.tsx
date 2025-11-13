import { useState, useEffect } from "react";
// import { useCart } from "../../CartContext";
import { Link } from 'react-router-dom';

export function CheckoutButton (){
    // const cartDataState = useCart();
    // const {cartItems} = cartDataState;
    const [errorMessage, setErrorMessage] = useState<string>("");
    
    useEffect(() => {
        if (!errorMessage) return;
    
        const timer = setTimeout(() => {
          setErrorMessage("");
        }, 5000);
    
        return () => clearTimeout(timer); // cleanup if component unmounts
      }, [errorMessage]);
    
    return (
        <>
            {errorMessage && (
               <h2 style={{color:"red"}}>{errorMessage}</h2> 
            )}
            {/* <button 
                style={{backgroundColor:"blue"}}
                onClick={async () => {
                    try {
                        const res = await fetch("http://localhost:5000/create-checkout-session", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            items: cartItems,     
                        }),
                        });
                
                        const session = await res.json();     // Stripe hosted checkout page URL
                        if (session.message) {
                            setErrorMessage(session.message);   // Invalid cart
                        } else {
                            window.location.href = session.url;   // Redirect to Stripe Checkout
                        }
                    } catch (error) {
                        console.error("Error creating checkout session:", error);
                    }
                    }}
                    >
                    Checkout
                </button> */}
            <button><Link to={"/Checkout"}>Checkout</Link></button>
            </>
    )
}