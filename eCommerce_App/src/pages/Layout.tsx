import { NavBar } from "../components/NavBar/NavBar";
import { Menu } from "../components/SideMenu/Menu";
import { useState, useEffect } from 'react';
import { useMediaQuery } from '../helper/mediaQuery';
import { Outlet } from "react-router-dom";


export interface LayoutProps {
    isMenuClicked: boolean;
    isDesktopOpen: boolean;
};


export function Layout () {
    const [isMenuClicked, setIsMenuClicked] = useState(false);
    const isDesktopOpen = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        setIsMenuClicked(isDesktopOpen);
    }, [isDesktopOpen]);

    function handleClick () {
        setIsMenuClicked(!isMenuClicked);
    }
    return (
            <>
                <NavBar toggleMenu={handleClick} isMenuClicked={isMenuClicked}/>
                {isMenuClicked && (
                    <Menu 
                        toggleMenu={handleClick} 
                        isMenuClicked={isMenuClicked} 
                        isDesktopOpen={isDesktopOpen}
                    />
                )}
                <Outlet context={{ isMenuClicked, isDesktopOpen }}/>
            </>
        )
}
