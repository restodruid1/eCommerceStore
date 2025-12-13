import { useFetch } from "../../helper/helpers";
import { useParams } from "react-router-dom";
import type { DataInterface } from "../CustomizableProductPage/CustomizableProductPage";
import { useEffect, useState } from "react";
import type { CartItem } from "../../CartContext";
import { useCart } from "../../CartContext";
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { ProductImagesDisplay } from "../../components/Products/ProductImagesDisplay";
import styles from "./SingleProd.module.css"; 

interface ProductInformation {
    id:number;
    description: string;
    stock: number;
    name: string;
    price: number;
    imageUrl: string;
}

export function SingleProduct() {
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    const { productId } = useParams();
    const { data, loading, error } = useFetch<DataInterface[]>(`http://localhost:5000/products/${productId}`);
    const cart = useCart();
    const [productInformation, setProductInformation] = useState<Partial<ProductInformation>>({});
    const [selectedQuantity, setSelectedQuantity] = useState<number>(0);
    const [ errorMessage, setErrorMessage ] = useState("");
    const stockMinusCart = (productInformation?.stock ?? 0) - (cart.findItemCartQuantity(productInformation.id ?? -1));
   
    useEffect(() => {
        if (!data) return;

        setProductInformation({
            id: data[0].id,
            name: data[0].name,
            description: data[0].description,
            stock: data[0].quantity,
            price: data[0].price,
            imageUrl: data[0].url 
        })
    },[data]);


    function handleAddToCart(quantityToAddToCart:number){
        console.log("AADEDD TO CART: ", quantityToAddToCart);
        const { id,name,price,imageUrl } = productInformation;

        if (id != null && name && price != null && quantityToAddToCart != null && imageUrl) {
              const cartItem: CartItem = {id, name, price, quantity:quantityToAddToCart, image:imageUrl};
              cart.addToCart(cartItem);
        } else {
            setErrorMessage("Something went wrong. Try again later");
        }
    }

    if (loading) {
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                <p>Loading Product Information...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                <p>Error: Try Again Later</p>
            </div>
        )
    }

    if (!data || !productInformation) {
        return (
            <div className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`} style={{textAlign:"center"}}>
                <p>Product Not Found</p>;
            </div>
        )
    }

    return (
        <div className={`body column ${ isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
            <h2>Product Name =  {productInformation.name}</h2>
            <ProductImagesDisplay productData={data}/>

            <h2>${productInformation.price}</h2>
            <div className={styles.priceAndCart}>
                <select
                    disabled={stockMinusCart <= 0}
                    onChange={(e)=>{
                        setSelectedQuantity(Number(e.target.value));
                        setErrorMessage("");
                    }}
                 >
                    <option value={0}>
                        {stockMinusCart > 0 ? "Select quantity" : "Out Of Stock"}
                    </option>

                    {Array.from({ length: stockMinusCart }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                        {i + 1}
                        </option>
                    ))}
                </select>
                <button onClick={()=>handleAddToCart(selectedQuantity)} disabled={stockMinusCart <= 0 || selectedQuantity === 0}>
                    Add To Cart
                </button>
            </div>
            {errorMessage && <p style={{color:"red"}}>{errorMessage}</p>}
            
            <h2>DESCRIPTION</h2>
            <p>{productInformation.description}</p>
        </div>
    );
}