import { useState, useEffect } from 'react';
import type { LayoutProps } from "../Layout";
import { useOutletContext, Link } from "react-router-dom";
import { useCart } from '../../CartContext';
import { deleteReservedCartOnDB } from '../../helper/helpers';
import { serverUrl } from '../Home/Home';

interface SessionResponse {
    status?: 'open' | 'complete' | 'expired';
    payment_status?: string;
    customer_email?: string;
  }
export function CheckoutReturn() {
    const { isMenuClicked, isDesktopOpen } = useOutletContext<LayoutProps>();
    const [session, setSession] = useState<SessionResponse>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const cart = useCart();

    useEffect(() => {
        // Get the session_id from URL
        const urlParams = new URLSearchParams(window.location.search);
        const session_id = urlParams.get('session_id') ?? localStorage.getItem("sessionId");
    
        if (!session_id) {
          setError('No session ID found');
          setLoading(false);
          return;
        }
        async function fetchSessionStatus(){
          try {
            const response = await fetch(serverUrl ? serverUrl + `/session_status?session_id=${session_id}` : `http://localhost:5000/session_status?session_id=${session_id}`);
            if (!response.ok) throw new Error("Could not find session");
  
            const data = await response.json();
            setSession(data);
            if (data.status === "complete") cart.clearCart();
            if (data.status === "expired") deleteReservedCartOnDB();
          } catch (err) {
            console.error(err);
            if (err instanceof Error) setError(err.message);
          } finally {
            setLoading(false);
          }
        }
        fetchSessionStatus();
      }, []);

    if (loading) {
      return ( 
        <p className={`body column ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
          Loading...
        </p>);
    }
    if (error) {
      return (
        <div className={`body column ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
          <p>
            An Error Has Occured
          </p>
          <Link to={"/Cart"}>Back To Cart</Link>
        </div>
      );
    }
    
    if (session.status === "expired") {
      return (
        <div className={`body column ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
          <h2>Your Checkout Session Has Expired.</h2>
          <Link to={"/Cart"}>Back To Cart</Link>
        </div>
      )
    }
    if (session.status === "complete") {
      return (
        <div className={`body column ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
          <h2>Thank you for your order!</h2>
          {session.customer_email && <p>A confirmation email will be sent to {session.customer_email}</p>}
          <Link to={"/"}>Continue Shopping</Link>
        </div>
      )
    }
      
    return (
        <div className={`body column ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
            <h2>Something Went Wrong. Please try again or contact support.</h2>
            <Link to={"/ContactMe"}>Contact Support</Link>
        </div>
    );
}