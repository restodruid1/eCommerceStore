import { Routes, Route } from "react-router-dom";
import './App.css'
import { Home } from "./pages/Home/Home";
import { Faq } from "./pages/Faq/Faq";
import { CustNailProd } from "./pages/CustNailProd/CustNailProd";
import { Layout } from "./pages/Layout";
import { SingleProduct } from "./pages/SingleProduct/SingleProduct";
import { ArtPrintandStickers } from "./pages/ArtPrints&Stickers/ArtPrintsandStickers";
import { HandmadeCrafts } from "./pages/OtherHandmadeCrafts/HandmadeCrafts";
import { ChannelMerch } from "./pages/ChannelMerch/ChannelMerch";
import { ContactMe } from "./pages/ContactMe/ContactMe";
import { Cart } from "./pages/Cart/Cart";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="CustomNailProducts" element={<CustNailProd />}/> 
          <Route path="CustomNailProducts/:productId/:name" element={<SingleProduct />}/>
          <Route path="ArtPrintsandStickers" element={<ArtPrintandStickers />}/>
          <Route path="ArtPrintsandStickers/:productId/:name" element={<SingleProduct />}/>
          <Route path="OtherHandmadeCrafts" element={<HandmadeCrafts />}/>
          <Route path="OtherHandmadeCrafts/:productId/:name"  element={<SingleProduct />}/>
          <Route path="ChannelMerch" element={<ChannelMerch />}/>
          <Route path="ChannelMerch/:productId/:name" element={<SingleProduct />}/>
          <Route path="Faq" element={<Faq />} />
          <Route path="ContactMe" element={<ContactMe />} />
          <Route path="Cart" element={<Cart />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Route >
      </Routes>
  );
  
}

export default App
