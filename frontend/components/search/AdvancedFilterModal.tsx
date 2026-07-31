"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Filter,
  X,
  SlidersHorizontal,
  Building2,
  Layers,
  ShoppingBag,
  ArrowUpDown,
  Eye,
  Clock,
  Home,
  Car,
  Package,
  Tag,
  Check,
  ImageIcon,
  Zap,
  BedDouble,
  Maximize2,
  Building,
  Trees,
  LandPlot,
  Store,
  DoorOpen,
  MapPin,
  Layers2,
  TreePine,
  Castle,
  Hotel,
  Hammer,
  Briefcase,
  Gem,
  Heart,
} from "lucide-react";
import { Category } from "@/services/api/category.api";
import { Province, City, locationApi } from "@/services/api/location.api";

export interface AdvancedFilters {
  category?: string;
  province?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  adType?: string;
  propertyType?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  q?: string;
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
  hasImage?: boolean;
  isUrgent?: boolean;
  isVerified?: boolean;
}

interface AdvancedFilterModalProps {
  categories: Category[];
  provinces: Province[];
  priceRange: { min: number; max: number };
  currentFilters: Partial<AdvancedFilters>;
  activeFiltersCount: number;
  onApply: (filters: AdvancedFilters) => void;
  clearFilters: () => void;
}

const PROPERTY_TYPES = [
  { value: "apartment", label: "آپارتمان", icon: Building },
  { value: "villa", label: "ویلایی", icon: TreePine },
  { value: "house", label: "خانه حیاط‌دار", icon: Home },
  { value: "land", label: "زمین", icon: LandPlot },
  { value: "suite", label: "سوئیت / استودیو", icon: DoorOpen },
  { value: "office", label: "دفتر اداری", icon: Briefcase },
  { value: "commercial", label: "مغازه تجاری", icon: Store },
  { value: "bare_land", label: "کلنگی", icon: Hammer },
  { value: "penthouse", label: "پنت‌هاوس", icon: Castle },
  { value: "duplex", label: "دوبلکس", icon: Layers2 },
  { value: "garden", label: "باغ", icon: Trees },
  { value: "hotel", label: "مهمان‌پذیر", icon: Hotel },
];

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین", icon: Clock },
  { value: "oldest", label: "قدیمی‌ترین", icon: ArrowUpDown },
  { value: "price_asc", label: "ارزان‌ترین", icon: ShoppingBag },
  { value: "price_desc", label: "گران‌ترین", icon: Gem },
  { value: "most_viewed", label: "پربازدیدترین", icon: Eye },
  { value: "popular", label: "محبوب‌ترین", icon: Heart },
];

const AD_TYPES = [
  { value: "", label: "همه نوع" },
  { value: "sale", label: "فروش" },
  { value: "rent", label: "اجاره" },
  { value: "mortgage", label: "رهن و اجاره" },
  { value: "presale", label: "پیش‌فروش" },
  { value: "exchange", label: "معاوضه" },
  { value: "daily_rent", label: "اجاره روزانه" },
  { value: "construction", label: "مشارکت در ساخت" },
];

