import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data || { message: "Network error" });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    request,
    get: useCallback(
      (url, config) => request("GET", url, null, config),
      [request]
    ),
    post: useCallback(
      (url, data, config) => request("POST", url, data, config),
      [request]
    ),
    put: useCallback(
      (url, data, config) => request("PUT", url, data, config),
      [request]
    ),
    del: useCallback(
      (url, config) => request("DELETE", url, null, config),
      [request]
    ),
  };
};
