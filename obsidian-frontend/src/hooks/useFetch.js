import { useState, useEffect, useCallback } from 'react';

const BASE_URL = "http://localhost:3001";

export function useFetch(path, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsStr = JSON.stringify(options);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchOpts = JSON.parse(optionsStr);
      const token = localStorage.getItem("session_token");
      const res = await fetch(`${BASE_URL}${path}`, {
        ...fetchOpts,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...fetchOpts.headers,
        },
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Request failed");
      }

      setData(responseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path, optionsStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Export a separate function for one-time fetches
export async function fetchApi(path, options = {}) {
  const token = localStorage.getItem("session_token");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}
