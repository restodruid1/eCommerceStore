import { useState, useEffect } from 'react'
import './App.css'
import { useMediaQuery } from './helper/mediaQuery';
import { NavBar } from './components/NavBar/NavBar';
import { Menu } from './components/SideMenu/Menu';
import { Product } from './components/Products/Product';

function App() {
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
      <h2 style={{textAlign:"center"}}>FEATURED ITEMS</h2>
      <div className={`main-body ${isClicked ? 'open' : ''}`}>
        {Array(30).fill(0).map((_, i) => <Product/>)}

      </div>
      <img style={{display: "block", margin: "0 auto", width:`${isDesktop ? "fit-content" : "300px"}`}} src='https://img.youtube.com/vi/kzWhzxuSyRA/sddefault.jpg'/>
    </>
  )
}

export default App
