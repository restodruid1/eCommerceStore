import { useOutletContext } from "react-router-dom";
import type { LayoutProps } from "../../pages/Layout";
import { FaSackDollar } from 'react-icons/fa6';
import "../../App.css";

export function ComingSoon() {
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    return (
            <>
                <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Coming Soon</h1>
                <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                    <FaSackDollar style={{width:"100px", height:"200px", flex:"auto",margin: "5%", cursor:"pointer", backgroundColor:"lightgray", maxWidth:"100px"}}/>
                </div>
            </>
        )
};