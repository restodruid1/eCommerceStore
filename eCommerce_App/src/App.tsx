import { Routes, Route } from "react-router-dom";
import './App.css'
import { Home } from "./pages/Home/Home";
import { Faq } from "./pages/Faq/Faq";
import { CustNailProd } from "./pages/CustNailProd/CustNailProd";
import { Layout } from "./pages/Layout";
import { SingleProduct } from "./pages/SingleProduct/SingleProduct";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="CustomNailProducts" element={<CustNailProd />}/> 
          <Route path="CustomNailProducts/:productId/:name" element={<SingleProduct />} />
          <Route path="faq" element={<Faq />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Route >
      </Routes>
  );
  
}

export default App
