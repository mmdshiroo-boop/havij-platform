import apiClient from "./client";
import { Ad, CreateAdData, Amenities, AdditionalProperty } from "@/types";

// ⬅️ دوباره export کن تا بقیه بتونن از اینجا بگیرن
export type { Ad, CreateAdData };

export interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    filename: string;
    size: number;
  };
  message: string;
}

export const adsApi = {
  getMyAds: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await apiClient.get("/ads/my", { params });
    return { data: response.data.data, pagination: response.data.pagination };
  },
  getAll: async (params?: any) => {
    const response = await apiClient.get("/ads", { params });
    return { data: response.data.data, pagination: response.data.pagination };
  },
  advancedSearch: async (params?: any) => {
    const response = await apiClient.get("/ads/search/advanced", { params });
    return { data: response.data.data, pagination: response.data.pagination };
  },
  getSearchFilters: async () => {
    try {
      const response = await apiClient.get("/ads/search/filters");
      return response.data.data;
    } catch (error) {
      console.error("Error getting search filters:", error);
      return {
        cities: [],
        categories: [],
        priceRange: { min: 0, max: 1000000000 },
      };
    }
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/ads/${id}`);
    return response.data;
  },
  getUserAds: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get("/ads/user/me", { params });
    return response.data;
  },
  getCategoryNames: async (): Promise<string[]> => {
    const response = await apiClient.get("/ads/category-names");
    return response.data.data;
  },
  create: async (data: Partial<CreateAdData>) => {
    const payload = { ...data, categoryId: data.categoryId };
    const response = await apiClient.post("/ads", payload);
    return response.data;
  },
  update: async (id: string, data: Partial<Ad>) => {
    const response = await apiClient.put(`/ads/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/ads/${id}`);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/ads/${id}/status`, { status });
    return response.data;
  },
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post("/ads/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });
    return response.data;
  },
  deleteImage: async (
    filename: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/ads/image/${filename}`);
    return response.data;
  },
  uploadMultipleImages: async (
    files: File[],
  ): Promise<{ urls: string[]; filenames: string[] }> => {
    const uploadPromises = files.map((file) => adsApi.uploadImage(file));
    const results = await Promise.all(uploadPromises);
    return {
      urls: results.map((r) => r.data.url),
      filenames: results.map((r) => r.data.filename),
    };
  },
};

export const favoritesApi = {
  getFavorites: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get("/favorites", { params });
    return response.data;
  },
  addFavorite: async (adId: string) => {
    const response = await apiClient.post("/favorites", { adId });
    return response.data;
  },
  removeFavorite: async (adId: string) => {
    const response = await apiClient.delete(`/favorites/${adId}`);
    return response.data;
  },
  checkFavorite: async (adId: string) => {
    const response = await apiClient.get(`/favorites/check/${adId}`);
    return response.data;
  },
};
