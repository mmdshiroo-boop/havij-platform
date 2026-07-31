// hooks/useExpertAdFilter.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import {
  MarketFilterValues,
  ActiveMarketFilterTag,
  DEFAULT_MARKET_FILTER_VALUES,
  PROPERTY_TYPE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SIZE_RANGE_OPTIONS,
  BUILDING_AGE_OPTIONS,
  ROOMS_COUNT_OPTIONS,
} from "@/components/filters/marketFilter.types";

interface ExpertAdFilterOptions {
  initialValues?: Partial<MarketFilterValues>;
  onApply?: (values: MarketFilterValues) => void;
}

export function useExpertAdFilter({
  initialValues,
  onApply,
}: ExpertAdFilterOptions = {}) {
  const initialState: MarketFilterValues = {
    ...DEFAULT_MARKET_FILTER_VALUES,
    ...initialValues,
    tradeType: "", // اجباری برای خالی ماندن
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
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_MARKET_FILTER_VALUES, tradeType: "" });
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
    onApply?.(filters);
    setIsOpen(false);
  }, [filters, onApply]);

  const removeTag = useCallback(
    (key: keyof MarketFilterValues) => {
      const updated = {
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
    const defaults = { ...DEFAULT_MARKET_FILTER_VALUES, tradeType: "" };
    setFilters(defaults);
    setAppliedFilters(defaults);
    onApply?.(defaults);
  }, [onApply]);

  const activeTags = useMemo<ActiveMarketFilterTag[]>(() => {
    const tags: ActiveMarketFilterTag[] = [];
    const addTag = (
      key: keyof MarketFilterValues,
      label: string,
      displayValue: string,
    ) => {
      if (displayValue) tags.push({ key, label, displayValue });
    };

    if (appliedFilters.propertyType && appliedFilters.propertyType !== "none") {
      const opt = PROPERTY_TYPE_OPTIONS.find(
        (o) => o.value === appliedFilters.propertyType,
      );
      addTag(
        "propertyType",
        "نوع ملک",
        opt?.label || appliedFilters.propertyType,
      );
    }
    if (appliedFilters.priceRange && appliedFilters.priceRange !== "none") {
      const opt = PRICE_RANGE_OPTIONS.find(
        (o) => o.value === appliedFilters.priceRange,
      );
      addTag("priceRange", "قیمت", opt?.label || appliedFilters.priceRange);
    }
    if (appliedFilters.sizeRange && appliedFilters.sizeRange !== "none") {
      const opt = SIZE_RANGE_OPTIONS.find(
        (o) => o.value === appliedFilters.sizeRange,
      );
      addTag("sizeRange", "متراژ", opt?.label || appliedFilters.sizeRange);
    }
    if (appliedFilters.buildingAge && appliedFilters.buildingAge !== "none") {
      const opt = BUILDING_AGE_OPTIONS.find(
        (o) => o.value === appliedFilters.buildingAge,
      );
      addTag("buildingAge", "سن بنا", opt?.label || appliedFilters.buildingAge);
    }
    if (appliedFilters.roomsCount && appliedFilters.roomsCount !== "none") {
      const opt = ROOMS_COUNT_OPTIONS.find(
        (o) => o.value === appliedFilters.roomsCount,
      );
      addTag("roomsCount", "اتاق", opt?.label || appliedFilters.roomsCount);
    }
    if (appliedFilters.province)
      addTag("province", "استان", appliedFilters.province);
    if (appliedFilters.city) addTag("city", "شهر", appliedFilters.city);
    if (appliedFilters.region !== "همه" && appliedFilters.region)
      addTag("region", "منطقه", appliedFilters.region);
    if (appliedFilters.district !== "none" && appliedFilters.district)
      addTag("district", "محله", appliedFilters.district);

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
