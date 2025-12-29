import { ComingSoon } from "../../components/ComingSoon/ComingSoon";
import { useOutletContext } from "react-router-dom";
import type { LayoutProps } from "../Layout";


export function Faq(){
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    return (
        <div style={{textAlign:"center"}} className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`}>
            <h1 style={{fontWeight:"normal"}}>
                FAQ
            </h1>
            <h2 style={{fontWeight:"normal", fontStyle:"italic"}}>Coming Soon...</h2>
            {/* <ComingSoon /> */}
        </div>
    );
}