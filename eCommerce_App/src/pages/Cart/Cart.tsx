import type { LayoutProps } from "../Layout";
import { useOutletContext, useLocation } from "react-router-dom";
import { useCart } from "../../CartContext";
import { CheckoutButton } from "../../components/CheckoutButton/CheckoutButton";
import { CartProductCard } from "../../components/CartProductCard/CartProductCard";
import { useState, useEffect } from "react";
import { deleteReservedCartOnDB } from "../../helper/helpers";
import styles from './Cart.module.css'

export function Cart(){
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    const [message, setMessage] = useState("");
    // const [error, setError] = useState("");
    const [checkoutError, setCheckoutError] = useState("");
    const [loading, setLoading] = useState(true);
    const [disableButton, setDisableButton] = useState(false);
    const location = useLocation();
    const cart = useCart();
    const {cartItems} = cart;

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("success") === "true") {
        alert("Checkout succeeded!");
        cart.clearCart();
        }
    }, [location.search]);

    useEffect(()=>{
      if (!cart) return;
      setDisableButton(cart.itemsEqualToZeroQuantity());
    },[cart])

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
          setCheckoutError(location.state.error);
  
          // Auto-clear after 5s
          const timer = setTimeout(() => setCheckoutError(""), 10000);
          return () => clearTimeout(timer);
        }
      }, [location.state]);

      useEffect(() => {
        setLoading(false);
        deleteReservedCartOnDB();
      }, [location.pathname]); 

    const Message = ({ message }:{ message: string }) => (
    <section>
        <p>{message}</p>
    </section>
    );


    if (loading) return (
      <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
        <h1>Cart</h1>
        <p >Loading...</p>
      </div>
    )
    
    if (cartItems.length <= 0) 
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                <h1>Cart</h1>
                <h2 >0 Items in Cart</h2>
            </div>
        )

    return message ? (
        <Message message={message} />
    ) : (
            <>
                <h2 className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                  Cart ({cart.totalItemsInCart} {cart.totalItemsInCart === 1  ? 'item' : 'items'})
                </h2>
                <div  className={`body column ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
                    {checkoutError && <div style={{color:"red"}}>{checkoutError}</div>}

                    <div className={`${styles.cartContainer}`}>
                      <p style={{textAlign:"center"}}>
                        ITEMS IN CART
                      </p>
                      {true && (<div style={{flex:"1 1 0"}}>
                          {cartItems.map((item, index) => (
                              <CartProductCard
                              key={index}
                              cartItemInfo={item}
                              />
                          ))}
                      </div>)}
                    </div>
                    <CheckoutButton disableButton={disableButton}/>
                </div>
            </>
        );
}