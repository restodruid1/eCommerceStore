import { useState } from 'react';
import { BsCart3 } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import styles from './CartDropDown.module.css';
import { Link } from 'react-router-dom';

export function CartDropDown (){
    const CartIcon: IconType = BsCart3;
    const [isOpen, setIsOpen] = useState<boolean>(false);

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
            </ul>
            <button>View Cart</button>
            </div>
        )}
        </div>
    );
};