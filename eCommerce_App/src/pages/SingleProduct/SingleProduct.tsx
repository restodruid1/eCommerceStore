import { useParams } from "react-router-dom";
import type { DataInterface } from '../../pages/CustNailProd/CustNailProd';
import { useEffect, useState } from "react";
import styles from "./SingleProd.module.css";
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import "../../App.css";
import type { CartItem } from "../../CartContext";
import { useCart } from "../../CartContext";

export function SingleProduct(){
    const { productId } = useParams();
    const [ isData, setIsData ] = useState<DataInterface[] | null>(null);
    const [ mainImageIndex, setMainImageIndex ] = useState<number>(0);
    const [ stockQuantity, setStockQuantity ] = useState<number>(0);
    const [ cartQuantity, setcartQuantity ] = useState<number>(1);
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const [ outOfStockMessage, setOutOfStockMessage ] = useState("");
    const cartDataState = useCart();

    useEffect(() => {
        async function fetchData(){
            try {
                const response = await fetch(`http://localhost:5000/products/${productId}`);
                const data: DataInterface[] = await response.json();
                // console.log(data);
                setIsData(data);
                const quantityAlreadyInCart = cartDataState!.findItemCartQuantity!(Number(productId));
                console.log("CART QUANT: = " + quantityAlreadyInCart);
                setStockQuantity(data[0].quantity - quantityAlreadyInCart);
                if (isData) {
                    isData.forEach((image, index) => {      // Find the index of the main product photo from array of returned db data
                        if (image.main_image === true) {
                            setMainImageIndex(index);
                        }
                    }); 
                }
            } catch (err) {
                console.log("ERROR: " + err);
            }
        };
        fetchData();
    },[productId]);

    useEffect(() => {
        if (!outOfStockMessage) return;
      
        const timer = setTimeout(() => {
            setOutOfStockMessage("");
        }, 5000);
      
        return () => clearTimeout(timer); // cleanup
      }, [outOfStockMessage]);

    function handleClickAdd(){
        setcartQuantity(cartQuantity + 1);
    }
    function handleClickDelete(){
        if (cartQuantity > 1) {
            setcartQuantity(cartQuantity - 1);
            // setOutOfStockMessage("");   
        } 
    }
    
    async function handleClickCart(){
        try {
            const response = await fetch(`http://localhost:5000/products/${productId}`);
            const data: DataInterface[] = await response.json();
            // console.log(data);
            const databaseStock = data[0].quantity;
            const mainCartItemQuantity = cartDataState!.findItemCartQuantity!(Number(productId))
            const itemQuantityInAllCarts = cartQuantity + mainCartItemQuantity;
            const availableProduct = databaseStock - itemQuantityInAllCarts;

            if (availableProduct < 0) {  // Check if item is in stock
                setOutOfStockMessage(`Only ${databaseStock - mainCartItemQuantity} available`);
                setcartQuantity(mainCartItemQuantity <= databaseStock ?  databaseStock - mainCartItemQuantity : 0);     // Shows reduced quantity available to buy
            } else {
                setStockQuantity(stockQuantity - cartQuantity);
                setcartQuantity(1);
                const { id, name, price, url } = data[0];
                const cartItem: CartItem = {id,name,price,quantity:cartQuantity, image:url}; 
                // alert(`added ${cartQuantity} to cart`);
                cartDataState.addToCart!(cartItem, databaseStock); // Pass stock quantity for valid amount check
            }   
            
        } catch (err) {
            console.log("ERROR: " + err);
        }
    }

    if (!isData) return <p>PRODUCT NOT FOUND</p>;

    return (
        <div className={`body column ${ isClicked && isDesktop ? 'open' : ''}`}>
            <h2>Product Name =  {isData[0].name}</h2>
            <img className={styles.mainImage} src={`${isData[mainImageIndex].url}`}/>
            <div className={styles.secondaryImageContainer}>
                {isData
                    .filter(image => !image.main_image)
                    .map((image,index) => (
                        <img className={styles.secondaryImage} key={index} src={image.url} alt="" />
                    ))
                }
            </div>
            {outOfStockMessage && <p style={{color:"red"}}>{outOfStockMessage}</p>}
            <div className={styles.priceAndCart}>
                <p>${isData[0].price}</p>
                <span>Quantity: {stockQuantity <= 0 ? 0 : cartQuantity}<button onClick={handleClickAdd}>+</button><button onClick={handleClickDelete}>-</button></span>
                <button disabled={stockQuantity <= 0 ? true : false} onClick={handleClickCart}>ADD TO CART</button>
                <p>{cartQuantity}</p>
                <p>{stockQuantity}</p>
            </div>
            
            <h2>DESCRIPTION</h2>
            <p>{isData[0].description}</p>
        </div>
    );
};