// frontend/services/api/consulting.api.ts
import apiClient from "./client";

export interface ConsultingRequest {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  subject: string;
  message?: string;
  preferredDate?: string;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultingData {
  firstName: string;
  lastName: string;
  phone: string;
  subject: string;
  message?: string;
  preferredDate?: string;
}

export const consultingApi = {
  /**
   * ثبت درخواست مشاوره جدید (عمومی - بدون نیاز به لاگین)
   * POST /api/consulting
   */
  create: async (
    data: CreateConsultingData,
  ): Promise<{
    success: boolean;
    data: ConsultingRequest;
    message: string;
  }> => {
    const response = await apiClient.post("/consulting", data);
    return response.data;
  },

  /**
   * دریافت درخواست‌های مشاوره کاربر جاری (نیاز به لاگین)
   * GET /api/consulting/my
   */
  getMyRequests: async (status?: string): Promise<ConsultingRequest[]> => {
    const params: any = {};
    if (status && status !== "all") params.status = status;

    const response = await apiClient.get("/consulting/my", { params });
    return response.data.data;
  },
  /**
   * دریافت همه درخواست‌های مشاوره (کارشناس/ادمین)
   * GET /api/consulting
   */
  getAll: async (
    status?: string,
    search?: string,
    page: number = 1,
  ): Promise<{ data: ConsultingRequest[]; pagination: any }> => {
    const params: any = { page, limit: 20 };
    if (status && status !== "all") params.status = status;
    if (search) params.search = search;
    const response = await apiClient.get("/consulting", { params });
    return response.data;
  },
  remove: async (id: string) => {
    const response = await apiClient.delete(`/consulting/${id}`);
    return response.data;
  },
  /**
   * تغییر وضعیت یک درخواست (کارشناس/ادمین)
   * PATCH /api/consulting/:id/status
   */
  updateStatus: async (
    id: string,
    status: string,
  ): Promise<ConsultingRequest> => {
    const response = await apiClient.patch(`/consulting/${id}/status`, {
      status,
    });
    return response.data.data;
  },
};
