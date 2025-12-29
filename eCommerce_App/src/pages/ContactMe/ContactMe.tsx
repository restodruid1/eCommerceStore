import { useOutletContext } from "react-router-dom";
import type { LayoutProps } from "../Layout";


export function ContactMe(){
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    return (
        <div style={{textAlign:"center"}} className={`${isMenuClicked && isDesktopOpen? 'open' : ''}`}>
            <h2 style={{fontWeight:"normal"}}>
                Contact Me
            </h2>
            <a style={{cursor:"pointer"}} href="mailto:Anne.shop391@gmail.com" target="_blank">Anne.shop391@gmail.com</a>
        </div>
    );
}