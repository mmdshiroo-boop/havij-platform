// frontend/services/api/favorite.api.ts
import apiClient from "./client";

export interface FavoriteAd {
  _id: string;
  title: string;
  price: number;
  city: string;
  images: string[];
  createdAt: string;
  isUrgent?: boolean;
  category?: { name: string };
}

export const favoriteApi = {
  // دریافت لیست ذخیره‌شده‌ها
  getFavorites: async (page = 1, limit = 20): Promise<FavoriteAd[]> => {
    const res = await apiClient.get("/favorites", {
      params: { page, limit },
    });
    return res.data.data;
  },

  // حذف از ذخیره‌شده‌ها
  removeFavorite: async (adId: string): Promise<void> => {
    await apiClient.delete(`/favorites/${adId}`);
  },
};