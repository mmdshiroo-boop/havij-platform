import apiClient from "./client";

export interface Province {
  _id: string;
  name: string;
  slug: string;
  code: number;
  color: string;
  population: number;
  area: number;
  cities: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  _id: string;
  name: string;
  slug: string;
  provinceId: string;
  provinceName?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserLocation {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    role: string;
    isActive: boolean;
    isBanned: boolean;
    avatar?: string;                // ✅ اضافه شد
  };
  isVip?: boolean;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  lat?: number;                    // ✅ اضافه شد
  lng?: number;                    // ✅ اضافه شد
  accuracy?: number;
  city?: string;
  province?: string;
  district?: string;
  address?: string;
  lastSeenAt: string;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
   ip?: string;
}

export interface LocationStats {
  total: number;
  totalWithLocation?: number;      // ✅ اضافه شد
  onlineNow: number;
  onlineLast5min: number;
  online5m?: number;               // ✅ اضافه شد
  onlineLastHour: number;
  online1h?: number;               // ✅ اضافه شد
  onlineToday: number;
  topCities: { _id: string; count: number }[];
}

export interface LocationFilterParams {
  lat?: number;
  lng?: number;
  radius?: number;
  online?: boolean | "all" | string;
  timeframe?: string;              // ✅ اضافه شد
  city?: string;
  province?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LocationListResponse {
  success: boolean;
  data: UserLocation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateLocationPayload {
   lat?: number;   // ← اختیاری شد
  lng?: number;   // ← اختیاری شد
  accuracy?: number;
  city?: string;
  province?: string;
  district?: string;
  address?: string;
}

export const locationApi = {
  getProvinces: async (): Promise<Province[]> => {
    const response = await apiClient.get("/locations/provinces");
    return response.data.data;
  },

  getCitiesByProvince: async (provinceId: string): Promise<City[]> => {
    const response = await apiClient.get(`/locations/cities/${provinceId}`);
    return response.data.data;
  },

  getProvinceBySlug: async (slug: string): Promise<Province> => {
    const response = await apiClient.get(`/locations/provinces/${slug}`);
    return response.data.data;
  },

  getLocationFromIP: async (): Promise<{
    province: string;
    city: string;
    district: string;
  }> => {
    const response = await apiClient.get("/locations/from-ip");
    return response.data.data;
  },

  reverseGeocode: async (
    lat: number,
    lng: number,
  ): Promise<{ province: string; city: string; district: string }> => {
    const response = await apiClient.get("/locations/reverse-geocode", {
      params: { lat, lng },
    });
    return response.data.data;
  },

  updateMyLocation: async (
    payload: UpdateLocationPayload,
  ): Promise<UserLocation> => {
    const response = await apiClient.put("/locations/me", payload);
    return response.data.data;
  },

  setUserOffline: async (): Promise<void> => {
    await apiClient.post("/locations/me/offline");
  },

  getUsersLocations: async (
    params?: LocationFilterParams,
  ): Promise<LocationListResponse> => {
    const response = await apiClient.get("/locations/admin/list", { params });
    if (response.data && Array.isArray(response.data.data)) {
      response.data.data = response.data.data.map((item: any) => {
        if (item.location && Array.isArray(item.location.coordinates)) {
          item.lng = item.location.coordinates[0];
          item.lat = item.location.coordinates[1];
        }
        return item;
      });
    }
    return response.data;
  },

  getLocationStats: async (): Promise<LocationStats> => {
    const response = await apiClient.get("/locations/admin/stats");
    const stats = response.data.data;
    return {
      ...stats,
      totalWithLocation: stats.total || stats.totalWithLocation || 0,
      online5m: stats.onlineLast5min || stats.online5m || 0,
      online1h: stats.onlineLastHour || stats.online1h || 0,
    };
  },

  downloadLocationsExcel: async (
    params?: LocationFilterParams,
  ): Promise<void> => {
    const response = await apiClient.get("/locations/admin/export-excel", {
      params: params || {},
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-locations-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};