// import { Product } from '../../components/Products/Product';
import { useOutletContext } from "react-router-dom";
import { useState, useEffect } from 'react';
import type { LayoutProps } from '../Layout';
import styles from './Home.module.css';
import { FaSackDollar } from 'react-icons/fa6';
// import { useCart } from "../../CartContext";

export function Home(){
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    const [youTubeVideoId, setYouTubeVideoId] = useState<string>("");
    
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

        fetchYouTubeVideoId();
    },[]);


    return (
        <>
            <h2 style={{textAlign:"center", marginLeft:`${isMenuClicked && isDesktopOpen ? `250px` : '0px'}`}}>FEATURED ITEMS</h2>
            <div className={`${styles.mainBody} ${isMenuClicked && isDesktopOpen ? `${styles.open}` : ''}`}>
                {Array(5).fill(0).map((_, index) => <FaSackDollar key={index} style={{width:"100px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"100px"}}/>)}
            </div>
            
            <div className={`${styles.imageContainer} ${isMenuClicked && isDesktopOpen ? `${styles.open}` : ''}`}>
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