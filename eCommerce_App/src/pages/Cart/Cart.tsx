import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useCart } from "../../CartContext";
import { FaTrashAlt } from 'react-icons/fa';
import type { IconType } from 'react-icons';

export function Cart(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const TrashIcon: IconType = FaTrashAlt;
    const cartDataState = useCart();
    const {cartItems} = cartDataState;

    function handleDelete(itemId:number){
        cartDataState!.deleteItem!(itemId);
    }


    return (
                <>
                    <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Cart</h1>
                    <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                        <>ITEMS IN CART</>
                        <ul>
                            {cartItems!.map(item => (
                                <li key={item.id}>
                                <strong>{item.name}</strong> — ${item.price} × <button onClick={()=>cartDataState!.decrementQuantity!(item.id,item.quantity)}>-</button>{item.quantity}<button onClick={()=>cartDataState!.incrementQuantity!(item.id,item.quantity)}>+</button><button onClick={()=>handleDelete(item.id)} ><TrashIcon/></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            );
}