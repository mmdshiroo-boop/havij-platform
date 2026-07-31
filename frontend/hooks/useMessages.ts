"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { messageApi, Conversation, Message } from "@/services/api/message.api";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [reactions, setReactions] = useState<Record<string, any[]>>({});
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  // نگهداری آخرین مقدار selectedConversation برای استفاده در رویدادهای Socket
  const selectedConversationRef = useRef<string | null>(null);

  // به‌روزرسانی ref هر بار که selectedConversation تغییر کرد
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // دریافت لیست گفتگوها
  const fetchConversations = useCallback(async () => {
    try {
      const data = await messageApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // تابع toggleReaction که messageApi را صدا می‌زند
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await messageApi.toggleReaction(messageId, emoji);
      } catch (error) {
        console.error("Toggle reaction error:", error);
        toast.error("خطا در ثبت واکنش");
      }
    },
    [],
  );

  // دریافت پیام‌های یک گفتگو
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;
      setMessagesLoading(true);
      try {
        const data = await messageApi.getMessages(conversationId);
        setCurrentMessages(data);
        setSelectedConversation(conversationId);

        // دریافت واکنش‌ها (در صورت نیاز می‌توان بهینه کرد)
        const reactionsData: Record<string, any[]> = {};
        await Promise.all(
          data.map(async (msg: any) => {
            try {
              const res = await messageApi.getReactions(msg._id);
              reactionsData[msg._id] = res.data || [];
            } catch {}
          }),
        );
        setReactions(reactionsData);

        if (socket) {
          socket.emit("join-conversation", conversationId);
        }

        try {
          await messageApi.markAsRead(conversationId);
        } catch (readError) {
          console.warn("Could not mark as read:", readError);
        }
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        // نمایش خطا به کاربر فقط در صورت عدم وجود ۴۰۴ (گفتگو حذف شده)
        if (error?.response?.status !== 404) {
          toast.error("خطا در دریافت پیام‌ها");
        }
      } finally {
        setMessagesLoading(false);
      }
    },
    [socket],
  );

  // اتصال Socket و ثبت رویدادها (فقط یک بار)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const baseUrl = apiUrl.replace("/api", "");

    const socketInstance = io(baseUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    // ثبت همه رویدادها
    socketInstance.on("new-message", (data) => {
      fetchConversations();
      // بررسی با ref که آیا این پیام مربوط به گفتگوی باز است
      if (selectedConversationRef.current === data.conversation?._id) {
        setCurrentMessages((prev) => {
          if (prev.some((msg) => msg._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
      }
    });

    socketInstance.on("message-edited", (data) => {
      setCurrentMessages((prev) =>
        prev.map((m) =>
          m._id === data.message._id ? { ...m, ...data.message } : m,
        ),
      );
    });

    socketInstance.on("message-deleted", (data) => {
      setCurrentMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? { ...m, deletedAt: new Date().toISOString() }
            : m,
        ),
      );
    });

    socketInstance.on("reaction-added", (data) => {
      setReactions((prev) => ({
        ...prev,
        [data.messageId]: [...(prev[data.messageId] || []), data.reaction],
      }));
    });

    socketInstance.on("reaction-updated", (data) => {
      setReactions((prev) => ({
        ...prev,
        [data.messageId]: prev[data.messageId]?.map((r: any) =>
          r._id === data.reaction._id ? data.reaction : r,
        ),
      }));
    });

    socketInstance.on("reaction-removed", (data) => {
      setReactions((prev) => ({
        ...prev,
        [data.messageId]: prev[data.messageId]?.filter(
          (r: any) => !(r.user === data.userId && r.emoji === data.emoji),
        ),
      }));
    });

    socketInstance.on("user-typing", (data) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: "در حال تایپ...",
      }));
    });

    socketInstance.on("user-stop-typing", (data) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[data.conversationId];
        return next;
      });
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected");
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []); // وابستگی خالی – فقط یک بار اجرا می‌شود

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      const newMessage = await messageApi.sendMessage(conversationId, content);
      await fetchConversations();
      if (selectedConversationRef.current === conversationId) {
        setCurrentMessages((prev) => {
          if (prev.some((msg) => msg._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }
      return newMessage;
    } catch (error) {
      toast.error("خطا در ارسال پیام");
      throw error;
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const updated = await messageApi.editMessage(messageId, newContent);
      setCurrentMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, ...updated } : m)),
      );
      toast.success("پیام ویرایش شد");
    } catch (error) {
      toast.error("خطا در ویرایش پیام");
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await messageApi.deleteMessage(messageId);
      setCurrentMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, deletedAt: new Date().toISOString() }
            : m,
        ),
      );
      toast.success("پیام حذف شد");
    } catch (error) {
      toast.error("خطا در حذف پیام");
    }
  };

  const uploadFile = async (
    conversationId: string,
    file: File,
    text?: string,
    onProgress?: (percent: number) => void,
  ) => {
    try {
      const newMessage = await messageApi.uploadFile(
        conversationId,
        file,
        text,
        onProgress,
      );
      if (selectedConversationRef.current === conversationId) {
        setCurrentMessages((prev) => [...prev, newMessage]);
      }
      await fetchConversations();
      return newMessage;
    } catch (error) {
      toast.error("خطا در ارسال فایل");
      throw error;
    }
  };

  const removeConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    if (selectedConversationRef.current === conversationId) {
      setSelectedConversation(null);
      setCurrentMessages([]);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await messageApi.markAsRead(conversationId);
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv,
        ),
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  return {
    conversations,
    currentMessages,
    loading,
    messagesLoading,
    selectedConversation,
    socket,
    typingUsers,
    reactions,
    removeConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    uploadFile,
    toggleReaction,
    markAsRead,
    setSelectedConversation,
  };
}
