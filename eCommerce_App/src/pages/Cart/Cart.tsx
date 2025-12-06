import type { LayoutProps } from "../Layout";
import { useOutletContext, useLocation } from "react-router-dom";
import { useCart } from "../../CartContext";
import { CheckoutButton } from "../../components/CheckoutButton/CheckoutButton";
import { CartProductCard } from "../../components/CartProductCard/CartProductCard";
import { useState, useEffect } from "react";

export function Cart(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const cartDataState = useCart();
    const {cartItems} = cartDataState;
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("success") === "true") {
        alert("Checkout succeeded!");
        cartDataState.clearCart!();
        }
    }, [location.search]);



    useEffect(() => {
        // Check to see if this is a redirect back from Checkout
        const query = new URLSearchParams(window.location.search);
    
        if (query.get("success")) {
          setMessage("Order placed! You will receive an email confirmation.");
        }
    
        if (query.get("canceled")) {
          setMessage(
            "Order canceled -- continue to shop around and checkout when you're ready."
          );
        }
      }, []);

      useEffect(() => {
        if (location.state?.error) {
          setError(location.state.error);
  
          // Auto-clear after 5s
          const timer = setTimeout(() => setError(""), 5000);
          return () => clearTimeout(timer);
        }
      }, [location.state]);

      useEffect(() => {
        const deleteReservedCart = async () => {
          const userId = localStorage.getItem("uuid");
          const response = await fetch("http://localhost:5000/session_status/deleteCartReservation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uuid: userId,     
            }),
          });
          const data = await response.json();
          console.log("RESERVE STOCK DELETED? " + data.success);
          setLoading(false);
        }
        deleteReservedCart();
      }, []);

    const Message = ({ message }:{ message: string }) => (
    <section>
        <p>{message}</p>
    </section>
    );



    if (cartItems?.length! <= 0) 
        return (
            <div className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>
                <h1>Cart</h1>
                <h2 >0 Items in Cart</h2>
            </div>
        )

    if (loading) return <p className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Loading...</p>

    return message ? (
        <Message message={message} />
    ) : (
            <>
                <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Cart ({cartDataState!.cartTotalItems!()} {cartDataState!.cartTotalItems!() === 1  ? 'item' : 'items'})</h1>
                <div  className={`body column ${isClicked && isDesktop ? 'open' : ''}`}>
                    {error && <div style={{color:"red"}}>{error}</div>}
                    <div style={{display:"flex", flexDirection:"column",background:"darkgrey", borderRadius:"5px", borderColor:"black", minWidth:"300px"}}>
                    <p style={{textAlign:"center"}}>ITEMS IN CART</p>
                    {true && (<div style={{flex:"1 1 0"}}>
                        {cartItems!.map((item, index) => (
                            <CartProductCard
                            key={index}
                            itemInfo={item}
                            />
                        ))}
                    </div>)}
                    </div>
                    <CheckoutButton />
                </div>
            </>
        );
}