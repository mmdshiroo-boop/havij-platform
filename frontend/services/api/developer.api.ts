import apiClient from "./client"; // استفاده از apiClient سراسری

export interface DashboardStats {
  totalRequests: number;
  activeKeys: number;
  webhooks: number;
  successRate: number;
  totalUsers: number;
  totalAds: number;
  totalViews: number;
  pendingAds: number;
  serverUptime: string;
  databaseSize: string;
  cpuUsage: number;
  memoryUsage: number;
}

// ==================== Log Types ====================
export interface LogEntry {
  _id: string; // شناسه MongoDB
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  error?: string;
  apiKeyName?: string;
  timestamp: string;
}

export interface LogPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface LogAnalytics {
  summary: {
    totalRequests: number;
    successCount: number;
    error4xx: number;
    error5xx: number;
    avgResponseTime: number;
  };
  endpointStats: {
    endpoint: string;
    method: string;
    count: number;
    avgResponseTime: number;
    errorCount: number;
  }[];
  errorStats: {
    statusCode: number;
    endpoint: string;
    count: number;
    lastError?: string;
  }[];
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };
  topConsumers: {
    ip: string;
    apiKeyName: string | null;
    count: number;
    avgResponseTime: number;
    uniqueEndpoints: number;
  }[];
  timeSeries: {
    time: string;
    count: number;
    avgResponseTime: number;
    errorCount: number;
  }[];
  methodStats: {
    method: string;
    count: number;
    avgResponseTime: number;
  }[];
}

export const developerApi = {
  getServicesStatus: () => apiClient.get("/developer/services-status"),
  // داشبورد
  getDashboardStats: () =>
    apiClient.get<DashboardStats>("/developer/dashboard/stats"),

  // مدیریت API Key
  getApiKeys: () => apiClient.get("/developer/api-keys"),
  createApiKey: (data: {
    name: string;
    scopes: string[];
    expiresInDays?: number;
  }) => apiClient.post("/developer/api-keys", data),
  updateApiKey: (
    id: string,
    data: { name?: string; scopes?: string[]; status?: string },
  ) => apiClient.patch(`/developer/api-keys/${id}`, data),
  deleteApiKey: (id: string) => apiClient.delete(`/developer/api-keys/${id}`),
  regenerateApiKey: (id: string) =>
    apiClient.post(`/developer/api-keys/${id}/regenerate`),

  // لاگ‌ها
  getLogs: (params?: {
    page?: number;
    limit?: number;
    method?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    apiClient.get<{ logs: LogEntry[]; pagination: LogPagination }>(
      "/developer/logs",
      { params },
    ),

  getLogAnalytics: (days?: number) =>
    apiClient.get<LogAnalytics>("/developer/logs/analytics", {
      params: days ? { days } : {},
    }),

  clearLogs: (beforeDays?: number) =>
    apiClient.delete("/developer/logs", {
      params: beforeDays ? { beforeDays } : {},
    }),
};
