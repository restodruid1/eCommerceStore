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
            
            <button style={{backgroundColor:"white", marginLeft:"10px"}} className={`${styles.left}`} hidden={isMenuClicked ? true : false} onClick={toggleMenu} aria-label="Toggle menu">
                <HamburgerIcon size={40} />
            </button>

            <h1 className={`${styles.center}`}>Anne Elizabeth</h1>
            
            <CartDropDown />
        </nav>
    )
}