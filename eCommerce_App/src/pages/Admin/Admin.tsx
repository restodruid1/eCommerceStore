import React, { useState } from 'react';
import { serverUrl } from '../Home/Home';

export function Admin(){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch(serverUrl ? serverUrl + `/api/admin/login` : "http://localhost:5000/api/admin/login", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            credentials: "include",
            },
            body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            // console.log(data);
            if (data.error) {
                setError("Invalid credentials. Please try again.");
                return;
            }
            localStorage.setItem("jwt", data.jwt);
            // console.log(data);
            window.location.href = "/adminpage";
        } catch (err) {
            setError("Something went wrong. Please try again.");
        }
    };


    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f3f3' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Admin Login</h1>


                <form onSubmit={handleSubmit}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    />


                    <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    />


                    {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}


                    <button
                        type="submit"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', background: '#333', color: 'white' }}
                    >
                    Login
                    </button>
                </form>
            </div>
        </div>
    );
};