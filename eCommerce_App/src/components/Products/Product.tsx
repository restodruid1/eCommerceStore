// import { FaSackDollar } from 'react-icons/fa6';
import type { DataInterface } from "../../pages/CustomizableProductPage/CustomizableProductPage";
import { Link } from 'react-router-dom';

interface ProductProps {
    product: DataInterface;
    pageUrl: string;
};

export function Product ({ product, pageUrl }:ProductProps) {
    return (
            <article className="productItems">
                <Link to={`/${pageUrl}/${product.id}/${encodeURIComponent(product.name)}`}>
                    <img 
                        src={product.url}
                        className='productImages'
                        alt={product.name}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://cdk-hnb659fds-assets-289931925246-us-east-1.s3.us-east-1.amazonaws.com/defaultImg.jpg";
                        }} 
                        />
                </Link>

                <div style={{display:"flex", flexDirection:"column", alignContent:"center", justifyContent:"center"}}>
                    <h3 style={{textAlign:"center", marginBottom:"0px"}}>{product.name}</h3>
                    <p style={{textAlign:"center", marginTop:"0px"}}>${product.price}</p>
                    {product.quantity < 1 ? <p style={{color:"red",textAlign:"center"}}>Out of stock</p> : ""}
                </div> 
            </article>
    )
}