import { Product } from "../../components/Products/Product";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import '../../App.css';
import { ComingSoon } from "../../components/ComingSoon/ComingSoon";
import type { LayoutProps } from "../Layout";

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

type CustomProductPage = {
    dbProductRouteName: string,
    pageName: string,
    urlNameSingleProductPage: string
}

export function CustomizableProductPage(props:CustomProductPage){
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    const [products, setProducts] = useState<DataInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const { dbProductRouteName, pageName, urlNameSingleProductPage } = props;

    useEffect(() => {
        async function fetchCustomNailDataData(){
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`http://localhost:5000/products/${dbProductRouteName}`);
                if (!response.ok) throw new Error(`Failed to fetch ${pageName}`);
                
                const data: DataInterface[] = await response.json();
                console.log(data);
                setProducts(data ?? []);

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


    function getPageHeaderHtml() {
        return (
            <>
                <h1>{pageName}</h1>
                <ComingSoon />
            </>
        )
    }

    if (loading) {
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                <h1>{pageName}</h1>
                <p>Loading...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                {getPageHeaderHtml()}
                <p>Error: Try Again Later</p>
            </div>
        )
    }

    if (!products.length) {
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                {getPageHeaderHtml()}
            </div>
        )
    }

    return (
        <>
            <h1 className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>{pageName}</h1>
            <div className={`body row ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
                {products.map((product, index) => <Product key={index} pageUrl={urlNameSingleProductPage} product={product}/>)}
            </div>
        </>
    );
}
