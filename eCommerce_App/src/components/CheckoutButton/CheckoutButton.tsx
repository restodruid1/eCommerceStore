import { useCart } from "../../CartContext";

export function CheckoutButton (){
    const cartDataState = useCart();
    const {cartItems} = cartDataState;
    
    return (
        <button 
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
                    console.log(session);
                    
                    window.location.href = session.url;   // Redirect to Stripe Checkout
                } catch (error) {
                    console.error("Error creating checkout session:", error);
                }
                }}
                >
                Checkout
            </button>
    )
}