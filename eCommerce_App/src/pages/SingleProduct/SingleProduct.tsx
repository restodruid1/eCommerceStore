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
    const cartDataState = useCart();

        useEffect(() => {
            async function fetchData(){
                try {
                    const response = await fetch(`http://localhost:5000/products/${productId}`);
                    const data: DataInterface[] = await response.json();
                    console.log(data);
                    setIsData(data);
                    setStockQuantity(data[0].quantity);
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

    function handleClickAdd(){
        if (cartQuantity + 1 > stockQuantity) {
            alert("Max Quantity Reached");
        } else {
            setcartQuantity(cartQuantity + 1);
        }
    }
    function handleClickDelete(){
        if (cartQuantity > 1) {
            setcartQuantity(cartQuantity - 1);   
        } 
    }
    
    async function handleClickCart(){
        try {
            const response = await fetch(`http://localhost:5000/products/${productId}`);
            const data: DataInterface[] = await response.json();
            console.log(data);
            if (cartQuantity > data[0].quantity) {
                alert("quantity not in stock");
                setcartQuantity(data[0].quantity);
            } else {
                const { id, name, price, quantity } = data[0];
                const cartItem: CartItem = {id,name,price,quantity}; 
                alert(`added ${cartQuantity} to cart`);
                cartDataState.addToCart!(cartItem);
            }   
            
        } catch (err) {
            console.log("ERROR: " + err);
        }
        setcartQuantity(1);
    }

    if (!isData) return <p>PRODUCT NOT FOUND</p>;

    return (
        <div className={`body column ${ isClicked && isDesktop ? 'open' : ''}`}>
            <h2>Product Name =  ${isData[0].name}</h2>
            <img className={styles.mainImage} src={`${isData[mainImageIndex].url}`}/>
            <div className={styles.secondaryImageContainer}>
                {isData
                    .filter(image => !image.main_image)
                    .map((image,index) => (
                        <img className={styles.secondaryImage} key={index} src={image.url} alt="" />
                    ))
                }
            </div>
            <div className={styles.priceAndCart}>
                <p>${isData[0].price}</p>
                <span>Quantity: {stockQuantity === 0 ? 0 : cartQuantity}<button onClick={handleClickAdd}>+</button><button onClick={handleClickDelete}>-</button></span>
                <button onClick={handleClickCart}>ADD TO CART</button>
            </div>
            
            <h2>DESCRIPTION</h2>
            <p>{isData[0].description}</p>
        </div>
    );
};