// frontend/services/api/admin-panel.api.ts

import apiClient from "./client";

export interface AdminDashboardStats {
  totalUsers: number;
  totalAds: number;
  totalViews: number;
  pendingAds: number;
  activeUsers: number;
  publishedAds: number;
  userGrowth: number;
  adGrowth: number;
}

export interface AdminPanelStats {
  totalUsers: number;
  totalAds: number;
  totalProperties: number;
  pendingAds: number;
  pendingProperties: number;
  totalReports: number;
  todayAds: number;
  todayUsers: number;
}

export interface AdminUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface RoleData {
  _id: string;
  name: string;
  label: string;
  permissions: string[];
  isActive: boolean;
  usersCount: number;
}

export const ALL_PERMISSIONS = [
  {
    group: "آگهی‌ها",
    items: [
      { key: "ads:read", label: "مشاهده آگهی‌ها" },
      { key: "ads:write", label: "ایجاد و ویرایش آگهی" },
      { key: "ads:approve", label: "تأیید / رد آگهی" },
      { key: "ads:delete", label: "حذف آگهی" },
    ],
  },
  {
    group: "کاربران",
    items: [
      { key: "users:read", label: "مشاهده کاربران" },
      { key: "users:write", label: "ویرایش کاربران" },
      { key: "users:ban", label: "مسدود / رفع مسدودیت" },
      { key: "users:delete", label: "حذف کاربران" },
    ],
  },
  {
    group: "گزارشات",
    items: [
      { key: "reports:read", label: "مشاهده گزارشات" },
      { key: "reports:handle", label: "مدیریت گزارشات" },
    ],
  },
  {
    group: "تیکت‌ها",
    items: [
      { key: "tickets:read", label: "مشاهده تیکت‌ها" },
      { key: "tickets:write", label: "پاسخ به تیکت‌ها" },
    ],
  },
];

