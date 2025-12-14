import { Product } from "../../components/Products/Product";
import { useOutletContext } from "react-router-dom";
import '../../App.css';
import { ComingSoon } from "../../components/ComingSoon/ComingSoon";
import type { LayoutProps } from "../Layout";
import { useFetch } from "../../helper/helpers";

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
    const { dbProductRouteName, pageName, urlNameSingleProductPage } = props;
    const { data, loading, error } = useFetch<DataInterface[]>(`http://localhost:5000/products/${dbProductRouteName}`);

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

    if (!data || data.length === 0) {
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
                {data.map((product, index) => <Product key={index} pageUrl={urlNameSingleProductPage} product={product}/>)}
            </div>
        </>
    );
}
