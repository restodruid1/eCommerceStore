import { Product } from "../../components/Products/Product";
import styles from './CustNailProd.module.css';
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaSackDollar } from 'react-icons/fa6';

export interface DataInterface {
    id: number,
    name: string,
    quantity: number,
    weight: number,
    price: number,
    description: string,
    created_at: string
};

export function CustNailProd(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const [ isData, setIsData ] = useState<DataInterface[] | null>(null);
    useEffect(() => {
        async function fetchData(){
            try {
                const response = await fetch("http://localhost:5000/");
                const data: DataInterface[] = await response.json();
                console.log(data);
                setIsData(data); 
            } catch (err) {
                console.log("ERROR: " + err);
            }
        };
        fetchData();
    },[]);

    if (!isData) return <div className={`${styles.CustNailBody} ${ isClicked? styles.open : ''} ${isClicked && !isDesktop ? styles.test : ''}`}>
            <FaSackDollar style={{width:"100px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"100px"}}/>
        </div>

    return (
        <>
            <h1 className={`${styles.head} ${isClicked && isDesktop? styles.open : ''}`} style={{textAlign:"center"}}>Custom Nail Products</h1>
            <div className={`${styles.CustNailBody} ${ isClicked? styles.open : ''} ${isClicked && !isDesktop ? styles.test : ''}`}>
                {isData.map((dataInterface, index) => <Product key={index} data={dataInterface}/>)}
            </div>
        </>
    );
}
