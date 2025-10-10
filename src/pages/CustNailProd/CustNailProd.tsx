import { Product } from "../../components/Products/Product";
import styles from './CustNailProd.module.css';
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";


export function CustNailProd(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();

    return (
        <>
            <h1 className={`${styles.head} ${isClicked && isDesktop? styles.open : ''}`} style={{textAlign:"center"}}>Custom Nail Products</h1>
            <div className={`${styles.CustNailBody} ${ isClicked? styles.open : ''}`}>
                {Array(30).fill(0).map((_) => <Product/>)}
            </div>
        </>
    );
}