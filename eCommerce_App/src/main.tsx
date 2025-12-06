import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from './CartContext.tsx';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <CartProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CartProvider>
  // {/* </StrictMode> */}
  ,
)
