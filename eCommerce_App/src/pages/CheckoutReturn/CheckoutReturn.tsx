import { useState, useEffect } from 'react';
import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useCart } from '../../CartContext';

interface SessionResponse {
    status?: 'open' | 'complete';
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
        const session_id = urlParams.get('session_id');
    
        if (!session_id) {
          setError('No session ID found in URL');
          setLoading(false);
          return;
        }
        async function fetchSessionStatus(){
          try {
            const response = await fetch(`http://localhost:5000/session_status?session_id=${session_id}`);
            if (!response.ok) throw new Error("Could not find session");
  
            const data = await response.json();
            setSession(data);
            if (data.status === "complete") cart.clearCart();
            setLoading(false);
          } catch (err) {
            console.error(err);
            setLoading(false);
            if (err instanceof Error) setError(err.message);
          }
        }
        fetchSessionStatus();
      }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    
    return (
        <div className={`body column ${isMenuClicked && isDesktopOpen ? 'open' : ''}`}>
        {session.status === 'complete' ? (
            <div>
            <h2>Thank you for your order!</h2>
            {session.customer_email && <p>A confirmation email will be sent to {session.customer_email}</p>}
            </div>
        ) : (
            <div>
            <h2>Payment unsuccessful</h2>
            <p>Please try again or contact support.</p>
            </div>
        )}
        </div>
    );
}