// frontend/services/api/marketAnalysis.api.ts
import apiClient from "./client";

export interface Province {
  _id: string;
  name: string;
}

export interface MarkerData {
  id: string;
  title: string;
  lat: number;
  lng: number;
  price: number;
  area: number;
  district: string;
  hasRealCoords: boolean;
}

export interface PriceAnalysisItem {
  district: string;
  totalAds: number;
  avgPricePerMeter: number;
  avgTotalPrice: number;
  marketLiquidityScore: number;
}

export interface MarketTrendItem {
  month: string;
  avgPricePerMeter: number;
}

export interface MarketAnalysisData {
  totalAds: number;
  priceAnalysis: PriceAnalysisItem[];
  marketTrends: MarketTrendItem[];
  city: string;
}

export interface MapAdsResponse {
  markers: MarkerData[];
  center: [number, number];
  total: number;
}

export const marketAnalysisApi = {
  // ۱. دریافت لیست شهرهای فعال روی دیتابیس
  getProvinces: async (): Promise<Province[]> => {
    const response = await apiClient.get("/market/provinces");
    return response.data.data;
  },

  // ۲. دریافت دیتای نمودارها و آمار محله‌ای بر اساس فیلتر شهر
  getMarketStats: async (city: string): Promise<MarketAnalysisData> => {
    const response = await apiClient.get(
      `/market/analysis?city=${encodeURIComponent(city)}`,
    );
    return response.data.data;
  },

  // ۳. دریافت مارکرهای نقشه بر اساس شهر و محله اختیاری
  getMapAds: async (
    city: string,
    district?: string,
  ): Promise<MapAdsResponse> => {
    let url = `/market/map-ads?city=${encodeURIComponent(city)}`;
    if (district) {
      url += `&district=${encodeURIComponent(district)}`;
    }
    const response = await apiClient.get(url);
    return response.data.data;
  },
};
