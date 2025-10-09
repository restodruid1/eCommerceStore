import { Routes, Route } from "react-router-dom";
import './App.css'
import { Home } from "./pages/Home";
import { Faq } from "./pages/Faq";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  );
  
}

export default App
