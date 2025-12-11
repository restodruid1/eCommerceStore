import { BsList } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import styles from './NavBar.module.css';
import { CartDropDown } from '../CartDropDown/CartDropDown';

type NavBarProps = {
    toggleMenu: () => void;
    isMenuClicked: boolean;
};

export function NavBar({toggleMenu, isMenuClicked}: NavBarProps) {
    const HamburgerIcon: IconType = BsList;

    return (
        <nav className={`${styles.navBar} ${isMenuClicked ? styles.open : ''}`}>
            <button onClick={toggleMenu} aria-label="Toggle menu">
                <HamburgerIcon size={40} />
            </button>

            <h1>The Anne Elizabeth Boutique</h1>
            
            <CartDropDown />
        </nav>
    )
}