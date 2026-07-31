// components/filters/index.ts

// فیلتر جدید بازار
export { MarketAdvancedFilter } from "./MarketAdvancedFilter";
export { useMarketAdvancedFilter } from "@/hooks/useMarketAdvancedFilter";

// تایپ‌های عمومی (برای سوپر ادمین و غیره)
export type {
  FilterValues,
  ActiveFilterTag,
  AdvancedFilterProps,
  SelectOption,
} from "./filter.types";
export { DEFAULT_FILTER_VALUES } from "./filter.types";

// تایپ‌های مخصوص بازار
export type {
  MarketFilterValues,
  ActiveMarketFilterTag,
} from "./marketFilter.types";
export { DEFAULT_MARKET_FILTER_VALUES } from "./marketFilter.types";

// آپشن‌های ثابت (عمومی + بازار)
export {
  CATEGORY_OPTIONS,
  AD_TYPE_OPTIONS,
  CONDITION_OPTIONS,
  PROVINCE_OPTIONS,
  SORT_OPTIONS,
  DATE_RANGE_OPTIONS,
  LABEL_MAP,
} from "./filterOptions";

export {
  PROPERTY_TYPE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SIZE_RANGE_OPTIONS,
  BUILDING_AGE_OPTIONS,
  ROOMS_COUNT_OPTIONS,
  PROVINCE_NAMES,
} from "./marketFilter.types";
