// frontend/services/api/analytics.ts
import apiClient from "./client";

export interface AdItem {
  id: string;
  title: string;
  views: number;
  contacts: number;
  bookmarks: number;
  status?: string;
  isVip?: boolean;
  city?: string;
  price?: number;
}

export interface ChartTimeline {
  name: string;
  بازدید: number;
  زنگ‌خور: number;
}

export interface UserAnalyticsResponse {
  hasVip: boolean;
  subscriptionDetails: { title: string; endDate: string } | null;
  totalViews: number;
  totalContacts: number;
  myAdsCount: number;
  adsList: AdItem[];
  chartTimeline: ChartTimeline[];
  adStatusSummary?: {
    active: number;
    pending: number;
    sold: number;
    expired: number;
  };
}

export const analyticsApi = {
  getUserOverview: async (
    adId: string = "all",
    period: string = "7",
  ): Promise<UserAnalyticsResponse> => {
    const response = await apiClient.get("/analytics/user-overview", {
      params: { adId, period },
    });
    return response.data.data;
  },
};
