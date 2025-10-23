import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";



export function Cart(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    return (
                <>
                    <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Cart</h1>
                    <div className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                        <>ITEMS IN CART</>
                    </div>
                </>
            );
}