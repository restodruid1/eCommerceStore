// import { FaSackDollar } from 'react-icons/fa6';
import type { DataInterface } from '../../pages/CustNailProd/CustNailProd';
import { Link } from 'react-router-dom';

interface ProductProps {
    data: DataInterface;
    pageUrl: string;
};

export function Product ({ data, pageUrl }:ProductProps) {
    
    return (
            <div className="productItems">
                <Link to={`/${pageUrl}/${data.id}/${data.name}`}><img src={`${data.url}`} className='productImages'/></Link>
                <div style={{display:"flex", flexDirection:"column", alignContent:"center", justifyContent:"center"}}>
                    <h3 style={{textAlign:"center"}}>{data.name}</h3>
                    <p style={{textAlign:"center"}}>${data.price}</p>
                </div> 
            </div>
    )
}