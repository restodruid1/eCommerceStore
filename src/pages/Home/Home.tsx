import { Product } from '../../components/Products/Product';
import { useOutletContext } from "react-router-dom";
import type { LayoutProps } from '../Layout';
import styles from './Home.module.css';

export function Home(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();

    return (
        <>
        {/* <NavBar onClick={handleClick}/>
        {isClicked && <Menu onClick={handleClick} clicked={isClicked} desktop={isDesktop}/>} */}
        <h2 style={{textAlign:"center"}}>FEATURED ITEMS</h2>
        <div className={`${styles.mainBody} ${isClicked ? `${styles.open}` : ''}`}>
            {Array(30).fill(0).map((_) => <Product/>)}
        </div>
        <img style={{display: "block", margin: "0 auto", width:`${isDesktop ? "fit-content" : "300px"}`}} src='https://img.youtube.com/vi/kzWhzxuSyRA/sddefault.jpg'/>
        </>
    )
}