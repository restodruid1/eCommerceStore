import { NavBar } from "../components/NavBar/NavBar";
import { Menu } from "../components/SideMenu/Menu";
import { useState, useEffect } from 'react';
import { useMediaQuery } from '../helper/mediaQuery';
import { Outlet } from "react-router-dom";


export interface LayoutProps {
    isClicked: boolean;
    isDesktop: boolean;
  }

export function Layout () {
    const [isClicked, setIsClicked] = useState<boolean>(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        setIsClicked(isDesktop);
    }, [isDesktop]);

    function handleClick () {
        setIsClicked(!isClicked);
    }
    return (
            <>
            <NavBar onClick={handleClick}/>
            {isClicked && <Menu onClick={handleClick} clicked={isClicked} desktop={isDesktop}/>}
            <Outlet context={{ isClicked, isDesktop }}/>
            </>
        )
}