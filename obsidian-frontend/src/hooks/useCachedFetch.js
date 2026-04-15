import { useState, useEffect, useCallback } from 'react';
import { cacheHelpers } from '../utils/cache';

const BASE_URL = "http://localhost:3001";

export function useCachedFetch(path, options = {}, cacheTTL = 300000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsStr = JSON.stringify(options);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchOpts = JSON.parse(optionsStr);
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cacheKey = `${path}_${optionsStr}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }
      
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

      // Cache the response
      const cacheKey = `${path}_${optionsStr}`;
      cache.set(cacheKey, responseData, cacheTTL);
      
      setData(responseData);
      return responseData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path, optionsStr, cacheTTL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, refresh: () => fetchData(true) };
}

// Export a separate function for one-time cached fetches
export async function cachedFetchApi(path, options = {}, cacheTTL = 300000) {
  const cacheKey = `${path}_${JSON.stringify(options)}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
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

  // Cache the response
  cache.set(cacheKey, data, cacheTTL);

  return data;
}

// Simple cache instance for this hook
const cache = {
  get: (key) => {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (parsed.ttl && Date.now() > parsed.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return parsed.data;
    } catch {
      return null;
    }
  },
  set: (key, value, ttl = 300000) => {
    try {
      const item = {
        data: value,
        ttl: ttl > 0 ? Date.now() + ttl : 0
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch {
      // Ignore localStorage errors
    }
  },
  delete: (key) => {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch {
      // Ignore localStorage errors
    }
  }
};
