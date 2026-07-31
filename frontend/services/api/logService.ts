import apiClient from "./client";

export interface SystemLog {
  _id: string;
  level: "info" | "warning" | "error";
  message: string;
  source: string;
  details?: string;
  userId?: string;
  timestamp: string;
}

export interface GetLogsParams {
  page?: number;
  limit?: number;
  level?: string;
}

export const logService = {
  getLogs: async (params: GetLogsParams) => {
    const response = await apiClient.get("/super-admin/logs", { params }); // ✅ مسیر درست
    return response.data; // { success: true, data: [...] }
  },

  clearLogs: async () => {
    const response = await apiClient.delete("/super-admin/logs"); // ✅ مسیر درست
    return response.data;
  },
};