export const adminPanelApi = {
  // ==================== آمار داشبورد ====================
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const [usersRes, adsRes, pendingRes] = await Promise.all([
      apiClient.get("/users/admin/all", { params: { limit: 1 } }),
      apiClient.get("/ads/admin/all", { params: { limit: 1 } }),
      apiClient.get("/ads/admin/pending", { params: { limit: 1 } }),
    ]);
    const totalUsers = usersRes.data?.pagination?.total ?? 0;
    const totalAds = adsRes.data?.pagination?.total ?? 0;
    const pendingAds = pendingRes.data?.pagination?.total ?? 0;
    const allAds = adsRes.data?.data || [];
    const totalViews = allAds.reduce(
      (sum: number, ad: any) => sum + (ad.views || 0),
      0,
    );
    return {
      totalUsers,
      totalAds,
      totalViews,
      pendingAds,
      activeUsers: totalUsers,
      publishedAds: totalAds - pendingAds,
      userGrowth: 0,
      adGrowth: 0,
    };
  },

  // ==================== آمار گزارشات ====================
  getStats: async (): Promise<AdminPanelStats> => {
    const [usersRes, adsRes, pendingRes] = await Promise.all([
      apiClient.get("/users/admin/all", { params: { limit: 1 } }),
      apiClient.get("/ads/admin/all", { params: { limit: 1 } }),
      apiClient.get("/ads/admin/pending", { params: { limit: 1 } }),
    ]);
    const totalUsers = usersRes.data?.pagination?.total ?? 0;
    const totalAds = adsRes.data?.pagination?.total ?? 0;
    const pendingAds = pendingRes.data?.pagination?.total ?? 0;

    let todayAds = 0,
      todayUsers = 0;
    const today = new Date().toISOString().split("T")[0];
    try {
      const todayAdsRes = await apiClient.get("/ads/admin/all", {
        params: { limit: 1, startDate: today, endDate: today },
      });
      todayAds = todayAdsRes.data?.pagination?.total ?? 0;
    } catch {}
    try {
      const todayUsersRes = await apiClient.get("/users/admin/all", {
        params: { limit: 1, startDate: today, endDate: today },
      });
      todayUsers = todayUsersRes.data?.pagination?.total ?? 0;
    } catch {}

    return {
      totalUsers,
      totalAds,
      totalProperties: 0,
      pendingAds,
      pendingProperties: 0,
      totalReports: 0,
      todayAds,
      todayUsers,
    };
  },

  // ==================== کاربران ====================
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) => {
    const response = await apiClient.get("/users/admin/all", { params });
    return {
      data: response.data?.data || [],
      pagination: response.data?.pagination || {},
    };
  },
  updateUserRole: async (id: string, role: string) =>
    apiClient.put(`/users/admin/${id}/role`, { role }),
  banUser: async (id: string, reason?: string) =>
    apiClient.put(`/users/admin/${id}/ban`, { banReason: reason }),
  unbanUser: async (id: string) => apiClient.put(`/users/admin/${id}/unban`),
  deleteUser: async (id: string) => apiClient.delete(`/users/admin/${id}`),

  // ==================== آگهی‌ها ====================
  getAllAds: async (params?: any) => {
    const response = await apiClient.get("/ads/admin/all", { params });
    return {
      data: response.data?.data || [],
      pagination: response.data?.pagination || {},
    };
  },
  getPendingAds: async (params?: any) => {
    const response = await apiClient.get("/ads/admin/pending", { params });
    return {
      data: response.data?.data || [],
      pagination: response.data?.pagination || {},
    };
  },
  getApprovedAds: async (params?: any) => {
    const response = await apiClient.get("/ads/admin/approved", { params });
    return {
      data: response.data?.data || [],
      pagination: response.data?.pagination || {},
    };
  },
  getRejectedAds: async (params?: any) => {
    const response = await apiClient.get("/ads/admin/rejected", { params });
    return {
      data: response.data?.data || [],
      pagination: response.data?.pagination || {},
    };
  },
  approveAd: async (id: string) => apiClient.post(`/ads/admin/${id}/approve`),
  rejectAd: async (id: string, reason?: string) =>
    apiClient.post(`/ads/admin/${id}/reject`, { reason }),
  deleteAd: async (id: string) => apiClient.delete(`/ads/${id}`),

  // ==================== دانلود گزارشات ====================
  downloadExcelReport: async (options?: Record<string, any>) => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    // افزودن فیلترهای ارسالی از صفحه
    if (options) {
      if (options.status) params.set("status", options.status);
      if (options.search) params.set("search", options.search);
      if (options.days) params.set("days", String(options.days));
    }

    const url = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
    }/admin/reports/excel?${params.toString()}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `گزارش-ادمین-${Date.now()}.xlsx`);
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return Promise.resolve();
  },

  downloadPdfReport: async (options?: Record<string, any>) => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    // افزودن فیلترهای ارسالی از صفحه
    if (options) {
      if (options.status) params.set("status", options.status);
      if (options.search) params.set("search", options.search);
      if (options.days) params.set("days", String(options.days));
    }

    const url = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
    }/admin/reports/pdf?${params.toString()}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `گزارش-ادمین-${Date.now()}.pdf`);
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return Promise.resolve();
  },

  // ==================== نقش‌ها ====================
  getRolesWithUserCount: async (): Promise<RoleData[]> => {
    try {
      const [rolesRes, statsRes] = await Promise.all([
        apiClient.get("/admin/roles"),
        apiClient.get("/admin/stats"),
      ]);
      const roles = rolesRes.data?.data || [];
      const byRole = statsRes.data?.data?.users?.byRole || {};
      return roles.map((role: any) => ({
        _id: role._id,
        name: role.name,
        label: role.name,
        permissions: role.permissions || [],
        isActive: role.isActive !== false,
        usersCount: byRole[role.name] || 0,
      }));
    } catch (error: any) {
      console.warn("Could not fetch roles, returning empty list", error);
      return [];
    }
  },

  updateRolePermissions: async (id: string, permissions: string[]) => {
    return apiClient.put(`/admin/roles/${id}`, { permissions });
  },
};