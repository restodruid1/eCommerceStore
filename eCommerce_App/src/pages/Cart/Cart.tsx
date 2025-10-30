import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useCart } from "../../CartContext";


export function Cart(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const cartDataState = useCart();
    const {cartItems} = cartDataState;
    return (
                <>
                    <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Cart</h1>
                    <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                        <>ITEMS IN CART</>
                        <ul>
                            {cartItems!.map(item => (
                                <li key={item.id}>
                                <strong>{item.name}</strong> — ${item.price} × {item.quantity}
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            );
}