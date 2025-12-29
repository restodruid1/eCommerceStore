// import { Product } from '../../components/Products/Product';
import { useOutletContext } from "react-router-dom";
import { useState, useEffect } from 'react';
import type { LayoutProps } from '../Layout';
import styles from './Home.module.css';
import { FaSackDollar } from 'react-icons/fa6';
import type { DataInterface } from "../CustomizableProductPage/CustomizableProductPage";
import { Product } from "../../components/Products/Product";

export function Home(){
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    const [youTubeVideoId, setYouTubeVideoId] = useState<string>("");
    const [featuredProducts, setFeaturedProducts] = useState<DataInterface[]>([]);
    

    useEffect(()=>{
        async function fetchYouTubeVideoId(){
            try {
                const response = await fetch(`http://localhost:5000/products/YouTubeVideoId`,{
                    method: "GET",
                    headers: {
                    "Content-Type": "application/json"
                    }
                });

                if (!response.ok) throw new Error("Unable to fetch YouTube video ID");

                const data:Partial<{result: {videoid:string}, error:string}> = await response.json();
                if (data.error) throw new Error("Server failure when fetching video ID");
                if (data.result) setYouTubeVideoId(data.result.videoid);

            } catch (err) {
                console.error(err);
            }
        }
        async function fetchFeaturedProducts(){
            try {
                const response = await fetch(`http://localhost:5000/products/FeaturedProducts`,{
                    method: "GET",
                    headers: {
                    "Content-Type": "application/json"
                    }
                });

                if (!response.ok) throw new Error("Unable to find featured products");

                const data = await response.json();
                if (data.error) throw new Error("Server failure when fetching video ID");
                
                if (data.result) setFeaturedProducts(data.result);

            } catch (err) {
                console.error(err);
                setFeaturedProducts([]);
            }
        }
        fetchYouTubeVideoId();
        fetchFeaturedProducts();
    },[]);

    
    const urlByCategory = [
        "CustomNailProducts", 
        "ArtPrintsandStickers",
        "OtherHandmadeCrafts",
        "ChannelMerch"
    ]

    return (
        <>
            <h2 className={`${styles.containerHeader} ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>FEATURED ITEMS</h2>
            <div className={`body row ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
                {featuredProducts.length > 0 ? 
                featuredProducts.map((product, index) => <Product key={index} pageUrl={urlByCategory[product.category]} product={product}/>)
                :
                Array(5).fill(0).map((_, index) => <FaSackDollar key={index} className={styles.defaultImage}/>)
                }
            </div>
            
            <div className={`${styles.imageContainer} ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
                <iframe
                    width={isDesktopOpen ? "600px" : '200px'}
                    height={isDesktopOpen ? "300px" : '200px'}
                    src={youTubeVideoId ?
                        `https://youtube.com/embed/${youTubeVideoId}`
                        : 
                        "https://youtube.com/embed/0expGa_qGGM"}
                    allow="autoplay; encrypted-media"
                />
            </div>
        </>
    )
}