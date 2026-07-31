// hooks/useMarketAdvancedFilter.ts
import { useState, useCallback, useMemo } from "react";
import {
  MarketFilterValues,
  ActiveMarketFilterTag,
  DEFAULT_MARKET_FILTER_VALUES,
} from "@/components/filters/marketFilter.types"; // ✅ مسیر اصلاح شد
import {
  BUILDING_AGE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  ROOMS_COUNT_OPTIONS,
  SIZE_RANGE_OPTIONS,
} from "@/components/filters/marketFilter.types"; // ✅ مسیر اصلاح شد

interface UseMarketAdvancedFilterOptions {
  initialValues?: Partial<MarketFilterValues>;
  onApply?: (values: MarketFilterValues) => void;
}

export function useMarketAdvancedFilter({
  initialValues,
  onApply,
}: UseMarketAdvancedFilterOptions = {}) {
  const initialState: MarketFilterValues = {
    ...DEFAULT_MARKET_FILTER_VALUES,
    ...initialValues,
  };

  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<MarketFilterValues>(initialState);
  const [appliedFilters, setAppliedFilters] =
    useState<MarketFilterValues>(initialState);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => {
    setFilters(appliedFilters);
    setIsOpen(false);
  }, [appliedFilters]);

  const updateFilter = useCallback(
    <K extends keyof MarketFilterValues>(
      key: K,
      value: MarketFilterValues[K],
    ) => {
      // ✅ تایپ prev مشخص است
      setFilters((prev: MarketFilterValues) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_MARKET_FILTER_VALUES);
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
    onApply?.(filters);
    setIsOpen(false);
  }, [filters, onApply]);

  const removeTag = useCallback(
    (key: keyof MarketFilterValues) => {
      // ✅ دسترسی امن به مقادیر پیش‌فرض
      const updated: MarketFilterValues = {
        ...appliedFilters,
        [key]: DEFAULT_MARKET_FILTER_VALUES[key],
      };
      setAppliedFilters(updated);
      setFilters(updated);
      onApply?.(updated);
    },
    [appliedFilters, onApply],
  );

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_MARKET_FILTER_VALUES);
    setAppliedFilters(DEFAULT_MARKET_FILTER_VALUES);
    onApply?.(DEFAULT_MARKET_FILTER_VALUES);
  }, [onApply]);

  // ساخت تگ‌های فعال
  const activeTags = useMemo<ActiveMarketFilterTag[]>(() => {
    const tags: ActiveMarketFilterTag[] = [];
    const addTag = (
      key: keyof MarketFilterValues,
      label: string,
      displayValue: string,
    ) => {
      if (displayValue) {
        tags.push({ key, label, displayValue });
      }
    };

    if (appliedFilters.tradeType) {
      addTag(
        "tradeType",
        "نوع معامله",
        appliedFilters.tradeType === "buy" ? "خرید" : "اجاره",
      );
    }
    const propType = PROPERTY_TYPE_OPTIONS.find(
      (o: { value: string; label: string }) =>
        o.value === appliedFilters.propertyType,
    );
    if (appliedFilters.propertyType && appliedFilters.propertyType !== "none") {
      addTag(
        "propertyType",
        "نوع ملک",
        propType?.label || appliedFilters.propertyType,
      );
    }
    const priceOpt = PRICE_RANGE_OPTIONS.find(
      (o: { value: string; label: string }) =>
        o.value === appliedFilters.priceRange,
    );
    if (appliedFilters.priceRange !== "none" && appliedFilters.priceRange) {
      addTag(
        "priceRange",
        "قیمت",
        priceOpt?.label || appliedFilters.priceRange,
      );
    }
    const sizeOpt = SIZE_RANGE_OPTIONS.find(
      (o: { value: string; label: string }) =>
        o.value === appliedFilters.sizeRange,
    );
    if (appliedFilters.sizeRange !== "none" && appliedFilters.sizeRange) {
      addTag("sizeRange", "متراژ", sizeOpt?.label || appliedFilters.sizeRange);
    }
    const ageOpt = BUILDING_AGE_OPTIONS.find(
      (o: { value: string; label: string }) =>
        o.value === appliedFilters.buildingAge,
    );
    if (appliedFilters.buildingAge !== "none" && appliedFilters.buildingAge) {
      addTag(
        "buildingAge",
        "سن بنا",
        ageOpt?.label || appliedFilters.buildingAge,
      );
    }
    const roomOpt = ROOMS_COUNT_OPTIONS.find(
      (o: { value: string; label: string }) =>
        o.value === appliedFilters.roomsCount,
    );
    if (appliedFilters.roomsCount !== "none" && appliedFilters.roomsCount) {
      addTag("roomsCount", "اتاق", roomOpt?.label || appliedFilters.roomsCount);
    }
    if (appliedFilters.province) {
      addTag("province", "استان", appliedFilters.province);
    }
    if (appliedFilters.city) {
      addTag("city", "شهر", appliedFilters.city);
    }
    if (appliedFilters.region !== "همه" && appliedFilters.region) {
      addTag("region", "منطقه", appliedFilters.region);
    }
    if (appliedFilters.district !== "none" && appliedFilters.district) {
      addTag("district", "محله", appliedFilters.district);
    }

    return tags;
  }, [appliedFilters]);

  return {
    isOpen,
    filters,
    appliedFilters,
    activeTags,
    hasActiveFilters: activeTags.length > 0,
    activeCount: activeTags.length,
    openModal,
    closeModal,
    updateFilter,
    resetFilters,
    applyFilters,
    removeTag,
    clearAllFilters,
  };
}
