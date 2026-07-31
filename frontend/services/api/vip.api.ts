import apiClient from "./client";

export interface VipPlan {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  discount: number;
  isPopular: boolean;
}

export interface VipStats {
  totalAds: number;
  activeAds: number;
  expiredAds: number;
  views: number;
  clicks: number;
}

export interface CurrentPlan {
  planId: string;
  name: string;
  price: number;
  adLimit: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
}

export const vipApi = {
  async getPlans(): Promise<VipPlan[]> {
    const response = await apiClient.get("/vip/plans");
    return response.data.data;
  },
  async getCurrentPlan(): Promise<CurrentPlan> {
    const response = await apiClient.get("/vip/current-plan");
    return response.data.data;
  },
  async getStats(): Promise<VipStats> {
    const response = await apiClient.get("/vip/stats");
    return response.data.data;
  },
  async upgrade(planId: string): Promise<{ paymentUrl: string }> {
    const response = await apiClient.post("/vip/upgrade", { planId });
    return response.data;
  },
  async getVipSubscription() {
    const response = await apiClient.get("/users/vip/subscription");
    return response.data.data;
  },
  getAnalytics: async (adId: string, period: string) => {
    const response = await apiClient.get("/vip/analytics", {
      params: { adId, period },
    });
    return response.data;
  },
  upgradeRequest: async (planId: string) => {
    const res = await apiClient.post("/vip/upgrade-request", { planId });
    return res.data;
  },
  verifyPayment: async (planId: string, paymentId: string) => {
    const res = await apiClient.get("/vip/verify-payment", {
      params: { planId, paymentId },
    });
    return res.data;
  },
};
