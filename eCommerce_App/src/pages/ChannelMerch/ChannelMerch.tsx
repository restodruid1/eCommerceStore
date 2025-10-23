import { Product } from "../../components/Products/Product";
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import type { DataInterface } from "../CustNailProd/CustNailProd";
import { ComingSoon } from "../../components/ComingSoon/ComingSoon";


export function ChannelMerch(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const [ isData, setIsData ] = useState<DataInterface[] | null>(null);
    useEffect(() => {
        async function fetchData(){
            try {
                const response = await fetch("http://localhost:5000/products/channelmerch");
                const data: DataInterface[] = await response.json();
                console.log(data);
                data.length === 0 ? setIsData(null) : setIsData(data);  
            } catch (err) {
                console.log("ERROR: " + err);
            }
        };
        fetchData();
    },[]);


    if (!isData) 
        return (
            <>
                <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Channel Merch</h1>
                <ComingSoon />
            </>
        );
    
        return (
            <>
                <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Channel Merch</h1>
                <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                    {isData.map((dataInterface, index) => <Product key={index} data={dataInterface}/>)}
                </div>
            </>
        );
};