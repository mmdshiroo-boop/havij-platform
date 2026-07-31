import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  status: "active" | "inactive" | "failed";
  lastTriggeredAt?: string;
  lastError?: string;
  deliveryCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
}

export const webhookService = {
  async getWebhooks(): Promise<Webhook[]> {
    const { data } = await apiClient.get("/developer/webhooks");
    return data;
  },

  async createWebhook(data: { name: string; url: string; events: string[] }) {
    const { data: result } = await apiClient.post("/developer/webhooks", data);
    return result;
  },

  async updateWebhook(id: string, data: Partial<Webhook>) {
    const { data: result } = await apiClient.patch(
      `/developer/webhooks/${id}`,
      data,
    );
    return result;
  },

  async deleteWebhook(id: string) {
    await apiClient.delete(`/developer/webhooks/${id}`);
  },

  async regenerateSecret(id: string) {
    const { data } = await apiClient.post(
      `/developer/webhooks/${id}/regenerate-secret`,
    );
    return data;
  },

  async testWebhook(id: string) {
    const { data } = await apiClient.post(`/developer/webhooks/${id}/test`);
    return data;
  },
};
