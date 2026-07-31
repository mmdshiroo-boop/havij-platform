// frontend/services/api/agent.api.ts
import apiClient from "./client"; // ← استفاده از apiClient اصلی پروژه

export interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationalCode: string;
  role: string;
  agencyId: string;
  propertiesCount: number;
  status: "active" | "inactive";
  joinedAt: string;
  lastLogin?: string;
}

export interface AgentStats {
  properties: {
    total: number;
    active: number;
    sold: number;
    pending: number;
    expired: number;
  };
  views: { total: number; averagePerProperty: number };
  leads: {
    total: number;
    new: number;
    converted: number;
    conversionRate: number;
  };
  revenue: { total: number; commission: number; averagePerSale: number };
  topProperties: Array<{
    id: string;
    title: string;
    views: number;
    leads: number;
    status: string;
  }>;
}

export interface CreateAgentData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationalCode: string;
  password?: string;
}

export const agentApi = {
  // ─── دریافت آمار داشبورد (اصلاح مسیر) ───
  getStats: async (): Promise<AgentStats> => {
    const response = await apiClient.get("/agents/stats"); // ← مسیر درست
    return response.data.data;
  },

  // ─── دریافت لیست مشاوران ───
  getAgents: async (): Promise<Agent[]> => {
    const response = await apiClient.get("/agents/agency");
    return response.data.data;
  },

  // ─── دریافت یک مشاور ───
  getById: async (id: string): Promise<Agent> => {
    const response = await apiClient.get(`/agents/${id}`);
    return response.data.data;
  },

  // ─── ایجاد مشاور جدید ───
  create: async (data: CreateAgentData): Promise<Agent> => {
    const response = await apiClient.post("/agents", data);
    return response.data.data;
  },

  // ─── ویرایش مشاور ───
  update: async (
    id: string,
    data: Partial<CreateAgentData>,
  ): Promise<Agent> => {
    const response = await apiClient.put(`/agents/${id}`, data);
    return response.data.data;
  },

  // ─── حذف مشاور ───
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/agents/${id}`);
  },

  // ─── تغییر وضعیت مشاور ───
  toggleStatus: async (id: string): Promise<Agent> => {
    const response = await apiClient.patch(`/agents/${id}/toggle-status`);
    return response.data.data;
  },

  // ─── گزارشات ───
  getReports: async (limit: number = 30) => {
    const response = await apiClient.get(`/agents/reports/list?limit=${limit}`);
    return response.data.data;
  },

  getReportByRange: async (startDate: string, endDate: string) => {
    const response = await apiClient.get(
      `/agents/reports/range?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data.data;
  },

  generateDailyReport: async () => {
    const response = await apiClient.post("/agents/reports/daily");
    return response.data.data;
  },

  // ─── دانلود گزارش (اکسل) ───
  downloadReportExcel: async () => {
    const response = await apiClient.get("/agents/report/excel", {
      // ✅ اصلاح شد
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "agents-report.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // ─── دانلود گزارش (PDF) ───
  downloadReportPDF: async () => {
    const response = await apiClient.get("/agents/report/pdf", {
      // ✅ اصلاح شد
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "agents-report.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
 
};
