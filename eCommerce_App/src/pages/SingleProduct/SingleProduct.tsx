import { useParams } from "react-router-dom";
import type { DataInterface } from '../../pages/CustNailProd/CustNailProd';
import { useEffect, useState } from "react";
import styles from "./SingleProd.module.css";
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";

export function SingleProduct(){
    const { productId } = useParams();
    const [ isData, setIsData ] = useState<DataInterface[] | null>(null);
    const [ mainImageIndex, setMainImageIndex ] = useState<number>(0);
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();

        useEffect(() => {
            async function fetchData(){
                try {
                    const response = await fetch(`http://localhost:5000/products/${productId}`);
                    const data: DataInterface[] = await response.json();
                    console.log(data);
                    setIsData(data);
                    
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
        },[]);
    
    
    if (!isData) return <p>PRODUCT NOT FOUND</p>;
    return (
        
        <div className={`${styles.ProductBody} ${ isClicked && !isDesktop ? '' : ''} ${ isClicked && isDesktop ? styles.open : ''}`}>
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
                <button>ADD TO CART</button>
            </div>
            
            <h2>DESCRIPTION</h2>
            <p>{isData[0].description}</p>
        </div>
    );
};