const ROOMS_OPTIONS = [
  { value: "0", label: "بدون اتاق" },
  { value: "1", label: "۱ اتاق" },
  { value: "2", label: "۲ اتاق" },
  { value: "3", label: "۳ اتاق" },
  { value: "4", label: "۴ اتاق" },
  { value: "5", label: "۵ به بالا" },
];
const PRICE_RANGES = [
  { value: "none", label: "همه قیمت‌ها" },
  { value: "0-500000000", label: "تا ۵۰۰ میلیون", min: 0, max: 500_000_000 },
  {
    value: "500000000-1000000000",
    label: "۵۰۰ میلیون تا ۱ میلیارد",
    min: 500_000_000,
    max: 1_000_000_000,
  },
  {
    value: "1000000000-5000000000",
    label: "۱ تا ۵ میلیارد",
    min: 1_000_000_000,
    max: 5_000_000_000,
  },
  {
    value: "5000000000-10000000000",
    label: "۵ تا ۱۰ میلیارد",
    min: 5_000_000_000,
    max: 10_000_000_000,
  },
  {
    value: "10000000000-",
    label: "بالای ۱۰ میلیارد",
    min: 10_000_000_000,
    max: undefined,
  },
];
const AREA_RANGES = [
  { value: "none", label: "همه متراژها" },
  { value: "0-50", label: "تا ۵۰ متر", min: 0, max: 50 },
  { value: "50-100", label: "۵۰ تا ۱۰۰ متر", min: 50, max: 100 },
  { value: "100-150", label: "۱۰۰ تا ۱۵۰ متر", min: 100, max: 150 },
  { value: "150-200", label: "۱۵۰ تا ۲۰۰ متر", min: 150, max: 200 },
  { value: "200-", label: "بالای ۲۰۰ متر", min: 200, max: undefined },
];
const YEAR_RANGES = [
  { value: "none", label: "همه سال‌ها" },
  { value: "0-1380", label: "قبل از ۱۳۸۰", min: 0, max: 1380 },
  { value: "1380-1390", label: "۱۳۸۰ تا ۱۳۹۰", min: 1380, max: 1390 },
  { value: "1390-1400", label: "۱۳۹۰ تا ۱۴۰۰", min: 1390, max: 1400 },
  { value: "1400-", label: "بعد از ۱۴۰۰", min: 1400, max: undefined },
];

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toPersianNum = (n: number): string =>
  String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);
const formatPriceShort = (v: number): string => {
  if (v >= 1_000_000_000)
    return `${toPersianNum(Math.round(v / 1_000_000_000))} میلیارد`;
  if (v >= 1_000_000)
    return `${toPersianNum(Math.round(v / 1_000_000))} میلیون`;
  return toPersianNum(v);
};

function ChipButton({
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all duration-200 active:scale-95 whitespace-nowrap ${selected ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />} <span>{label}</span>{" "}
      {selected && <Check className="w-3 h-3 shrink-0" />}
    </button>
  );
}

