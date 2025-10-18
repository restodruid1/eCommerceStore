import { FaSackDollar } from 'react-icons/fa6';
import type { DataInterface } from '../../pages/CustNailProd/CustNailProd';
import { Link } from 'react-router-dom';

interface ProductProps {
    data: DataInterface;
};

export function Product ({ data }:ProductProps) {

    


    return (
            <div>       
            {/* <FaSackDollar style={{width:"100px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"100px"}}/> */}
            <Link to={`/CustomNailProducts/${data.id}/${data.name}`}><img src={`${data.url}`} style={{width:"100px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"100px"}}/></Link>
            <ol>
                <li>{data.id}</li> 
                <li>{data.name}</li> 
                <li>{data.quantity}</li> 
                <li>{data.weight}</li> 
                <li>{data.price}</li> 
                <li>{data.description}</li>
                <li>{data.created_at}</li>
            </ol> 
            </div>
    )
}