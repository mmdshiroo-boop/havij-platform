// frontend/hooks/useSocketNotifications.ts
"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Notification } from "@/services/api/notification.api";

export function useSocketNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
    });

    socketInstance.on("new-notification", (notification: Notification) => {
      console.log("📢 New notification received:", notification);
      setNewNotification(notification);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      // اگر خطای احراز هویت بود، می‌توانید کاربر را به لاگین هدایت کنید
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearNewNotification = () => {
    setNewNotification(null);
  };

  return { socket, newNotification, clearNewNotification };
}