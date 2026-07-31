"use client";

import { useMemo } from "react";
// فراخوانی مستقیم و ایمن دیتای محلی
import { PROVINCES, CITIES } from "@/lib/iranLocations";

interface LocationSelectorProps {
  province: string;
  city: string;
  district: string;
  onChange: (field: "province" | "city" | "district", value: string) => void;
}

export function LocationSelector({
  province,
  city,
  district,
  onChange,
}: LocationSelectorProps) {
  // ۱. پیدا کردن استان انتخاب‌شده
  const selectedProvinceObj = useMemo(() => {
    return PROVINCES.find((p) => p.name === province);
  }, [province]);

  // ۲. فیلتر کردن شهرهای همان استان
  const availableCities = useMemo(() => {
    if (!selectedProvinceObj) return [];
    return CITIES.filter((c) => c.province_id === selectedProvinceObj.id);
  }, [selectedProvinceObj]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5" dir="rtl">
      {/* انتخاب استان */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground/80 block">
          استان
        </label>
        <div className="relative">
          <select
            value={province}
            onChange={(e) => {
              const val = e.target.value;
              onChange("province", val);
              onChange("city", "");
              onChange("district", "");
            }}
            className="w-full h-12 px-4 rounded-xl bg-background border border-border/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all appearance-none cursor-pointer"
          >
            <option value="">انتخاب استان...</option>
            {PROVINCES.map((p) => (
              <option
                key={p.id}
                value={p.name}
                className="bg-background text-foreground py-2"
              >
                {p.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* انتخاب شهر */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground/80 block">
          شهر
        </label>
        <div className="relative">
          <select
            value={city}
            disabled={!province}
            onChange={(e) => {
              const val = e.target.value;
              onChange("city", val);
              onChange("district", "");
            }}
            className="w-full h-12 px-4 rounded-xl bg-background border border-border/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {province ? "انتخاب شهر..." : "ابتدا استان را انتخاب کنید"}
            </option>
            {availableCities.map((c) => (
              <option
                key={c.id}
                value={c.name}
                className="bg-background text-foreground py-2"
              >
                {c.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ورودی منطقه / محله */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground/80 block">
          منطقه / محله
        </label>
        <input
          type="text"
          value={district}
          disabled={!city}
          onChange={(e) => onChange("district", e.target.value)}
          placeholder={
            city ? "مثلاً: منطقه ۳ یا سعادت‌آباد" : "ابتدا شهر را انتخاب کنید"
          }
          className="w-full h-12 px-4 rounded-xl bg-background border border-border/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground/60"
        />
      </div>
    </div>
  );
}
