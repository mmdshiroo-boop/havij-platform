export interface SelectOption {
  label: string;
  value: string;
}

export interface FilterValues {
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
  minArea?: number;
  maxArea?: number;
  rooms?: string;
  floor?: string;
  floorCount?: string;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  documentType?: string;
  usage?: string;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasStorage?: boolean;
  hasBalcony?: boolean;
  hasYard?: boolean;
  heatingSystem?: string;
  coolingSystem?: string;
  flooring?: string;
  buildingFacade?: string;
  landWidth?: number;
  landLength?: number;
  landUsage?: string;
  officeType?: string;
  hasPool?: boolean;
  hasSauna?: boolean;
  isUrgent?: boolean;
  hasImage?: boolean;
  isVerified?: boolean;
}

export interface ActiveFilterTag {
  key: string;
  label: string;
}

export interface AdvancedFilterProps {
  onApply: (filters: FilterValues) => void;
  currentFilters?: FilterValues;
  categories?: any[];
  provinces?: any[];
  priceRange?: { min: number; max: number };
  activeFiltersCount?: number;
  clearFilters?: () => void;
}

export const DEFAULT_FILTER_VALUES: FilterValues = {
  q: "",
  category: "",
  province: "",
  city: "",
  district: "",
  minPrice: undefined,
  maxPrice: undefined,
  adType: "",
  propertyType: "",
  sortBy: "newest",
  page: 1,
  minArea: undefined,
  maxArea: undefined,
  rooms: "any",
  floor: "any",
  floorCount: "any",
  minYearBuilt: undefined,
  maxYearBuilt: undefined,
  documentType: "",
  usage: "",
  hasElevator: false,
  hasParking: false,
  hasStorage: false,
  hasBalcony: false,
  hasYard: false,
  heatingSystem: "",
  coolingSystem: "",
  flooring: "",
  buildingFacade: "",
  landWidth: undefined,
  landLength: undefined,
  landUsage: "",
  officeType: "",
  hasPool: false,
  hasSauna: false,
  isUrgent: false,
  hasImage: false,
  isVerified: false,
};

export const DEFAULT_MARKET_FILTER_VALUES = DEFAULT_FILTER_VALUES;
