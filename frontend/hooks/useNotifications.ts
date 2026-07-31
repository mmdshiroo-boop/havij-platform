// frontend/hooks/useNotifications.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/services/api/notification.api";
import { toast } from "sonner";
import type { Notification } from "@/types"; // ✅ از تایپ مرکزی

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socketRef, setSocketRef] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(1, 20);
      const mapped: Notification[] = (data.notifications || []).map(
        (n: any) => ({
          ...n,
          read: n.isRead ?? n.read ?? false,
        }),
      );
      setNotifications(mapped);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchNotifications();

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    setSocketRef(socket);

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("new-notification", (newNotif: any) => {
      const notif: Notification = {
        ...newNotif,
        read: newNotif.isRead ?? newNotif.read ?? false,
      };
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // ✅ اصلاح: title به message
      toast(notif.message, {
        description: notif.message,
        duration: 4000,
        action: notif.link
          ? {
              label: "مشاهده",
              onClick: () => (window.location.href = notif.link!),
            }
          : undefined,
      });
    });

    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("همه اعلان‌ها خوانده شدند");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  const removeNotification = useCallback(
    async (id: string) => {
      try {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setUnreadCount((prev) => {
          const notif = notifications.find((n) => n._id === id);
          return notif && !notif.read ? Math.max(0, prev - 1) : prev;
        });
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    fetchNotifications,
    refresh,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}
