import apiClient from "./client";

export const cookieAuditService = {
  getLogs: async (params: any) => {
    const response = await apiClient.get("/super-admin/cookie-audits", {
      params,
    });
    return response.data;
  },
  getStats: async () => {
    const response = await apiClient.get("/super-admin/cookie-audits/stats");
    return response.data;
  },
  getDailyStats: async (days: number = 30) => {
    const res = await apiClient.get("/super-admin/cookie-audits/daily-stats", {
      params: { days },
    });
    return res.data.data; // آرایه‌ای از {_id, logins, suspicious}
  },
  getUserDetails: async (userId: string) => {
    const response = await apiClient.get(
      `/super-admin/cookie-audits/user-details/${userId}`,
    );
    return response.data;
  },
};
