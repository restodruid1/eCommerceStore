import { BsList } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import styles from './NavBar.module.css';
import { CartDropDown } from '../CartDropDown/CartDropDown';
import { Link } from 'react-router-dom';
import headerImage from "../../assets/website_header.png";

type NavBarProps = {
    toggleMenu: () => void;
    isMenuClicked: boolean;
};

export function NavBar({toggleMenu, isMenuClicked}: NavBarProps) {
    const HamburgerIcon: IconType = BsList;

    return (
        <nav className={`${styles.navBar} ${isMenuClicked ? styles.open : ''}`}>

            <div className={`${styles.left}`} hidden={isMenuClicked ? true : false} onClick={toggleMenu} aria-label="Toggle menu">
                <HamburgerIcon style={{flexShrink:"1",maxWidth:"34px", cursor:"pointer"}} size="100%" />
            </div>

            <div className={`${styles.center}`}>
                <Link to={"/"}><img src={headerImage}/></Link>
            </div>
            
            <div className={`${styles.right}`}>
                <CartDropDown />
            </div>
        </nav>
    )
    
}