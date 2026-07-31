// frontend/services/api/report.api.ts
import apiClient from "./client";

// ==================== تایپ‌ها (هماهنگ با پاسخ بک‌اند) ====================

export interface AgencyStats {
  totalProperties: number;
  totalAgents: number;
  totalViews: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeProperties: number;
  soldProperties: number;
  pendingProperties: number;
  avgPrice: number;
  // فیلدهای اضافه از بک‌اند
  currentMonthSales?: number;
  currentMonthRevenue?: number;
}

export interface MonthlyData {
  month: string;
  deals: number; // نام در فرانت
  sales?: number; // نام در بک‌اند (یکی از این دو)
  revenue: number;
  views: number;
}

export interface AgentPerformance {
  _id: string;
  name: string;
  propertiesCount: number;
  totalViews: number;
  totalRevenue: number;
  soldCount?: number;
  status: string;
  phone?: string;
  email?: string;
}

export interface FullReport {
  summary: {
    totalProperties: number;
    totalAgents: number;
    totalViews: number;
    totalRevenue: number;
  };
  statusDistribution: {
    active: number;
    sold: number;
    pending: number;
  };
  typeDistribution: {
    apartment: number;
    villa: number;
    commercial: number;
    office: number;
    land: number;
  };
  topCities: Array<{ city: string; count: number }>;
  properties: Array<{
    _id: string;
    title: string;
    price: number;
    city: string;
    status: string;
    views: number;
    createdAt: string;
  }>;
}

// ==================== API ====================
// بک‌اند همه داده‌ها رو از یک endpoint برمی‌گردونه: GET /agents/reports
// این فایل اون داده‌ها رو به شکل‌های مختلف بر می‌گردونه

export const reportApi = {
  // دریافت آمار کلی آژانس
  // بک‌اند: GET /agents/reports → data.summary
  getStats: async (year?: number): Promise<AgencyStats> => {
    const params = year ? { year } : {};
    const response = await apiClient.get("/agents/reports", { params });
    const d = response.data.data;

    return {
      totalProperties: d.summary.totalProperties ?? 0,
      activeProperties: d.summary.activeProperties ?? 0,
      soldProperties: d.summary.soldProperties ?? 0,
      pendingProperties: d.summary.pendingProperties ?? 0,
      totalViews: d.summary.totalViews ?? 0,
      totalRevenue: d.summary.totalRevenue ?? 0,
      totalAgents: d.agentsPerformance?.length ?? 0,
      monthlyGrowth: d.summary.monthlyGrowth ?? 0,
      avgPrice:
        d.summary.totalProperties > 0
          ? Math.round(d.summary.totalRevenue / d.summary.totalProperties)
          : 0,
      currentMonthSales: d.summary.currentMonthSales ?? 0,
      currentMonthRevenue: d.summary.currentMonthRevenue ?? 0,
    };
  },

  // دریافت داده‌های ماهانه
  // بک‌اند: GET /agents/reports → data.monthlyData
  getMonthlyPerformance: async (year?: number): Promise<MonthlyData[]> => {
    const params = year ? { year } : {};
    const response = await apiClient.get("/agents/reports", { params });
    const monthlyData = response.data.data.monthlyData ?? [];

    // بک‌اند فیلد "sales" می‌فرسته، فرانت "deals" می‌خواد — هر دو رو پر می‌کنیم
    return monthlyData.map((item: any) => ({
      month: item.month,
      deals: item.sales ?? item.deals ?? 0,
      sales: item.sales ?? item.deals ?? 0,
      revenue: item.revenue ?? 0,
      views: item.views ?? 0,
    }));
  },

  // دریافت عملکرد مشاوران
  // بک‌اند: GET /agents/reports → data.agentsPerformance
  getAgentsPerformance: async (): Promise<AgentPerformance[]> => {
    const response = await apiClient.get("/agents/reports");
    const agents = response.data.data.agentsPerformance ?? [];

    return agents.map((agent: any) => ({
      _id: agent._id,
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      propertiesCount: agent.propertiesCount ?? 0,
      soldCount: agent.soldCount ?? 0,
      totalViews: agent.totalViews ?? 0,
      totalRevenue: agent.totalRevenue ?? 0,
      status: agent.status,
    }));
  },

  // دریافت گزارش کامل (برای export CSV)
  // بک‌اند: GET /agents/reports → همه داده‌ها
  getFullReport: async (): Promise<FullReport> => {
    const response = await apiClient.get("/agents/reports");
    const d = response.data.data;

    return {
      summary: {
        totalProperties: d.summary.totalProperties ?? 0,
        totalAgents: d.agentsPerformance?.length ?? 0,
        totalViews: d.summary.totalViews ?? 0,
        totalRevenue: d.summary.totalRevenue ?? 0,
      },
      statusDistribution: {
        active: d.summary.activeProperties ?? 0,
        sold: d.summary.soldProperties ?? 0,
        pending: d.summary.pendingProperties ?? 0,
      },
      typeDistribution: {
        apartment: 0,
        villa: 0,
        commercial: 0,
        office: 0,
        land: 0,
      },
      topCities: [],
      properties: (d.recentSoldProperties ?? []).map((p: any) => ({
        _id: p._id,
        title: p.title,
        price: p.price ?? 0,
        city: p.city ?? "",
        status: p.status ?? "",
        views: p.views ?? 0,
        createdAt: p.createdAt ?? "",
      })),
    };
  },
};
