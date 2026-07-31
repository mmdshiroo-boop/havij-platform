import apiClient from "./client";

export interface SearchParams {
  // فیلترهای اصلی
  q?: string;
  category?: string;
  province?: string;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  adType?: string;
  propertyType?: string;
  sortBy?: string;
  page?: number;
  limit?: number;

  // مشخصات ملک
  minArea?: number;
  maxArea?: number;
  rooms?: string;
  floor?: string;
  floorCount?: string;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  documentType?: string;
  usage?: string;

  // امکانات (تاگل)
  hasElevator?: boolean;
  hasParking?: boolean;
  hasStorage?: boolean;
  hasBalcony?: boolean;
  hasYard?: boolean;

  // امکانات (سلکت)
  heatingSystem?: string;
  coolingSystem?: string;
  flooring?: string;
  buildingFacade?: string;

  // تخصصی زمین
  landWidth?: number;
  landLength?: number;
  landUsage?: string;

  // تخصصی تجاری/اداری
  officeType?: string;

  // تخصصی ویلایی (از طریق amenities)
  hasPool?: boolean;
  hasSauna?: boolean;

  // نمایشی
  isUrgent?: boolean;
  hasImage?: boolean;
  isVerified?: boolean;
}

export const searchApi = {
  // جستجوی آگهی‌ها
  search: async (params: SearchParams) => {
    const cleanParams: Record<string, any> = {};

    // فیلترهای اصلی
    if (params.q) cleanParams.q = params.q;
    if (params.category) cleanParams.category = params.category;
    if (params.province) cleanParams.province = params.province;
    if (params.city) cleanParams.city = params.city;
    if (params.district) cleanParams.district = params.district;
    if (params.minPrice && params.minPrice > 0)
      cleanParams.minPrice = params.minPrice;
    if (params.maxPrice && params.maxPrice > 0)
      cleanParams.maxPrice = params.maxPrice;
    if (params.adType) cleanParams.adType = params.adType;
    if (params.propertyType) cleanParams.propertyType = params.propertyType;
    if (params.sortBy) cleanParams.sortBy = params.sortBy;

    // مشخصات ملک
    if (params.minArea && params.minArea > 0)
      cleanParams.minArea = params.minArea;
    if (params.maxArea && params.maxArea > 0)
      cleanParams.maxArea = params.maxArea;
    if (params.rooms && params.rooms !== "any")
      cleanParams.rooms = params.rooms;
    if (params.floor && params.floor !== "any")
      cleanParams.floor = params.floor;
    if (params.floorCount && params.floorCount !== "any")
      cleanParams.floorCount = params.floorCount;
    if (params.minYearBuilt && params.minYearBuilt > 0)
      cleanParams.minYearBuilt = params.minYearBuilt;
    if (params.maxYearBuilt && params.maxYearBuilt > 0)
      cleanParams.maxYearBuilt = params.maxYearBuilt;
    if (params.documentType) cleanParams.documentType = params.documentType;
    if (params.usage) cleanParams.usage = params.usage;

    // امکانات (تاگل)
    if (params.hasElevator) cleanParams.hasElevator = true;
    if (params.hasParking) cleanParams.hasParking = true;
    if (params.hasStorage) cleanParams.hasStorage = true;
    if (params.hasBalcony) cleanParams.hasBalcony = true;
    if (params.hasYard) cleanParams.hasYard = true;

    // امکانات (سلکت)
    if (params.heatingSystem) cleanParams.heatingSystem = params.heatingSystem;
    if (params.coolingSystem) cleanParams.coolingSystem = params.coolingSystem;
    if (params.flooring) cleanParams.flooring = params.flooring;
    if (params.buildingFacade)
      cleanParams.buildingFacade = params.buildingFacade;

    // تخصصی زمین
    if (params.landWidth && params.landWidth > 0)
      cleanParams.landWidth = params.landWidth;
    if (params.landLength && params.landLength > 0)
      cleanParams.landLength = params.landLength;
    if (params.landUsage) cleanParams.landUsage = params.landUsage;

    // تخصصی تجاری/اداری
    if (params.officeType) cleanParams.officeType = params.officeType;

    // تخصصی ویلایی
    if (params.hasPool) cleanParams.hasPool = true;
    if (params.hasSauna) cleanParams.hasSauna = true;

    // نمایشی
    if (params.isUrgent) cleanParams.isUrgent = true;
    if (params.hasImage) cleanParams.hasImage = true;
    if (params.isVerified) cleanParams.isVerified = true;

    // صفحه‌بندی
    cleanParams.page = params.page || 1;
    cleanParams.limit = params.limit || 20;

    const response = await apiClient.get("/ads/search/advanced", {
      params: cleanParams,
    });

    return {
      data: response.data.data || [],
      pagination: response.data.pagination || {
        page: 1,
        pages: 1,
        total: 0,
        limit: 20,
      },
    };
  },

  // دریافت فیلترهای جستجو
  getFilters: async () => {
    try {
      const response = await apiClient.get("/ads/search/filters");
      return response.data.data as {
        cities: string[];
        categories: {
          _id: string;
          name: string;
          slug: string;
          icon?: string;
        }[];
        priceRange: { min: number; max: number };
      };
    } catch (error) {
      console.error("Error getting search filters:", error);
      return {
        cities: [],
        categories: [],
        priceRange: { min: 0, max: 1_000_000_000 },
      };
    }
  },
};
