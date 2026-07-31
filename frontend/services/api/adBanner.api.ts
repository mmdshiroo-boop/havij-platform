// services/api/adBanner.api.ts

import apiClient from "./client";

export interface AdBanner {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  position: string;
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  clicks: number;
  views: number;
}

export const adBannerApi = {
  // دریافت بنر بر اساس موقعیت
  getByPosition: async (position: string): Promise<AdBanner[]> => {
    const response = await apiClient.get(`/ad-banners/${position}`);
    return response.data.data;
  },

  // ثبت بازدید
  trackView: async (id: string): Promise<void> => {
    await apiClient.post(`/ad-banners/${id}/view`);
  },

  // ثبت کلیک
  trackClick: async (id: string): Promise<void> => {
    await apiClient.post(`/ad-banners/${id}/click`);
  },

  // ============ مدیریت (ادمین) ============
  getAll: async (): Promise<AdBanner[]> => {
    const response = await apiClient.get("/ad-banners/admin/all");
    return response.data.data;
  },

  create: async (data: Partial<AdBanner>): Promise<AdBanner> => {
    const response = await apiClient.post("/ad-banners/admin", data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<AdBanner>): Promise<AdBanner> => {
    const response = await apiClient.put(`/ad-banners/admin/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/ad-banners/admin/${id}`);
  },
};
