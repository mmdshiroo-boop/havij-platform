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
  participants: ChatUser[];
  ad?: {
    _id: string;
    title: string;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt?: string;
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
  fileUrl?: string;
  readBy: string[];
  isEdited?: boolean;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
}

export const messageApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await apiClient.get("/conversations");
    return res.data.data;
  },

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

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const res = await apiClient.get(
      `/conversations/${conversationId}/messages`,
    );
    return res.data.data;
  },

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

  editMessage: async (messageId: string, content: string): Promise<Message> => {
    const res = await apiClient.put(`/messages/${messageId}`, { content });
    return res.data.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/${messageId}`);
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/conversations/${conversationId}`);
  },

  blockUser: async (blockedId: string): Promise<void> => {
    await apiClient.post("/users/block", { blockedId });
  },

  unblockUser: async (blockedId: string): Promise<void> => {
    await apiClient.post("/users/unblock", { blockedId });
  },

  isUserBlocked: async (blockedId: string): Promise<boolean> => {
    const res = await apiClient.get(`/users/is-blocked/${blockedId}`);
    return res.data.data;
  },

  uploadFile: async (
    conversationId: string,
    file: File,
    text?: string,
    onProgress?: (percent: number) => void,
  ): Promise<Message> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("content", text || "");

    const res = await apiClient.post(
      `/chat/upload/${conversationId}`,
      formData,
      {
        headers: {
          // 🔴 افزودن این هدر باعث بازنویسی هدر پیش‌فرض json شده و فایل به درستی ارسال می‌شود
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percent);
          }
        },
      },
    );
    return res.data.data;
  },

  getReactions: async (messageId: string) => {
    const res = await apiClient.get(`/messages/${messageId}/reactions`);
    return res.data;
  },

  toggleReaction: async (messageId: string, emoji: string) => {
    const res = await apiClient.post(`/messages/${messageId}/reactions`, {
      emoji,
    });
    return res.data;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await apiClient.patch(`/conversations/${conversationId}/read`);
  },
};
