// import { Product } from '../../components/Products/Product';
import { useOutletContext } from "react-router-dom";
import type { LayoutProps } from '../Layout';
import styles from './Home.module.css';
import { FaSackDollar } from 'react-icons/fa6';
import { useEffect } from "react";
import { useCart } from "../../CartContext";

export function Home(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const data = useCart();
    useEffect(() => {
            async function update(){
                try {
                    data.updateTotal!();
                    console.log("Cart: ")
                    data.printCart!();
                } catch (err) {
                    console.log("ERROR: " + err);
                }
            };
            update();
        },[data.cartItems]);
    
    return (
        <>
        {/* <NavBar onClick={handleClick}/>
        {isClicked && <Menu onClick={handleClick} clicked={isClicked} desktop={isDesktop}/>} */}
        <h2 style={{textAlign:"center", marginLeft:`${isClicked && isDesktop ? `250px` : '0px'}`}}>FEATURED ITEMS</h2>
        <div className={`${styles.mainBody} ${isClicked && isDesktop ? `${styles.open}` : ''}`}>
            {Array(30).fill(0).map((_, index) => <FaSackDollar key={index} style={{width:"100px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"100px"}}/>)}
        </div>
        
        <div className={`${styles.imageContainer} ${isClicked && isDesktop ? `${styles.open}` : ''}`}>
            <img className={`${styles.image} ${isClicked ? `${styles.open}` : ''}`} src='https://img.youtube.com/vi/kzWhzxuSyRA/sddefault.jpg'/>
        </div>
        </>
    )
}