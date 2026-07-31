"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Car,
  Smartphone,
  Sofa,
  Shirt,
  Wrench,
  Briefcase,
  Factory,
  Package,
  MapPin,
  Filter,
  X,
  Layers,
  ChevronLeft,
  DollarSign,
  Image as ImageIcon,
  Flame,
} from "lucide-react";
import { Category } from "@/services/api/category.api";
import { Province, City, locationApi } from "@/services/api/location.api";

interface HomeSidebarProps {
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
  onApplyFilters?: (extraFilters: {
    minPrice: string;
    maxPrice: string;
    onlyWithImage: boolean;
    onlyUrgent: boolean;
  }) => void;
  isMobile?: boolean;
  appliedMinPrice?: string;
  appliedMaxPrice?: string;
  appliedOnlyWithImage?: boolean;
  appliedOnlyUrgent?: boolean;
}

const getCategoryIcon = (iconName?: string) => {
  const props = {
    className:
      "w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200 shrink-0",
  };
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

export function HomeSidebar({
  categories,
  provinces,
  selectedCategory,
  setSelectedCategory,
  selectedProvince,
  setSelectedProvince,
  selectedCity,
  setSelectedCity,
  clearFilters,
  activeFiltersCount,
  onApplyFilters,
  isMobile = false,
  appliedMinPrice = "",
  appliedMaxPrice = "",
  appliedOnlyWithImage = false,
  appliedOnlyUrgent = false,
}: HomeSidebarProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [localSelectedProvince, setLocalSelectedProvince] =
    useState(selectedProvince);
  const [localSelectedCity, setLocalSelectedCity] = useState(selectedCity);
  const [localSelectedCategory, setLocalSelectedCategory] =
    useState(selectedCategory);

  const [minPrice, setMinPrice] = useState<string>(appliedMinPrice);
  const [maxPrice, setMaxPrice] = useState<string>(appliedMaxPrice);
  const [onlyWithImage, setOnlyWithImage] =
    useState<boolean>(appliedOnlyWithImage);
  const [onlyUrgent, setOnlyUrgent] = useState<boolean>(appliedOnlyUrgent);

  useEffect(() => {
    setLocalSelectedProvince(selectedProvince);
  }, [selectedProvince]);
  useEffect(() => {
    setLocalSelectedCity(selectedCity);
  }, [selectedCity]);
  useEffect(() => {
    setLocalSelectedCategory(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    setMinPrice(appliedMinPrice);
  }, [appliedMinPrice]);
  useEffect(() => {
    setMaxPrice(appliedMaxPrice);
  }, [appliedMaxPrice]);
  useEffect(() => {
    setOnlyWithImage(appliedOnlyWithImage);
  }, [appliedOnlyWithImage]);
  useEffect(() => {
    setOnlyUrgent(appliedOnlyUrgent);
  }, [appliedOnlyUrgent]);

  useEffect(() => {
    const fetchCities = async () => {
      if (localSelectedProvince && localSelectedProvince !== "all") {
        try {
          const citiesData = await locationApi.getCitiesByProvince(
            localSelectedProvince,
          );
          setCities(citiesData);
        } catch (error) {
          console.error("Error fetching cities:", error);
        }
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [localSelectedProvince]);

  const handleApply = () => {
    setSelectedCategory(localSelectedCategory);
    setSelectedProvince(localSelectedProvince);
    setSelectedCity(localSelectedCity);

    onApplyFilters?.({
      minPrice,
      maxPrice,
      onlyWithImage,
      onlyUrgent,
    });
  };

  const handleClearAll = () => {
    setLocalSelectedCategory("");
    setLocalSelectedProvince("");
    setLocalSelectedCity("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyWithImage(false);
    setOnlyUrgent(false);
    clearFilters();
  };

  const filterContent = (
    <div className="flex flex-col h-full justify-between" dir="rtl">
      <ScrollArea className="h-[calc(100vh-290px)] pl-1">
        <div className="space-y-5 pb-4">
          {/* ۱. دسته‌بندی‌ها */}
          <div>
            <Label className="text-[11px] font-bold text-muted-foreground/80 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              دسته‌بندی آگهی‌ها
            </Label>
            <div className="flex flex-col gap-1 w-full max-h-[180px] overflow-y-auto rounded-xl border border-border/40 p-1 bg-muted/10">
              <button
                type="button"
                onClick={() => setLocalSelectedCategory("")}
                className={`w-full text-right px-3 py-2 rounded-lg text-[11px] font-bold flex items-start gap-2.5 transition-all group ${
                  !localSelectedCategory
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/80 hover:bg-muted"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  <Package
                    className={`w-3.5 h-3.5 ${!localSelectedCategory ? "text-primary-foreground" : "text-muted-foreground"}`}
                  />
                </div>
                <span className="flex-1 text-right leading-relaxed whitespace-normal break-words">
                  همه دسته‌بندی‌ها
                </span>
                <ChevronLeft
                  className={`w-3.5 h-3.5 opacity-40 shrink-0 self-center ${!localSelectedCategory ? "text-primary-foreground opacity-100" : "group-hover:opacity-100 group-hover:-translate-x-0.5"}`}
                />
              </button>

              {categories.map((cat) => {
                const isSelected = localSelectedCategory === cat.slug;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setLocalSelectedCategory(cat.slug)}
                    className={`w-full text-right px-3 py-2 rounded-lg text-[11px] flex items-start gap-2.5 transition-all group ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`shrink-0 mt-0.5 ${isSelected ? "[&_svg]:text-primary-foreground" : ""}`}
                    >
                      {getCategoryIcon(cat.icon)}
                    </div>
                    <span className="flex-1 text-right leading-relaxed whitespace-normal break-words">
                      {cat.name}
                    </span>
                    <ChevronLeft
                      className={`w-3.5 h-3.5 opacity-0 shrink-0 self-center transition-all ${isSelected ? "text-primary-foreground opacity-100" : "group-hover:opacity-60 group-hover:-translate-x-0.5"}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ۲. محدوده قیمت */}
          <div className="border-t border-border/40 pt-4">
            <Label className="text-[11px] font-bold text-muted-foreground/80 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              محدوده قیمت (تومان)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground mr-0.5">
                  از (حداقل)
                </span>
                <Input
                  type="number"
                  placeholder="کمترین"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="rounded-xl h-9 text-xs bg-background text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground mr-0.5">
                  تا (حداکثر)
                </span>
                <Input
                  type="number"
                  placeholder="بیشترین"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="rounded-xl h-9 text-xs bg-background text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* ۳. سوئیچ‌های گرافیکی واقعی جدید */}
          <div className="border-t border-border/40 pt-4 space-y-3">
            {/* سوئیچ عکس‌دار */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/40 cursor-pointer select-none transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  فقط آگهی‌های عکس‌دار
                </span>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={onlyWithImage}
                  onChange={(e) => setOnlyWithImage(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-muted-foreground/30 rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>

            {/* سوئیچ آگهی فوری */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/40 cursor-pointer select-none transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-medium text-foreground">
                  فقط آگهی‌های فوری
                </span>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={onlyUrgent}
                  onChange={(e) => setOnlyUrgent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-muted-foreground/30 rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-500"></div>
              </div>
            </label>
          </div>

          {/* ۴. موقعیت مکانی */}
          <div className="border-t border-border/40 pt-4">
            <Label className="text-[11px] font-bold text-muted-foreground/80 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              موقعیت مکانی نتایج
            </Label>
            <div className="space-y-2.5 bg-muted/20 border border-border/50 p-2.5 rounded-xl">
              <div className="space-y-1">
                <Select
                  value={localSelectedProvince || "all"}
                  onValueChange={(v) => {
                    setLocalSelectedProvince(v === "all" ? "" : v);
                    setLocalSelectedCity("");
                  }}
                >
                  <SelectTrigger className="rounded-xl h-9 text-xs bg-background border-border/80">
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
                <Select
                  value={localSelectedCity || "all"}
                  onValueChange={(v) =>
                    setLocalSelectedCity(v === "all" ? "" : v)
                  }
                  disabled={!localSelectedProvince}
                >
                  <SelectTrigger className="rounded-xl h-9 text-xs bg-background border-border/80">
                    <SelectValue
                      placeholder={
                        localSelectedProvince
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

      <div className="pt-3 border-t border-border/40 bg-background mt-auto flex-shrink-0">
        <Button
          onClick={handleApply}
          className="w-full rounded-xl h-9 text-xs font-bold bg-primary border-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]"
        >
          اعمال فیلترها
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 border-border/80 font-bold text-xs h-9"
          >
            <Filter className="w-3.5 h-3.5 text-primary" />
            فیلترها
            {activeFiltersCount > 0 && (
              <Badge className="rounded-full h-4 min-w-4 p-0 flex items-center justify-center bg-primary text-primary-foreground text-[9px] font-bold">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-3xl p-0 overflow-hidden bg-card border-t border-border animate-slide-up"
        >
          <div
            className="p-4 border-b border-border sticky top-0 bg-background z-10 flex justify-between items-center"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="font-bold text-xs text-foreground">
                تنظیم فیلترها
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="gap-1 h-7 text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg"
            >
              <X className="w-3 h-3" /> پاک کردن همه
            </Button>
          </div>
          <div className="p-4 h-[calc(100%-65px)]">{filterContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // به‌جای استفاده از PanelSidebar که children قبول نمی‌کند،
  // مستقیماً محتوای فیلترها را در یک div با استایل مناسب رندر می‌کنیم
  return (
    <div className="w-full shrink-0 border border-border/40 bg-card/70 backdrop-blur-md rounded-2xl p-3 shadow-sm animate-fade-in">
      {filterContent}
    </div>
  );
}
