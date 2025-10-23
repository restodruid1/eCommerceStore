import { Product } from "../../components/Products/Product";
// import styles from './CustNailProd.module.css';
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import '../../App.css';
import { ComingSoon } from "../../components/ComingSoon/ComingSoon";

export interface DataInterface {
    id: number,
    name: string,
    quantity: number,
    weight: number,
    price: number,
    description: string,
    created_at: string,
    url: string,
    product_id?: number,
    main_image?: boolean
};

export function CustNailProd(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const [ isData, setIsData ] = useState<DataInterface[] | null>(null);
    useEffect(() => {
        async function fetchData(){
            try {
                const response = await fetch("http://localhost:5000/products/customnail");
                const data: DataInterface[] = await response.json();
                console.log(data);
                data.length === 0 ? setIsData(null) : setIsData(data);  
            } catch (err) {
                console.log("ERROR: " + err);
            }
        };
        fetchData();
    },[]);

    if (!isData)
        return (
            <>
                <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Custom Nail Products</h1>
                <ComingSoon />
            </>
        );

    return (
        <>
            <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Custom Nail Products</h1>
            <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                {isData.map((dataInterface, index) => <Product key={index} data={dataInterface}/>)}
            </div>
        </>
    );
}
