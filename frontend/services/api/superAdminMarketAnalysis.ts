// frontend/services/api/superAdminMarketAnalysis.ts
import api from "./client";

export interface MapAdItem {
  id: string;
  title: string;
  price: number;
  city: string;
  district?: string;
  status: string;
  adType: string;
  area?: number;
  images: string | null;
  latitude?: number;
  longitude?: number;
  views: number;
  isVip: boolean;
  isUrgent: boolean;
}

export interface DashboardStats {
  kpi: {
    totalAds: number;
    activeAds: number;
    pendingAds: number;
    soldAds: number;
    rejectedAds: number;
    expiredAds: number;
    avgPrice: number;
    totalViews: number;
  };
  lastUpdated: string;
}

// دریافت داده‌های نقشه
export const getMapAds = async (params?: any) => {
  const response = await api.get("/super-admin/market-analysis/map", {
    params,
  });
  return response.data;
};

// دریافت آمار داشبورد
export const getDashboardStats = async () => {
  const response = await api.get("/super-admin/market-analysis/dashboard");
  return response.data;
};

// دریافت آمار استانی
export const getProvinceStats = async () => {
  const response = await api.get("/super-admin/market-analysis/provinces");
  return response.data;
};

// جستجوی پیشرفته
export const advancedSearch = async (params?: any) => {
  const response = await api.get("/super-admin/market-analysis/search", {
    params,
  });
  return response.data;
};

// تغییر وضعیت گروهی
export const bulkUpdateStatus = async (data: any) => {
  const response = await api.post(
    "/super-admin/market-analysis/bulk-update",
    data,
  );
  return response.data;
};

// export داده‌ها
export const exportAdsData = async (
  filters?: any,
  format: "json" | "csv" = "json",
) => {
  const response = await api.post(
    `/super-admin/market-analysis/export?format=${format}`,
    filters,
    { responseType: format === "csv" ? "blob" : "json" },
  );
  return response.data;
};

export const getProvincesList = async () => {
  const { data } = await api.get("/super-admin/market-analysis/provinces-list");
  return data;
};

export const getCitiesByProvince = async (slug: string) => {
  const { data } = await api.get(`/super-admin/market-analysis/cities/${slug}`);
  return data;
};
