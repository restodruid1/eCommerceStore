import { useOutletContext } from "react-router-dom";
import type { LayoutProps } from "../../pages/Layout";
import { FaSackDollar } from 'react-icons/fa6';
import { useState, useEffect } from "react";
import "../../App.css";

export function ComingSoon() {
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const [ defaultImageState, setDefaultImageState ] = useState<boolean>(true);

    useEffect(() => {
        
      }, []);


    return (
            <>
                <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Coming Soon</h1>
                <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                    {defaultImageState ? <img 
                        src="https://cdk-hnb659fds-assets-289931925246-us-east-1.s3.us-east-1.amazonaws.com/defaultImg.jpg"
                        onError={() => setDefaultImageState(false)}
                        style={{width:"150px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"150px"}}
                    />
                    :
                    <FaSackDollar style={{width:"150px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"150px"}} />
                    }
                    
                </div>
            </>
        )
};