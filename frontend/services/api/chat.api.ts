// frontend/services/api/chat.api.ts
import apiClient from "./client";

export interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
}

export interface Conversation {
  _id: string;
  otherUser: ChatUser;
  ad?: { _id: string; title: string };
  lastMessage?: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  content: string;
  type: "text" | "image" | "file";
  readBy: string[];
  createdAt: string;
}

export const chatApi = {
  // دریافت لیست گفتگوها
  getConversations: async (): Promise<Conversation[]> => {
    const res = await apiClient.get("/conversations");
    return res.data.data;
  },

  // ایجاد یا دریافت یک گفتگو
  createConversation: async (
    participantId: string,
    adId?: string,
  ): Promise<Conversation> => {
    const res = await apiClient.post("/conversations", {
      participantId,
      ...(adId ? { adId } : {}),
    });
    return res.data.data;
  },

  // دریافت پیام‌های یک گفتگو
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const res = await apiClient.get(
      `/conversations/${conversationId}/messages`,
    );
    return res.data.data;
  },

  // ارسال پیام
  sendMessage: async (
    conversationId: string,
    content: string,
  ): Promise<Message> => {
    const res = await apiClient.post(
      `/conversations/${conversationId}/messages`,
      { content },
    );
    return res.data.data;
  },

  // علامت‌گذاری پیام‌ها به‌عنوان خوانده‌شده
  markAsRead: async (conversationId: string): Promise<void> => {
    await apiClient.patch(`/conversations/${conversationId}/read`);
  },
};
