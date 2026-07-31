// components/search/FilterSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Filter,
  SlidersHorizontal,
  Building2,
  Layers,
  Home,
  Car,
  Smartphone,
  Sofa,
  Shirt,
  Wrench,
  Briefcase,
  Factory,
  Package,
  Tag,
  RefreshCw,
  Check,
  ArrowUpDown,
  ShoppingBag,
  Gem,
  Eye,
  Flame,
  Clock,
  TreePine,
  DoorOpen,
  LandPlot,
} from "lucide-react";
import { Category } from "@/services/api/category.api";
import { Province, City, locationApi } from "@/services/api/location.api";

interface FilterSidebarProps {
  categories: Category[];
  provinces: Province[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedProvince: string;
  setSelectedProvince: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
  isMobile?: boolean;
  sortBy?: string;
  setSortBy?: (v: string) => void;
  adType?: string;
  setAdType?: (v: string) => void;
  propertyType?: string; // اضافه شده
  setPropertyType?: (v: string) => void; // اضافه شده
  onApply?: (filters: DraftFilters) => void;
}

interface DraftFilters {
  category: string;
  province: string;
  city: string;
  sortBy?: string;
  adType?: string;
  propertyType?: string; // اضافه شده
}

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین", icon: Clock },
  { value: "oldest", label: "قدیمی‌ترین", icon: Clock },
  { value: "price_asc", label: "ارزان‌ترین", icon: ShoppingBag },
  { value: "price_desc", label: "گران‌ترین", icon: Gem },
  { value: "most_viewed", label: "پربازدیدترین", icon: Eye },
  { value: "most_saved", label: "محبوب‌ترین", icon: Flame },
];

const AD_TYPES = [
  { value: "", label: "همه نوع" },
  { value: "sale", label: "فروش" },
  { value: "rent", label: "اجاره" },
  { value: "mortgage", label: "رهن" },
  { value: "exchange", label: "معاوضه" },
  { value: "daily_rent", label: "اجاره روزانه" },
];

const PROPERTY_TYPES = [
  { value: "", label: "همه املاک" },
  { value: "apartment", label: "آپارتمان" },
  { value: "villa", label: "ویلایی" },
  { value: "house", label: "خانه حیاط‌دار" },
  { value: "land", label: "زمین" },
  { value: "commercial", label: "مغازه/تجاری" },
  { value: "office", label: "دفتر اداری" },
  { value: "suite", label: "سوئیت" },
  { value: "garden", label: "باغ" },
];

const getCategoryIcon = (iconName?: string) => {
  const props = { className: "w-4 h-4 shrink-0" };
  switch (iconName) {
    case "Home":
      return <Home {...props} />;
    case "Car":
      return <Car {...props} />;
    case "Smartphone":
      return <Smartphone {...props} />;
    case "Sofa":
      return <Sofa {...props} />;
    case "Shirt":
      return <Shirt {...props} />;
    case "Wrench":
      return <Wrench {...props} />;
    case "Briefcase":
      return <Briefcase {...props} />;
    case "Factory":
      return <Factory {...props} />;
    default:
      return <Package {...props} />;
  }
};

