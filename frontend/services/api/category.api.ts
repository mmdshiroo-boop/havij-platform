// frontend/services/api/category.api.ts
import apiClient from "./client";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string;
  level: number;
  order: number;
  isActive: boolean;
  children?: Category[];
  subcategories?: Category[];
  ads?: any[];
}

export const categoryApi = {
  // دریافت همه دسته‌بندی‌ها
  getAll: async (): Promise<Category[]> => {
    try {
      console.log("🔍 Sending request to /categories");
      const response = await apiClient.get("/categories");
      console.log("✅ Response:", response.status, response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Category API Error:");
      console.error("   Message:", error.message);
      console.error("   Code:", error.code);
      console.error("   Status:", error.response?.status);
      console.error("   Data:", error.response?.data);
      console.error("   Config:", error.config?.url);
      throw error;
    }
  },

  // دریافت یک دسته با اسلاگ (مسیر اصلاح شده)
  getBySlug: async (slug: string): Promise<Category> => {
    // تغییر مسیر به /slug/:slug
    const response = await apiClient.get(`/categories/slug/${slug}`);
    return response.data.data;
  },

  // دریافت یک دسته با آیدی
  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data.data;
  },

  // ایجاد دسته‌بندی جدید (فقط ادمین)
  create: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post("/categories", data);
    return response.data.data;
  },

  // ویرایش دسته‌بندی (فقط ادمین)
  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data.data;
  },

  // حذف دسته‌بندی (فقط ادمین)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  // حذف دسته‌بندی با زیردسته‌ها (فقط ادمین)
  deleteWithChildren: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}/with-children`);
  },
};
