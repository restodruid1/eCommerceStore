import { useState } from 'react';
import { BsCart3 } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import styles from './CartDropDown.module.css';
import { Link } from 'react-router-dom';
import { useCart } from '../../CartContext';
import { FaTrashAlt } from 'react-icons/fa';

export function CartDropDown (){
    const CartIcon: IconType = BsCart3;
    const TrashIcon: IconType = FaTrashAlt;
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const cartDataState = useCart();
    const {cartItems} = cartDataState;

    function handleDelete(itemId:number){
        cartDataState!.deleteItem!(itemId);
    }


    return (
        <div
        className={styles.cartContainer}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        >    
        
        
            <div className={styles.cartIcon}>
                <Link to={"/Cart"}><CartIcon size={40}/></Link>
            </div>
            <p className={styles.cartQuantityIcon}>
                {cartDataState!.cartTotalItems!()}
            </p>
            <p className={styles.cartPriceIcon}>
                $
                {cartDataState!.cartTotalItems!() < 1 ? "0.00" : cartDataState!.cartTotalPrice!()}
            </p>
        

        {isOpen && (
            <div className={styles.cartDropdown}>
            <h4>Your Cart</h4>
            <div style={{display:"flex", flexDirection:"column"}}>
            {cartItems!.map(item => (
                    <div style={{display:"flex", alignContent:"center", justifyContent:"space-evenly"}} key={item.id}>
                    <strong>{item.name}</strong> — ${item.price} × {item.quantity}<button onClick={()=>handleDelete(item.id)} ><TrashIcon/></button>
                    </div>
                ))}
            </div>
            {/* <ul>
                {cartItems!.map(item => (
                    <li key={item.id}>
                    <strong>{item.name}</strong> — ${item.price} × {item.quantity}<button style={{display:"inline"}}onClick={()=>handleDelete(item.id)} ><TrashIcon/></button>
                    </li>
                ))}
            </ul> */}
            <button><Link to={"/Cart"}>View Cart</Link></button>
            </div>
        )}
        </div>
    );
};