export function FilterSidebar({
  categories,
  provinces,
  selectedCategory,
  setSelectedCategory,
  selectedProvince,
  setSelectedProvince,
  selectedCity,
  setSelectedCity,
  clearFilters: externalClearFilters,
  activeFiltersCount,
  isMobile = false,
  sortBy = "newest",
  setSortBy,
  adType = "",
  setAdType,
  propertyType = "",
  setPropertyType,
  onApply,
}: FilterSidebarProps) {
  const [draft, setDraft] = useState<DraftFilters>({
    category: selectedCategory,
    province: selectedProvince,
    city: selectedCity,
    sortBy: sortBy,
    adType: adType,
    propertyType: propertyType,
  });
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setDraft({
      category: selectedCategory,
      province: selectedProvince,
      city: selectedCity,
      sortBy,
      adType,
      propertyType,
    });
  }, [
    selectedCategory,
    selectedProvince,
    selectedCity,
    sortBy,
    adType,
    propertyType,
  ]);

  useEffect(() => {
    if (!draft.province || draft.province === "all") {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    locationApi
      .getCitiesByProvince(draft.province)
      .then(setCities)
      .catch(console.error)
      .finally(() => setCitiesLoading(false));
  }, [draft.province]);

  const hasPendingChanges =
    draft.category !== selectedCategory ||
    draft.province !== selectedProvince ||
    draft.city !== selectedCity ||
    draft.sortBy !== sortBy ||
    draft.adType !== adType ||
    draft.propertyType !== propertyType;

  const handleApply = () => {
    if (onApply) {
      onApply(draft);
    } else {
      setSelectedCategory(draft.category);
      setSelectedProvince(draft.province);
      setSelectedCity(draft.city);
      if (setSortBy) setSortBy(draft.sortBy ?? "newest");
      if (setAdType) setAdType(draft.adType ?? "");
      if (setPropertyType) setPropertyType(draft.propertyType ?? "");
    }
    setSheetOpen(false);
  };

  const handleClear = () => {
    setDraft({
      category: "",
      province: "",
      city: "",
      sortBy: "newest",
      adType: "",
      propertyType: "",
    });
    externalClearFilters();
    setSheetOpen(false);
  };

  const FilterContent = () => (
    <div className="flex flex-col h-full min-h-0 w-full" dir="rtl">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-primary/10">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">فیلترها</p>
            <p className="text-[11px] text-muted-foreground">
              {activeFiltersCount > 0
                ? `${activeFiltersCount} فیلتر فعال`
                : "جستجوی پیشرفته آگهی‌ها"}
            </p>
          </div>
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> پاک کردن همه
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0 pl-1">
        <div className="space-y-5 pb-4">
          {setSortBy && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-foreground/90">
                <ArrowUpDown className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold">مرتب‌سازی نتایج</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {SORT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, sortBy: opt.value }))
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${draft.sortBy === opt.value ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/10" : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <Separator className="mt-4 opacity-60" />
            </div>
          )}

          {setAdType && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-foreground/90">
                <Tag className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold">نوع معامله</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AD_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, adType: t.value }))}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${draft.adType === t.value || (!draft.adType && !t.value) ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/10" : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Separator className="mt-4 opacity-60" />
            </div>
          )}

          {/* فیلتر نوع ملک - جدید اضافه شد */}
          {setPropertyType && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-foreground/90">
                <Building2 className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold">نوع ملک</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, propertyType: t.value }))
                    }
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${draft.propertyType === t.value || (!draft.propertyType && !t.value) ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/10" : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Separator className="mt-4 opacity-60" />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground/90">
              <Layers className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold">دسته‌بندی موضوعی</p>
            </div>
            <div className="flex flex-col gap-1 w-full max-h-[220px] overflow-y-auto rounded-xl border border-border/40 p-1 bg-muted/10">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, category: "" }))}
                className={`w-full text-right px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all ${!draft.category ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <Tag className="w-3.5 h-3.5 shrink-0" />
                <span>همه دسته‌بندی‌ها</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, category: cat.slug }))
                  }
                  className={`w-full text-right px-3 py-2.5 rounded-lg text-[11px] flex items-start gap-2.5 transition-all active:scale-[0.99] ${draft.category === cat.slug ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <span className="flex-1 text-right leading-relaxed whitespace-normal break-words">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
            <Separator className="mt-4 opacity-60" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground/90">
              <Building2 className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold">موقعیت مکانی</p>
            </div>
            <div className="space-y-3 bg-muted/20 border p-3 rounded-xl">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground mr-0.5">
                  استان
                </Label>
                <Select
                  value={draft.province || "all"}
                  onValueChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      province: v === "all" ? "" : v,
                      city: "",
                    }))
                  }
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-background border-border">
                    <SelectValue placeholder="همه استان‌ها" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-xs">
                      همه استان‌ها
                    </SelectItem>
                    {provinces.map((p) => (
                      <SelectItem key={p._id} value={p._id} className="text-xs">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground mr-0.5">
                  شهر
                </Label>
                <Select
                  value={draft.city || "all"}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, city: v === "all" ? "" : v }))
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
                  <SelectContent className="rounded-xl">
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
          </div>
        </div>
      </ScrollArea>

      <div className="pt-3 border-t border-border mt-3 space-y-1.5 flex-shrink-0">
        <Button
          className="w-full rounded-xl gap-2 font-bold h-9 text-xs transition-all bg-primary border-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
          onClick={handleApply}
          disabled={!hasPendingChanges && activeFiltersCount === 0}
        >
          <Check className="w-4 h-4" />{" "}
          {hasPendingChanges ? "اعمال تغییرات فیلتر" : "اعمال فیلترها"}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[11px] text-muted-foreground hover:text-destructive h-8 rounded-xl hover:bg-destructive/5 transition-colors"
            onClick={handleClear}
          >
            پاک کردن تنظیمات
          </Button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 h-9 border-border text-xs font-bold"
          >
            <Filter className="w-4 h-4 text-primary" /> فیلتر پیشرفته آگهی‌ها
            {activeFiltersCount > 0 && (
              <Badge className="rounded-full h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-primary text-primary-foreground border-transparent">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[82vh] rounded-t-3xl p-4 flex flex-col w-full max-w-none bg-card border-t border-border animate-slide-up"
        >
          <FilterContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="sticky top-24 bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col h-[calc(100vh-120px)] w-full overflow-hidden animate-fade-in">
      <FilterContent />
    </div>
  );
}
