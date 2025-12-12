import { useState, useEffect } from "react";

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