function ToggleRow({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2.5 px-1 cursor-pointer group rounded-lg hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div
            className={`p-1.5 rounded-lg transition-colors ${checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <span
          className={`text-xs font-medium transition-colors ${checked ? "text-foreground" : "text-muted-foreground"}`}
        >
          {label}
        </span>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-primary"
      />
    </label>
  );
}

function SectionIcon({
  icon: Icon,
  label,
  badge,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}{" "}
      <span className="text-xs font-bold">{label}</span>
      {badge && (
        <Badge
          variant="secondary"
          className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-transparent"
        >
          {badge}
        </Badge>
      )}
    </div>
  );
}

export function AdvancedFilterModal({
  provinces,
  currentFilters,
  activeFiltersCount,
  onApply,
  clearFilters,
}: AdvancedFilterModalProps) {
  const [draft, setDraft] = useState<AdvancedFilters>({});
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen) {
      setDraft(() => {
        const next = { ...currentFilters };
        if (
          next.province &&
          provinces.length > 0 &&
          !/^[a-f0-9]{24}$/i.test(next.province)
        ) {
          const found = provinces.find((p) => p.name === next.province);
          if (found) next.province = found._id;
        }
        return next;
      });
    }
  }, [modalOpen, currentFilters, provinces]);

  useEffect(() => {
    if (!draft.province || draft.province === "all") {
      setCities([]);
      return;
    }
    let provinceId = draft.province;
    if (!/^[a-f0-9]{24}$/i.test(provinceId)) {
      const found = provinces.find((p) => p.name === provinceId);
      if (found) provinceId = found._id;
      else return;
    }
    setCitiesLoading(true);
    locationApi
      .getCitiesByProvince(provinceId)
      .then(setCities)
      .catch(console.error)
      .finally(() => setCitiesLoading(false));
  }, [draft.province, provinces]);

  const updateDraft = (patch: Partial<AdvancedFilters>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const handleApply = () => {
    const clean: AdvancedFilters = { ...draft };

    if (clean.province && /^[a-f0-9]{24}$/i.test(clean.province)) {
      const found = provinces.find((p) => p._id === clean.province);
      if (found) clean.province = found.name; // Keep frontend compatibility
    }

    (Object.keys(clean) as Array<keyof AdvancedFilters>).forEach((key) => {
      const val = clean[key];
      if (val === undefined || val === null || val === "" || val === false)
        delete clean[key];
    });

    if (clean.minPrice === 0) delete clean.minPrice;
    if (clean.minArea === 0) delete clean.minArea;
    if (clean.minYearBuilt === 0) delete clean.minYearBuilt;

    onApply(clean);
    setModalOpen(false);
  };

  const handleClear = () => {
    setDraft({});
    clearFilters();
    setModalOpen(false);
  };

  // 🟢 تابع کمکی جدید برای تبدیل امن شناسه یا متن استان به نام فارسی واقعی استان 🟢
  const getProvinceName = (prov: string | undefined) => {
    if (!prov) return "";
    const found = provinces.find((p) => p._id === prov || p.name === prov);
    return found ? found.name : prov;
  };

  const FilterContent = () => (
    <div className="flex flex-col h-full min-h-0 w-full" dir="rtl">
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-1 pb-4">
        <Accordion
          type="multiple"
          defaultValue={[
            "sort",
            "adType",
            "propertyType",
            "location",
            "price",
            "specs",
          ]}
          className="space-y-0"
        >
          <AccordionItem value="sort" className="border-none">
            <AccordionTrigger className="py-3 hover:no-underline">
              <SectionIcon icon={ArrowUpDown} label="مرتب‌سازی نتایج" />
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="grid grid-cols-2 gap-1.5">
                {SORT_OPTIONS.map((opt) => (
                  <ChipButton
                    key={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    selected={(draft.sortBy || "newest") === opt.value}
                    onClick={() => updateDraft({ sortBy: opt.value })}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <Separator className="opacity-50" />
          <AccordionItem value="adType" className="border-none">
            <AccordionTrigger className="py-3 hover:no-underline">
              <SectionIcon
                icon={Tag}
                label="نوع معامله"
                badge={
                  draft.adType
                    ? AD_TYPES.find((t) => t.value === draft.adType)?.label
                    : undefined
                }
              />
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-wrap gap-1.5">
                {AD_TYPES.map((t) => (
                  <ChipButton
                    key={t.value}
                    label={t.label}
                    selected={(draft.adType || "") === t.value}
                    onClick={() =>
                      updateDraft({ adType: t.value || undefined })
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <Separator className="opacity-50" />
          <AccordionItem value="propertyType" className="border-none">
            <AccordionTrigger className="py-3 hover:no-underline">
              <SectionIcon
                icon={Building2}
                label="نوع ملک"
                badge={
                  draft.propertyType
                    ? PROPERTY_TYPES.find((t) => t.value === draft.propertyType)
                        ?.label
                    : undefined
                }
              />
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="grid grid-cols-3 gap-1.5">
                {PROPERTY_TYPES.map((pt) => (
                  <ChipButton
                    key={pt.value}
                    label={pt.label}
                    icon={pt.icon}
                    selected={draft.propertyType === pt.value}
                    onClick={() =>
                      updateDraft({
                        propertyType:
                          draft.propertyType === pt.value
                            ? undefined
                            : pt.value,
                      })
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <Separator className="opacity-50" />
          <AccordionItem value="location" className="border-none">
            <AccordionTrigger className="py-3 hover:no-underline">
              <SectionIcon
                icon={MapPin}
                label="موقعیت مکانی"
                // 🟢 اصلاح منطق شرط رندر بج برای نمایش اصولی ترکیب استان و شهر با هم 🟢
                badge={
                  draft.city && draft.province
                    ? `${getProvinceName(draft.province)}، ${draft.city}`
                    : draft.city
                      ? draft.city
                      : draft.province
                        ? getProvinceName(draft.province)
                        : undefined
                }
              />
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-3 bg-muted/20 border border-border/50 p-3 rounded-xl">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-medium">
                    استان
                  </Label>
                  <Select
                    value={draft.province || "all"}
                    onValueChange={(v) =>
                      updateDraft({
                        province: v === "all" ? undefined : v,
                        city: undefined,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background border-border">
                      <SelectValue placeholder="همه استان‌ها" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl z-[150]">
                      <SelectItem value="all" className="text-xs">
                        همه استان‌ها
                      </SelectItem>
                      {provinces.map((p) => (
                        <SelectItem
                          key={p._id}
                          value={p._id}
                          className="text-xs"
                        >
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-medium">
                    شهر
                  </Label>
                  <Select
                    value={draft.city || "all"}
                    onValueChange={(v) =>
                      updateDraft({ city: v === "all" ? undefined : v })
                    }
                    disabled={!draft.province || citiesLoading}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background border-border">
                      <SelectValue
                        placeholder={
                          citiesLoading
                            ? "در حال بارگذاری..."
                            : draft.province
                              ? "انتخاب شهر"
                              : "ابتدا استان را انتخاب کنید"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl z-[150]">
                      <SelectItem value="all" className="text-xs">
                        همه شهرها
                      </SelectItem>
                      {cities.map((c) => (
                        <SelectItem
                          key={c._id}
                          value={c.name}
                          className="text-xs"
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <Separator className="opacity-50" />
          <AccordionItem value="price" className="border-none">
            <AccordionTrigger className="py-3 hover:no-underline">
              <SectionIcon
                icon={ShoppingBag}
                label="محدوده قیمت"
                badge={
                  draft.minPrice !== undefined || draft.maxPrice !== undefined
                    ? "فعال"
                    : undefined
                }
              />
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1.5">
                <Select
                  value={
                    draft.minPrice !== undefined || draft.maxPrice !== undefined
                      ? `${draft.minPrice ?? 0}-${draft.maxPrice ?? ""}`
                      : "none"
                  }
                  onValueChange={(v) => {
                    if (v === "none") {
                      updateDraft({ minPrice: undefined, maxPrice: undefined });
                      return;
                    }
                    const range = PRICE_RANGES.find((r) => r.value === v);
                    if (range)
                      updateDraft({ minPrice: range.min, maxPrice: range.max });
                  }}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-muted/20 border-border">
                    <SelectValue placeholder="انتخاب بازه" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl z-[150]">
                    {PRICE_RANGES.map((r) => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                        className="text-xs"
                      >
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(draft.minPrice !== undefined ||
                  draft.maxPrice !== undefined) && (
                  <p className="text-[11px] text-primary font-bold bg-primary/5 rounded-lg py-1.5 text-center mt-2">
                    {draft.minPrice !== undefined
                      ? `از ${formatPriceShort(draft.minPrice)}`
                      : ""}{" "}
                    {draft.minPrice !== undefined &&
                    draft.maxPrice !== undefined
                      ? " — "
                      : ""}{" "}
                    {draft.maxPrice !== undefined
                      ? `تا ${formatPriceShort(draft.maxPrice)}`
                      : ""}{" "}
                    {" تومان"}
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          <Separator className="opacity-50" />
          <AccordionItem value="specs" className="border-none">
            <AccordionTrigger className="py-3 hover:no-underline">
              <SectionIcon icon={Maximize2} label="مشخصات ملک" />
            </AccordionTrigger>
            <AccordionContent className="pb-2 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">
                  متراژ
                </Label>
                <Select
                  value={
                    draft.minArea !== undefined || draft.maxArea !== undefined
                      ? `${draft.minArea ?? 0}-${draft.maxArea ?? ""}`
                      : "none"
                  }
                  onValueChange={(v) => {
                    if (v === "none") {
                      updateDraft({ minArea: undefined, maxArea: undefined });
                      return;
                    }
                    const range = AREA_RANGES.find((r) => r.value === v);
                    if (range)
                      updateDraft({ minArea: range.min, maxArea: range.max });
                  }}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-muted/20 border-border">
                    <SelectValue placeholder="انتخاب متراژ" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl z-[150]">
                    {AREA_RANGES.map((r) => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                        className="text-xs"
                      >
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[11px] text-muted-foreground font-medium">
                    تعداد اتاق خواب
                  </Label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ROOMS_OPTIONS.map((r) => (
                    <ChipButton
                      key={r.value}
                      label={r.label}
                      selected={(draft.rooms || "") === r.value}
                      onClick={() =>
                        updateDraft({
                          rooms: draft.rooms === r.value ? undefined : r.value,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">
                  سال ساخت
                </Label>
                <Select
                  value={
                    draft.minYearBuilt !== undefined ||
                    draft.maxYearBuilt !== undefined
                      ? `${draft.minYearBuilt ?? 0}-${draft.maxYearBuilt ?? ""}`
                      : "none"
                  }
                  onValueChange={(v) => {
                    if (v === "none") {
                      updateDraft({
                        minYearBuilt: undefined,
                        maxYearBuilt: undefined,
                      });
                      return;
                    }
                    const range = YEAR_RANGES.find((r) => r.value === v);
                    if (range)
                      updateDraft({
                        minYearBuilt: range.min,
                        maxYearBuilt: range.max,
                      });
                  }}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-muted/20 border-border">
                    <SelectValue placeholder="انتخاب سال ساخت" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl z-[150]">
                    {YEAR_RANGES.map((r) => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                        className="text-xs"
                      >
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 bg-muted/10 p-2 rounded-xl border border-border/40">
                <ToggleRow
                  label="دارای آسانسور"
                  icon={Layers}
                  checked={!!draft.hasElevator}
                  onChange={(v) => updateDraft({ hasElevator: v })}
                />
                <ToggleRow
                  label="دارای پارکینگ"
                  icon={Car}
                  checked={!!draft.hasParking}
                  onChange={(v) => updateDraft({ hasParking: v })}
                />
                <ToggleRow
                  label="دارای انباری"
                  icon={Package}
                  checked={!!draft.hasStorage}
                  onChange={(v) => updateDraft({ hasStorage: v })}
                />
                <ToggleRow
                  label="فقط آگهی‌های عکس‌دار"
                  icon={ImageIcon}
                  checked={!!draft.hasImage}
                  onChange={(v) => updateDraft({ hasImage: v })}
                />
                <ToggleRow
                  label="آگهی‌های فوری"
                  icon={Zap}
                  checked={!!draft.isUrgent}
                  onChange={(v) => updateDraft({ isUrgent: v })}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border bg-background mt-auto">
        <Button
          className="flex-1 rounded-xl text-xs h-10 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleApply}
        >
          اعمال فیلترها
        </Button>
        <Button
          variant="outline"
          className="rounded-xl text-xs h-10 font-bold text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          پاک کردن همه
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 rounded-xl text-xs h-9 font-bold relative border-border bg-background"
      >
        <Filter className="w-4 h-4 text-muted-foreground" />{" "}
        <span>فیلترهای پیشرفته</span>
        {activeFiltersCount > 0 && (
          <Badge className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center p-0 rounded-full text-[10px] bg-primary text-primary-foreground">
            {toPersianNum(activeFiltersCount)}
          </Badge>
        )}
      </Button>

      {mounted &&
        modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
              onClick={() => setModalOpen(false)}
            />
            <div className="bg-background w-full h-[100dvh] md:h-auto md:max-h-[85vh] rounded-none md:rounded-2xl shadow-xl border-0 md:border border-border flex flex-col overflow-hidden relative z-10 p-4 md:max-w-md animate-in fade-in-0 slide-in-from-bottom-8 md:zoom-in-95 duration-200">
              <div
                className="flex items-center justify-between pb-3 border-b border-border mb-3"
                dir="rtl"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-foreground">
                    فیلترهای پیشرفته
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full hover:bg-muted"
                  onClick={() => setModalOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <FilterContent />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
