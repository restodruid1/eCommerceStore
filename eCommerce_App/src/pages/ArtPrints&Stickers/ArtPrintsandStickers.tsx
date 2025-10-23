import { Product } from "../../components/Products/Product";
// import styles from './APandS.module.css';
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import type { DataInterface } from "../CustNailProd/CustNailProd";
import { ComingSoon } from "../../components/ComingSoon/ComingSoon";


export function ArtPrintandStickers(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const [ isData, setIsData ] = useState<DataInterface[] | null>(null);
    useEffect(() => {
        async function fetchData(){
            try {
                const response = await fetch("http://localhost:5000/products/artprintsandstickers");
                const data: DataInterface[] = await response.json();
                console.log(data);
                setIsData(data); 
            } catch (err) {
                console.log("ERROR: " + err);
            }
        };
        fetchData();
    },[]);


    if (!isData) return <ComingSoon />
    
        return (
            <>
                <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Custom Nail Products</h1>
                <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                    {isData.map((dataInterface, index) => <Product key={index} data={dataInterface}/>)}
                </div>
            </>
        );
};