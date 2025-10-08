import { useState, useEffect } from 'react'
import { BsList } from 'react-icons/bs';
import { BsCart3 } from 'react-icons/bs';
import { RiPokerHeartsLine } from 'react-icons/ri';
import './App.css'
import type { IconType } from 'react-icons';
import type { MouseEvent } from "react";
import { useMediaQuery } from './helper/mediaQuery';

function App() {
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const HamburgerIcon: IconType = BsList;
  const CartIcon: IconType = BsCart3;
  const HeartIcon: IconType = RiPokerHeartsLine;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (isClicked && !isDesktop) {
      setIsClicked(true);
    } else {
      setIsClicked(isDesktop);
    }
  }, [isDesktop]);

  function handleClick (event:MouseEvent<HTMLButtonElement>) {
    setIsClicked(!isClicked);
  }

  return (
    <>
      <nav className='nav-bar'>
        <button onClick={handleClick}><HamburgerIcon size={40} /></button>
        <h1>The Anne Elizabeth Boutique</h1>
        <CartIcon size={40}/>
      </nav>
      {isClicked &&
        <aside className="sidebar" >
          <div>
            <button onClick={handleClick}><HamburgerIcon size={40} /></button>
            <a href='/' className='home-link'>Anne Elizabeth</a>
          </div>
          <div style={{display:"flex"}}>
            <CartIcon size={40}/>
            <p>0 items : $0.00</p>
          </div>
          <div>
            {Array(3).fill(0).map((_, i) => <HeartIcon key={i} />)}
          </div>
          <h2>Products</h2>
          <h4>Custom Nail Products</h4>
          <h4>Art Prints & Stickers</h4>
          <h4>Other Handmade Crafts</h4>
          <h4>YouTube Channel Merch</h4>
          <div>
            {Array(3).fill(0).map((_, i) => <HeartIcon key={i} />)}
          </div>
          <h4>FAQ</h4>
          <h4>Contact Me</h4>
          <div>
            {Array(3).fill(0).map((_, i) => <HeartIcon key={i} />)}
          </div>
          <h4>YouTube Channel</h4>
        </aside>
      }
      {Array(59).fill(0).map((_, i) => <p>"hello world"</p>)}
      <img src='https://img.youtube.com/vi/kzWhzxuSyRA/sddefault.jpg'/>
    </>
  )
}

export default App
