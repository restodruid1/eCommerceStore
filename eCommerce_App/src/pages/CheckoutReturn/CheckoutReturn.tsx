import { useState, useEffect } from 'react';


interface SessionResponse {
    status?: 'open' | 'complete';
    payment_status?: string;
    customer_email?: string;
  }
export function CheckoutReturn() {
    const [session, setSession] = useState<SessionResponse>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        // Get the session_id from URL
        const urlParams = new URLSearchParams(window.location.search);
        const session_id = urlParams.get('session_id');
    
        if (session_id) {
          fetch(`http://localhost:5000/session_status?session_id=${session_id}`)
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.json();
            })
            .then(data => {
              setSession(data);
              setLoading(false);
            })
            .catch(err => {
              setError(err.message);
              setLoading(false);
            });
        } else {
          setError('No session ID found in URL');
          setLoading(false);
        }
      }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    
    return (
        <div>
        {session?.status === 'complete' ? (
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