import { FaSackDollar } from 'react-icons/fa6';
import type { DataInterface } from '../../pages/CustNailProd/CustNailProd';


interface ProductProps {
    data: DataInterface;
};

export function Product ({ data }:ProductProps) {
    return (
            <>       
            <FaSackDollar style={{width:"100px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"100px"}}/>
            <p>{data.name} {data.age}</p>
            </>
    )
}