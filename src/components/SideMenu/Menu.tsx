import { RiPokerHeartsLine } from 'react-icons/ri';
import { BsList } from 'react-icons/bs';
import { BsCart3 } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import styles from './SideMenu.module.css';

type MenuProps = {
    onClick: () => void;
    clicked: boolean;
    desktop: boolean;
};

export function Menu({onClick, clicked, desktop}: MenuProps){
    const HeartIcon: IconType = RiPokerHeartsLine;
    const HamburgerIcon: IconType = BsList;
    const CartIcon: IconType = BsCart3;

    return (
        <aside className={`${styles.sideMenu} ${clicked && !desktop ? `${styles.mobile}`:''} `}>
          <div>
            <button onClick={onClick}><HamburgerIcon size={40} /></button>
            <a href='/' className={styles.homeLink}>Anne Elizabeth</a>
          </div>
          <div style={{display:"flex"}}>
            <CartIcon size={40}/>
            <p>0 items : $0.00</p>
          </div>
          <div>
            {Array(3).fill(0).map((_, i) => <HeartIcon key={i} />)}
          </div>
          <h2>Products</h2>
          <h4>Custom Nail Products</h4>
          <h4>Art Prints & Stickers</h4>
          <h4>Other Handmade Crafts</h4>
          <h4>YouTube Channel Merch</h4>
          <div>
            {Array(3).fill(0).map((_, i) => <HeartIcon key={i} />)}
          </div>
          <h4>FAQ</h4>
          <h4>Contact Me</h4>
          <div>
            {Array(3).fill(0).map((_, i) => <HeartIcon key={i} />)}
          </div>
          <h4>YouTube Channel</h4>
        </aside>
    )
}