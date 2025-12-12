// import { Product } from '../../components/Products/Product';
import { useOutletContext } from "react-router-dom";
import type { LayoutProps } from '../Layout';
import styles from './Home.module.css';
import { FaSackDollar } from 'react-icons/fa6';
// import { useCart } from "../../CartContext";

export function Home(){
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    // const cart = useCart();
    
    return (
        <>
            <h2 style={{textAlign:"center", marginLeft:`${isMenuClicked && isDesktopOpen ? `250px` : '0px'}`}}>FEATURED ITEMS</h2>
            <div className={`${styles.mainBody} ${isMenuClicked && isDesktopOpen ? `${styles.open}` : ''}`}>
                {Array(30).fill(0).map((_, index) => <FaSackDollar key={index} style={{width:"100px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"100px"}}/>)}
            </div>
            
            <div className={`${styles.imageContainer} ${isMenuClicked && isDesktopOpen ? `${styles.open}` : ''}`}>
                <img className={`${styles.image} ${isMenuClicked ? `${styles.open}` : ''}`} src='https://img.youtube.com/vi/kzWhzxuSyRA/sddefault.jpg'/>
            </div>
        </>
    )
}