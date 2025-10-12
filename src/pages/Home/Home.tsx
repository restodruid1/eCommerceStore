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
        <h2 style={{textAlign:"center", marginLeft:`${isClicked && isDesktop ? `250px` : '0px'}`}}>FEATURED ITEMS</h2>
        <div className={`${styles.mainBody} ${isClicked && isDesktop ? `${styles.open}` : ''}`}>
            {Array(30).fill(0).map((_) => <Product/>)}
        </div>
        
        <div className={`${styles.imageContainer} ${isClicked && isDesktop ? `${styles.open}` : ''}`}>
            <img className={`${styles.image} ${isClicked ? `${styles.open}` : ''}`} src='https://img.youtube.com/vi/kzWhzxuSyRA/sddefault.jpg'/>
        </div>
        </>
    )
}