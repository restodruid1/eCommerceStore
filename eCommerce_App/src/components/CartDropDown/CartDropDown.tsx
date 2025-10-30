import { useState } from 'react';
import { BsCart3 } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import styles from './CartDropDown.module.css';
import { Link } from 'react-router-dom';
import { useCart } from '../../CartContext';

export function CartDropDown (){
    const CartIcon: IconType = BsCart3;
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const cartDataState = useCart();
    const {cartItems} = cartDataState;
    return (
        <div
        className={styles.cartContainer}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        >
        <div className={styles.cartIcon}><Link to={"/Cart"}><CartIcon size={40}/></Link></div>

        {isOpen && (
            <div className={styles.cartDropdown}>
            <h4>Your Cart</h4>
            <ul>
                <li>Item 1 — $10</li>
                <li>Item 2 — $20</li>
                {cartItems!.map(item => (
                    <li key={item.id}>
                    <strong>{item.name}</strong> — ${item.price} × {item.quantity}
                    </li>
                ))}
            </ul>
            <button><Link to={"/Cart"}>View Cart</Link></button>
            </div>
        )}
        </div>
    );
};