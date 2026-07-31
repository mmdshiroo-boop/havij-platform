import apiClient from "./client"; // ← استفاده از apiClient اصلی

export interface SubscriptionPlan {
  _id: string;
  title: string;
  slug: string;
  price: number;
  durationDays: number;
  features: string[];
  targetRole: string;
}

export const subscriptionApi = {
  getPlans: async (role?: string): Promise<SubscriptionPlan[]> => {
    const params = role ? { role } : {};
    const { data } = await apiClient.get("/subscriptions/plans", { params });
    return data.data;
  },

  initiatePurchase: async (planSlug: string) => {
    const { data } = await apiClient.post("/subscriptions/purchase", {
      planSlug,
    });
    return data.data as { paymentUrl: string; authority: string };
  },

  verifyPayment: async (authority: string) => {
    const { data } = await apiClient.post("/subscriptions/verify", {
      authority,
    });
    return data.data;
  },

  checkStatus: async () => {
    const { data } = await apiClient.get("/subscriptions/status");
    return data.data as { isActive: boolean };
  },
};
