import { BsList } from 'react-icons/bs';
import { BsCart3 } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import styles from './NavBar.module.css';


type NavBarProps = {
    onClick: () => void;
};

export function NavBar({onClick}: NavBarProps) {
    const HamburgerIcon: IconType = BsList;
    const CartIcon: IconType = BsCart3;


    return (
        <nav className={styles.navBar}>
                <button onClick={onClick}><HamburgerIcon size={40} /></button>
                <h1>The Anne Elizabeth Boutique</h1>
                <CartIcon size={40}/>
            </nav>
    )
}