import { useEffect, useRef, useState } from "react";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Perbaiki URL dengan menambahkan path /ws/traffic
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    // Gunakan environment variable atau default
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5555";

    // Build WebSocket URL dengan path dan token
    const url = new URL(`${wsUrl}/ws/traffic`);

    // Add tokens as query parameters
    if (token) {
      url.searchParams.set("token", token);
    }
    if (refreshToken) {
      url.searchParams.set("refreshToken", refreshToken);
    }

    console.log("🔗 Connecting to WebSocket:", url.toString());

    const socket = new WebSocket(url.toString());
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);

      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    socket.onclose = (event) => {
      console.log("❌ WebSocket disconnected:", event.code, event.reason);
      setIsConnected(false);

      // Coba reconnect setelah 5 detik
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Reconnecting WebSocket...");
        // Re-run the effect
        setIsConnected(false);
        socketRef.current = null;
      }, 5000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 WebSocket message received:", data.type);
        setLastMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array = run once

  return {
    isConnected,
    lastMessage,
  };
}
