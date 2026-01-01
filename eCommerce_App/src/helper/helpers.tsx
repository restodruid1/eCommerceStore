import { useState, useEffect } from "react";
import { serverUrl } from "../pages/Home/Home";

export function useFetch<T>(url: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
  
    useEffect(() => {
      let cancelled = false;
  
      async function load() {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch ${url}`);
          const json = await res.json();
  
          if (!cancelled) setData(json);
        } catch (err) {
          if (!cancelled)
            setError(err instanceof Error ? err : new Error("Unknown error"));
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
  
      load();
      return () => {
        cancelled = true;
      };
    }, [url]);
  
    return { data, loading, error };
  }

  export const deleteReservedCartOnDB = async () => {
    try {
      const userId = localStorage.getItem("uuid");
      const response = await fetch(serverUrl ? serverUrl + `/session_status/deleteCartReservation` : "http://localhost:5000/session_status/deleteCartReservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uuid: userId,     
        }),
      });
      if (!response.ok) throw new Error("Failure to delete cart reservation");
      
      const data = await response.json();
      console.log("RESERVE STOCK DELETED? " + data.success);
    } catch (err) {
      console.error(err);
    } 
  }