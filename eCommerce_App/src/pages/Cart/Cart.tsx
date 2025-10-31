import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useCart } from "../../CartContext";
import { FaTrashAlt } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import type { DataInterface } from "../CustNailProd/CustNailProd";

export function Cart(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const TrashIcon: IconType = FaTrashAlt;
    const cartDataState = useCart();
    const {cartItems} = cartDataState;

    function handleDelete(itemId:number){
        cartDataState!.deleteItem!(itemId);
    }

    async function handleClickIncrement(itemId:number, cartQuantity:number) {
        try {
                const response = await fetch(`http://localhost:5000/products/${itemId}`);
                const data: DataInterface[] = await response.json();
                const stockQuantity = data[0].quantity;
                if (stockQuantity < cartQuantity + 1) {
                    alert("Max Quantity Reached");
                } else {
                      cartDataState!.incrementQuantity!(itemId);
                }  
                
            } catch (err) {
                console.log("ERROR: " + err);
            }
    }
    async function handleClickDecrement(itemId:number, cartQuantity:number) {
        try {
                if (cartQuantity - 1 <= 0) {
                    cartDataState!.deleteItem!(itemId);
                } else {
                    alert("Decrementing Item");
                    cartDataState!.decrementQuantity!(itemId);
                }  
                
            } catch (err) {
                console.log("ERROR: " + err);
            }
    }

    if (cartItems?.length! <= 0) 
        return (
            <div className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>
                <h1>Cart</h1>
                <h2 >0 Items in Cart</h2>
            </div>
        )

    return (
                <>
                    <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Cart</h1>
                    <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                        <>ITEMS IN CART</>
                        {true && (<ul>
                            {cartItems!.map(item => (
                                <li key={item.id}>
                                <strong>{item.name}</strong> — ${item.price} × <button onClick={()=>handleClickDecrement(item.id,item.quantity)}>-</button>{item.quantity}<button onClick={()=>handleClickIncrement(item.id,item.quantity)}>+</button><button onClick={()=>handleDelete(item.id)} ><TrashIcon/></button>
                                </li>
                            ))}
                        </ul>)}
                    </div>
                </>
            );
}