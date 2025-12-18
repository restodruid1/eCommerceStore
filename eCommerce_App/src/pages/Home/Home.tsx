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
                {Array(5).fill(0).map((_, index) => <FaSackDollar key={index} style={{width:"100px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"100px"}}/>)}
            </div>
            
            <div className={`${styles.imageContainer} ${isMenuClicked && isDesktopOpen ? `${styles.open}` : ''}`}>
                <iframe
                    width={isDesktopOpen ? "600px" : '200px'}
                    height={isDesktopOpen ? "300px" : '200px'}
                    src="https://youtube.com/embed/NZ96QcpBdmM"
                    allow="autoplay; encrypted-media"
                />
            </div>
        </>
    )
}