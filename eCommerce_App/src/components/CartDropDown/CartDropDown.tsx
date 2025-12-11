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
    const cart = useCart();
    const { cartItems, totalPriceOfCart, totalItemsInCart } = cart;

    function handleDelete(itemId:number){
        cart.deleteItem(itemId);
    }

    return (
        <div 
            className={styles.cartContainer}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >    
        
        <div className={styles.cartIcon}>
            <Link to={"/Cart"}><CartIcon aria-label="Toggle cart dropdown" size={40}/></Link>
        </div>

        <p className={styles.cartQuantityIcon}>{totalItemsInCart}</p>
        <p className={styles.cartPriceIcon}>${totalItemsInCart < 1 ? "0.00" : totalPriceOfCart.toFixed(2)}</p>
        
        {isOpen && (
            <div className={styles.cartDropdown}>
                <h4>Your Cart</h4>
                <div style={{display:"flex", flexDirection:"column"}}>
                    {cartItems.map(item => (
                            <div style={{display:"flex", alignContent:"center", justifyContent:"space-evenly"}} key={item.id}>
                                <strong>{item.name}</strong> — ${item.price} × {item.quantity}
                            </div>
                        ))}
                    </div>
                    <Link to={"/Cart"}>View Cart</Link>
            </div>
            )}
        </div>
    );
};