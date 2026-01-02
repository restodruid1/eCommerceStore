import type { DataInterface } from "../../pages/CustomizableProductPage/CustomizableProductPage";
import { useEffect, useState } from 'react';


export function ProductImagesDisplay ({productData}: {productData: DataInterface[]}) {
    
    const [ imagesArray, setImagesArray ] = useState<string[]>([]);
    const [ mainImageUrlIndex, setMainImageUrlIndex ] = useState(0);

    useEffect(() => {
        // Map all URLs at once and set state
        const urls = productData.map((image, index) => {
            if (image.main_image) {
                setMainImageUrlIndex(index);
            }
            return image.url;
        });
        setImagesArray(urls);
    }, [productData]); 
    
    return (
        <div>
            {/* Main image */}
            {imagesArray[mainImageUrlIndex] && (
                <img src={imagesArray[mainImageUrlIndex]} alt="Main product" style={{ width: "70%" , maxWidth:"700px", height:"auto", display:"block",marginInline:"auto"}} />
            )}

            {/* Thumbnails */}
            <div style={{ display: 'flex', marginTop: '10px' }}>
                {imagesArray.map((url, index) => (
                    <img
                        key={index}
                        src={url}
                        alt={`Thumbnail ${index}`}
                        style={{
                            width: '50px',
                            height: '50px',
                            marginRight: '5px',
                            cursor: 'pointer',
                            border: mainImageUrlIndex === index ? '2px solid blue' : '1px solid gray'
                        }}
                        onClick={() => setMainImageUrlIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
}