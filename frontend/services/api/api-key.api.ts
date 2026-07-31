// frontend/services/api/api-key.service.ts
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor برای اضافه کردن توکن
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: "active" | "inactive" | "expired";
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  requestCount: number;
}

export const apiKeyService = {
  async getApiKeys(): Promise<ApiKey[]> {
    const { data } = await apiClient.get("/developer/api-keys");
    return data;
  },

  async createApiKey(data: {
    name: string;
    scopes: string[];
    expiresInDays?: number;
  }) {
    const { data: result } = await apiClient.post("/developer/api-keys", data);
    return result;
  },

  async updateApiKey(id: string, data: Partial<ApiKey>) {
    const { data: result } = await apiClient.patch(
      `/developer/api-keys/${id}`,
      data,
    );
    return result;
  },

  async deleteApiKey(id: string) {
    await apiClient.delete(`/developer/api-keys/${id}`);
  },

  async regenerateApiKey(id: string) {
    const { data } = await apiClient.post(
      `/developer/api-keys/${id}/regenerate`,
    );
    return data;
  },
};
