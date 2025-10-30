import { Product } from "../../components/Products/Product";
// import styles from './APandS.module.css';
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import type { DataInterface } from "../CustNailProd/CustNailProd";
import { ComingSoon } from "../../components/ComingSoon/ComingSoon";
import { useCart } from "../../CartContext";

export function ArtPrintandStickers(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const [ isData, setIsData ] = useState<DataInterface[] | null>(null);
    const data = useCart();
    useEffect(() => {
        async function fetchData(){
            try {
                const response = await fetch("http://localhost:5000/products/artprintsandstickers");
                const data: DataInterface[] = await response.json();
                console.log(data);
                data.length === 0 ? setIsData(null) : setIsData(data);  
            } catch (err) {
                console.log("ERROR: " + err);
            }
        };
        fetchData();
    },[]);

    useEffect(() => {
        async function update(){
            try {
                data.updateTotal!();
                data.printCart!();
            } catch (err) {
                console.log("ERROR: " + err);
            }
        };
        update();
    },[]);

    if (!isData) 
        return (
            <>
                <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Art Prints & Stickers</h1>
                <ComingSoon />
            </>
        );
    
        return (
            <>
                <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Art Prints & Stickers</h1>
                <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                    {isData.map((dataInterface, index) => <Product key={index} data={dataInterface}/>)}
                </div>
            </>
        );
};