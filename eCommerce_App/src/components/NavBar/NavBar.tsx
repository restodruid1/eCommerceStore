import { BsList } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import styles from './NavBar.module.css';
import { CartDropDown } from '../CartDropDown/CartDropDown';

type NavBarProps = {
    onClick: () => void;
    isClicked: boolean;
};

export function NavBar({onClick, isClicked}: NavBarProps) {
    const HamburgerIcon: IconType = BsList;



    return (
        <nav className={`${styles.navBar} ${isClicked ? styles.open : ''}`}>
            <button onClick={onClick}><HamburgerIcon size={40} /></button>
            <h1>The Anne Elizabeth Boutique</h1>
            {/* <Link to={"/Cart"}><CartDropDown /></Link> */}
            <CartDropDown />
        </nav>
    )
}