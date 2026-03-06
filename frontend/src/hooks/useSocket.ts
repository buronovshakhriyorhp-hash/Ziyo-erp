import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Ishlab chiqarishda o'zgartiriladi
const SOCKET_URL =
  (import.meta as any).env?.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:3000";

export function useSocket(event?: string, callback?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Socket.io ulanishini o'rnatish
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // Fallback polling
    });

    socketRef.current.on("connect", () => {
      console.log("✅ WebSockets ulandi");
    });

    socketRef.current.on("disconnect", () => {
      console.warn("❌ WebSockets uzildi");
    });

    // Agar event va callback berilgan bo'lsa ularni eshitamiz
    if (event && callback) {
      socketRef.current.on(event, callback);
    }

    return () => {
      if (event && callback) {
        socketRef.current?.off(event, callback);
      }
      // Komponent o'chganda ulanishni yopish
      socketRef.current?.disconnect();
    };
  }, [event, callback]);

  return socketRef.current;
}
