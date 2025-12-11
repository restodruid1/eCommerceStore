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
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    const [ customNailProducts, setCustomNailProducts ] = useState<DataInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchCustomNailDataData(){
            setLoading(true);
            setError(null);
            try {
                const response = await fetch("http://localhost:5000/products/customnail");
                if (!response.ok) throw new Error('Failed to fetch custom nail products');
                
                const data: DataInterface[] = await response.json();
                console.log(data);
                setCustomNailProducts(data ?? []); 
            } catch (err) {
                console.error(err);
                const message = err instanceof Error ? err.message : String(err);
                setError(new Error(message));
            } finally {
                setLoading(false);
              }
        };
        fetchCustomNailDataData();
    },[]);


    function customNailProductHeaderHtml() {
        return (
            <>
                <h1 className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>Custom Nail Products</h1>
                <ComingSoon />
            </>)
    }

    if (loading) {
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                {customNailProductHeaderHtml()}
                <p>Loading...</p>
            </div>
        )
    }
    if (error) {
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                {customNailProductHeaderHtml()}
                <p>Error: Try Again Later</p>
            </div>
        )
    } 
    if (!customNailProducts.length) {
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                {customNailProductHeaderHtml()}
            </div>
        )
    }

    return (
        <>
            <h1 className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>Custom Nail Products</h1>
            <div className={`body row ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
                {customNailProducts.map((dataInterface, index) => <Product key={index} pageUrl="CustomNailProducts" data={dataInterface}/>)}
            </div>
        </>
    );
}
