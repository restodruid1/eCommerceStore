import { RiPokerHeartsLine } from 'react-icons/ri';
import { BsList } from 'react-icons/bs';
import { BsCart3 } from 'react-icons/bs';
import type { IconType } from 'react-icons';
import styles from './SideMenu.module.css';
import { Link } from 'react-router-dom';
import { useCart } from '../../CartContext';

type MenuProps = {
    toggleMenu: () => void;
    isMenuClicked: boolean;
    isDesktopOpen: boolean;
};

export function Menu({toggleMenu, isMenuClicked, isDesktopOpen}: MenuProps){
    const HeartIcon: IconType = RiPokerHeartsLine;
    const HamburgerIcon: IconType = BsList;
    const CartIcon: IconType = BsCart3;
    const cart = useCart();
    
    function handleClick(){
      if (!isDesktopOpen) {
        toggleMenu();
      }
    }

    // useEffect(() => {
    //   document.body.style.overflow = clicked && !desktop ? "hidden" : "auto";
    // }, [clicked]);

    return (
        <aside className={`${styles.sideMenu} ${isMenuClicked && !isDesktopOpen ? `${styles.mobile}`:''} `}>
          <div className={styles.menuHead}>
            <button onClick={toggleMenu}><HamburgerIcon size={40} /></button>
            <Link to={"/"} className={styles.homeLink}>Anne Elizabeth</Link>
          </div>

          <div style={{display:"flex"}}>
            <Link to={"/Cart"} onClick={handleClick}><CartIcon size={40}/></Link>
            <p>{cart.totalItemsInCart} {cart.totalItemsInCart === 1  ? 'item' : 'items'} : ${cart.totalPriceOfCart.toFixed(2)}</p>
          </div>

          <div>
            {Array(3).fill(0).map((_, i) => <HeartIcon key={i} />)}
          </div>

          <h2>Products</h2>
          <h4><Link to={"/CustomNailProducts"} onClick={handleClick}>Custom Nail Products</Link></h4>
          <h4><Link to={"/ArtPrintsandStickers"} onClick={handleClick}>Art Prints & Stickers</Link></h4>
          <h4><Link to={"/OtherHandmadeCrafts"} onClick={handleClick}>Other Handmade Crafts</Link></h4>
          <h4><Link to={"/ChannelMerch"} onClick={handleClick}>YouTube Channel Merch</Link></h4>
          
          <div>
            {Array(3).fill(0).map((_, i) => <HeartIcon key={i} />)}
          </div>
          
          <h4><Link to={"/Faq"} onClick={handleClick}>FAQ</Link></h4>
          <h4><Link to={"/ContactMe"} onClick={handleClick}>Contact Me</Link></h4>
          
          <div>
            {Array(3).fill(0).map((_, i) => <HeartIcon key={i} />)}
          </div>
          
          <h4><a href='https://www.youtube.com/@TheAnneElizabeth' target='_blank'>YouTube Channel</a></h4>
        </aside>
    )
}