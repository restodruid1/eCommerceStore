import type { DataInterface } from '../../pages/CustNailProd/CustNailProd';
import { useEffect, useState } from 'react';

export function ProductImagesDisplay ({images}: {images: DataInterface[]}) {
    
    const [ imagesArray, setImagesArray ] = useState<string[]>([]);
    const [ mainImageArrayIndex, setMainImageArrayIndex ] = useState(0);

    useEffect(() => {
        // Map all URLs at once and set state
        const urls = images.map((item) => item.url);
        setImagesArray(urls);
    }, [images]); 
    
    return (
        <div>
            {/* Main image */}
            {imagesArray[mainImageArrayIndex] && (
                <img src={imagesArray[mainImageArrayIndex]} alt="Main product" style={{ width: '300px', height: '300px' }} />
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
                            border: mainImageArrayIndex === index ? '2px solid blue' : '1px solid gray'
                        }}
                        onClick={() => setMainImageArrayIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
}