import apiClient from "./client";

export interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  priceType: "sale" | "rent" | "mortgage";
  propertyType: "apartment" | "villa" | "office" | "commercial" | "land";
  city: string;
  district?: string;
  address: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  latitude?: number;
  longitude?: number;
  area: number;
  rooms: number;
  yearBuilt: number;
  images: string[];
  views: number;
  status: "active" | "pending" | "sold" | "rejected";
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  agentId?: string;
  agentName?: string;
}

export interface CreatePropertyData {
  title: string;
  price: number;
  priceType?: string;
  propertyType?: string;
  city: string;
  district?: string;
  address: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  latitude?: number;
  longitude?: number;
  area?: number;
  rooms?: number;
  yearBuilt?: number;
  description?: string;
  images?: string[];
  categoryId: string;
}

export interface PropertyApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const propertyApi = {
  /**
   * دریافت املاک آژانس (agent لاگین کرده)
   * GET /api/properties/agent
   */
  getAgentProperties: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PropertyApiResponse<Property[]>> => {
    const response = await apiClient.get("/properties/agent", {
      // ← اصلاح شد
      params,
    });
    return response.data;
  },

  /**
   * دریافت املاک برای نمایش روی نقشه
   * GET /api/properties
   */
  getMapProperties: async (): Promise<Property[]> => {
    const response = await apiClient.get("/properties");
    const allProperties: Property[] = response.data?.data || [];

    return allProperties.filter(
      (p) =>
        p.location &&
        p.location.type === "Point" &&
        Array.isArray(p.location.coordinates) &&
        p.location.coordinates.length === 2 &&
        p.location.coordinates[0] !== 0,
    );
  },

  /**
   * دریافت تحلیل بازار
   * GET /api/properties/market-analysis
   */
  getMarketAnalysis: async (city?: string): Promise<any> => {
    const response = await apiClient.get("/properties/market-analysis", {
      params: { city },
    });
    return response.data;
  },

  /**
   * دریافت یک ملک با ID
   * GET /api/properties/:id
   */
  getById: async (id: string): Promise<PropertyApiResponse<Property>> => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  /**
   * ایجاد ملک جدید
   * POST /api/properties
   */
  create: async (
    data: CreatePropertyData,
  ): Promise<PropertyApiResponse<Property>> => {
    const response = await apiClient.post("/properties", data);
    return response.data;
  },

  /**
   * ویرایش ملک
   * PUT /api/properties/:id
   */
  update: async (
    id: string,
    data: Partial<CreatePropertyData>,
  ): Promise<PropertyApiResponse<Property>> => {
    const response = await apiClient.put(`/properties/${id}`, data);
    return response.data;
  },

  /**
   * حذف ملک
   * DELETE /api/properties/:id
   */
  delete: async (id: string): Promise<PropertyApiResponse<null>> => {
    const response = await apiClient.delete(`/properties/${id}`);
    return response.data;
  },

  /**
   * آپلود تصویر برای ملک
   * POST /api/properties/upload-image
   */
  uploadImage: async (
    file: File,
  ): Promise<{ success: boolean; url: string; filename: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await apiClient.post(
      "/properties/upload-image",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      },
    );

    return response.data;
  },

  /**
   * آپلود چند تصویر همزمان
   */
  uploadMultipleImages: async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map((file) => propertyApi.uploadImage(file));
    const results = await Promise.all(uploadPromises);
    return results.map((r) => r.url);
  },
};

export default propertyApi;
