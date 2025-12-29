import { useState, useEffect } from "react";
// import { useCart } from "../../CartContext";
import { Link } from 'react-router-dom';

export function CheckoutButton ({disableButton}:{disableButton:boolean}){
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
            
            <Link to={"/Checkout"}><button style={{color:"white"}} disabled={disableButton}>Checkout</button></Link>
        </>
    )
}