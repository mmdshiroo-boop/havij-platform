"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SlidersHorizontal,
  MapPin,
  Home,
  Car,
  Laptop,
  Briefcase,
  ChevronDown,
  Calculator,
  Layers,
} from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "@/components/ui/badge";
import { locationApi } from "@/services/api/location.api";
import { cn } from "@/lib/utils";

interface FilterModalProps {
  categories: any[];
  provinces: any[];
  priceRange: { min: number; max: number };
  selectedCategory: string;
  selectedProvince: string;
  selectedCity: string;
  minPrice: number;
  maxPrice: number;
  adType: string;
  sortBy: string;
  rooms?: string;
  activeFiltersCount: number;
  onApply: (draft: any) => void;
  clearFilters: () => void;
}

const getCategoryType = (slug: string): string => {
  const realEstateSlugs = [
    "land-garden",
    "forsale",
    "apartment-for-sale",
    "apartment-for-rent",
    "villa-for-sale",
    "commercial-industrial",
    "commercial-rent",
    "pre-sale-construction",
    "short-term-rental",
    "real-estate",
  ];
  const vehicleSlugs = ["cars", "sedan", "motorcycle"];
  const digitalSlugs = ["mobile-phones", "laptops", "electronics"];
  const jobSlugs = ["jobs", "programming", "marketing"];
  const homeSlugs = ["home-appliances"];
  const serviceSlugs = ["services"];
  const personalSlugs = ["personal"];
  const hobbySlugs = ["entertainment", "sports"];
  const industrialSlugs = ["industrial", "equipment"];

  if (realEstateSlugs.includes(slug)) return "real-estate";
  if (vehicleSlugs.includes(slug)) return "vehicles";
  if (digitalSlugs.includes(slug)) return "digital";
  if (jobSlugs.includes(slug)) return "jobs";
  if (homeSlugs.includes(slug)) return "home";
  if (serviceSlugs.includes(slug)) return "services";
  if (personalSlugs.includes(slug)) return "personal";
  if (hobbySlugs.includes(slug)) return "hobby";
  if (industrialSlugs.includes(slug)) return "industrial";
  return "other";
};

export function FilterModal({
  categories = [],
  provinces = [],
  priceRange,
  selectedCategory,
  selectedProvince,
  selectedCity,
  minPrice: currentMinPrice,
  maxPrice: currentMaxPrice,
  adType: currentAdType,
  sortBy: currentSortBy,
  rooms: currentRooms = "any",
  activeFiltersCount,
  onApply,
  clearFilters,
}: FilterModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draftCategory, setDraftCategory] = useState(selectedCategory);
  const [draftProvince, setDraftProvince] = useState(selectedProvince);
  const [draftCity, setDraftCity] = useState(selectedCity);
  const [draftAdType, setDraftAdType] = useState(currentAdType);
  const [draftSortBy, setDraftSortBy] = useState(currentSortBy);
  const [minPriceInput, setMinPriceInput] = useState(
    currentMinPrice && currentMinPrice > priceRange?.min
      ? String(currentMinPrice)
      : "",
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    currentMaxPrice && currentMaxPrice < priceRange?.max
      ? String(currentMaxPrice)
      : "",
  );

  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState(currentRooms);
  const [estateType, setEstateType] = useState("");
  const [ageOfBuilding, setAgeOfBuilding] = useState("");

  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleMileage, setVehicleMileage] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");

  const [digitalBrand, setDigitalBrand] = useState("");
  const [itemStatus, setItemStatus] = useState("");

  const [jobCooperation, setJobCooperation] = useState("");
  const [jobExperience, setJobExperience] = useState("");

  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [pricePerMeter, setPricePerMeter] = useState(0);

  const categoryType = getCategoryType(draftCategory);

  useEffect(() => {
    if (!draftProvince) {
      setCitiesList([]);
      return;
    }
    setCitiesLoading(true);
    locationApi
      .getCitiesByProvince(draftProvince)
      .then(setCitiesList)
      .catch(console.error)
      .finally(() => setCitiesLoading(false));
  }, [draftProvince]);

  useEffect(() => {
    if (open) {
      setDraftCategory(selectedCategory);
      setDraftProvince(selectedProvince);
      setDraftCity(selectedCity);
      setDraftAdType(currentAdType);
      setDraftSortBy(currentSortBy);
      setRooms(currentRooms);
      setMinPriceInput(
        currentMinPrice && currentMinPrice > priceRange?.min
          ? String(currentMinPrice)
          : "",
      );
      setMaxPriceInput(
        currentMaxPrice && currentMaxPrice < priceRange?.max
          ? String(currentMaxPrice)
          : "",
      );
    }
  }, [
    open,
    selectedCategory,
    selectedProvince,
    selectedCity,
    currentAdType,
    currentSortBy,
    currentRooms,
    currentMinPrice,
    currentMaxPrice,
    priceRange,
  ]);

  useEffect(() => {
    const totalPrice = Number(maxPriceInput) || Number(minPriceInput);
    const areaValue = Number(area);
    if (categoryType === "real-estate" && totalPrice > 0 && areaValue > 0) {
      setPricePerMeter(Math.floor(totalPrice / areaValue));
    } else {
      setPricePerMeter(0);
    }
  }, [minPriceInput, maxPriceInput, area, categoryType]);

  const handleApply = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const filters: any = {
        category: draftCategory,
        province: draftProvince,
        city: draftCity,
        adType: draftAdType,
        sortBy: draftSortBy,
        minPrice: Number(minPriceInput) || undefined,
        maxPrice: Number(maxPriceInput) || undefined,
      };

      if (categoryType === "real-estate") {
        if (rooms && rooms !== "any") filters.rooms = rooms;
        if (area) filters.area = Number(area);
        if (estateType) filters.estateType = estateType;
        if (ageOfBuilding) filters.ageOfBuilding = ageOfBuilding;
      }
      if (categoryType === "vehicles") {
        if (vehicleBrand) filters.vehicleBrand = vehicleBrand;
        if (vehicleMileage) filters.vehicleMileage = Number(vehicleMileage);
        if (fuelType) filters.fuelType = fuelType;
        if (transmission) filters.transmission = transmission;
      }
      if (categoryType === "digital") {
        if (digitalBrand) filters.digitalBrand = digitalBrand;
        if (itemStatus) filters.itemStatus = itemStatus;
      }
      if (categoryType === "jobs") {
        if (jobCooperation) filters.jobCooperation = jobCooperation;
        if (jobExperience) filters.jobExperience = jobExperience;
      }

      onApply(filters);
      setIsSubmitting(false);
      setOpen(false);
    }, 150);
  };

  const handleReset = () => {
    setDraftCategory("");
    setDraftProvince("");
    setDraftCity("");
    setDraftAdType("");
    setDraftSortBy("newest");
    setMinPriceInput("");
    setMaxPriceInput("");
    setRooms("any");
    setArea("");
    setEstateType("");
    setAgeOfBuilding("");
    setVehicleBrand("");
    setVehicleMileage("");
    setFuelType("");
    setTransmission("");
    setDigitalBrand("");
    setItemStatus("");
    setJobCooperation("");
    setJobExperience("");
    clearFilters();
  };

  const selectedCategoryName =
    categories.find((c) => c.slug === draftCategory)?.name || "";

  // محاسبه استایل‌های رنج اسلایدر قیمت به صورت استاندارد
  const sliderRight = `${(((Number(minPriceInput) || 0) - 0) / (100000000000 - 0)) * 100}%`;
  const sliderLeft = `${100 - (((Number(maxPriceInput) || 100000000000) - 0) / (100000000000 - 0)) * 100}%`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative gap-2.5 rounded-xl text-xs font-bold h-11 px-5 transition-all active:scale-95 shadow-sm",
            activeFiltersCount > 0
              ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400"
              : "border-border bg-background hover:bg-muted/50",
          )}
        >
          <SlidersHorizontal
            className={cn(
              "h-4 w-4",
              activeFiltersCount > 0
                ? "text-orange-500"
                : "text-muted-foreground",
            )}
          />
          <span>جستجوی پیشرفته</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="w-full max-w-full sm:max-w-2xl h-[100vh] sm:h-[85vh] flex flex-col p-0  overflow-hidden rounded-none sm:rounded-2xl bg-background border-none shadow-2xl"
        dir="rtl"
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        {/* هدر مودال */}
        <DialogHeader className="p-4 sm:p-5 px-6 border-b border-border bg-muted/30 backdrop-blur-md">
          <DialogTitle className="text-sm sm:text-base font-black flex items-center justify-between w-full text-foreground">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-right">
                <span>فیلترهای هوشمند</span>
                <span className="text-[10px] font-medium text-muted-foreground">
                </span>
              </div>
            </div>
            {selectedCategoryName && (
              <Badge className="bg-primary/10 mx-10 text-primary border border-primary/20 text-[11px] font-bold py-0.5 px-1.5 rounded-lg">
                {selectedCategoryName}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* محتوای اسکرول شونده با ساختار منظم فاصله‌ها */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* بخش ۱: انتخاب دسته‌بندی */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs text-foreground">
                دسته‌بندی‌ها
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-2 border border-border rounded-xl bg-muted/20">
              {categories.map((cat) => {
                const isSelected = draftCategory === cat.slug;
                return (
                  <Badge
                    key={cat._id}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer py-1.5 px-3 text-xs rounded-lg transition-all font-medium",
                      isSelected &&
                        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
                    )}
                    onClick={() => setDraftCategory(cat.slug)}
                  >
                    {cat.name}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* بخش ۲: موقعیت مکانی */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs text-foreground">
                موقعیت مکانی
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative group flex items-center">
                <select
                  value={draftProvince}
                  onChange={(e) => {
                    setDraftProvince(e.target.value);
                    setDraftCity("");
                  }}
                  className="w-full h-11 pr-10 pl-10 text-xs font-bold text-foreground rounded-xl bg-muted/30 border border-border appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  <option value="">انتخاب استان...</option>
                  {provinces.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute right-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <ChevronDown className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative group flex items-center">
                <select
                  value={draftCity}
                  onChange={(e) => setDraftCity(e.target.value)}
                  disabled={!draftProvince || citiesLoading}
                  className="w-full h-11 pr-10 pl-10 text-xs font-bold text-foreground rounded-xl bg-muted/30 border border-border appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-40"
                >
                  <option value="">
                    {citiesLoading ? "در حال دریافت..." : "انتخاب شهر..."}
                  </option>
                  {citiesList.map((city: any) => (
                    <option key={city._id || city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute right-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <ChevronDown className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* بخش ۳: رنج قیمت */}
          <div className="space-y-4 p-4 sm:p-5 rounded-xl border border-border bg-muted/10 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-primary" />
                <h3 className="font-bold text-xs text-foreground">
                  بازه بودجه مورد نظر
                </h3>
              </div>
              <span className="text-xs font-black tracking-tight text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                {(() => {
                  const minVal = Number(minPriceInput) || 0;
                  const maxVal = Number(maxPriceInput) || 100000000000;
                  if (minVal === 0 && maxVal === 100000000000)
                    return "محدوده قیمت آزاد";
                  return `${(minVal / 1000000000).toLocaleString("fa-IR")} تا ${(maxVal / 1000000000).toLocaleString("fa-IR")} میلیارد تومان`;
                })()}
              </span>
            </div>

            {/* اسلایدر قیمت */}
            <div className="relative pt-4 pb-2 px-1 select-none">
              <div className="relative w-full h-2 rounded-full bg-muted">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-primary to-primary/70 shadow-sm"
                  style={{ right: sliderRight, left: sliderLeft }}
                />
                <input
                  type="range"
                  min={0}
                  max={100000000000}
                  step={100000000}
                  value={Number(minPriceInput) || 0}
                  onChange={(e) => {
                    const newMin = Number(e.target.value);
                    const currentMax = Number(maxPriceInput) || 100000000000;
                    if (newMin <= currentMax) setMinPriceInput(String(newMin));
                  }}
                  className="absolute inset-0 w-full h-full bg-transparent appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab"
                />
                <input
                  type="range"
                  min={0}
                  max={100000000000}
                  step={100000000}
                  value={Number(maxPriceInput) || 100000000000}
                  onChange={(e) => {
                    const newMax = Number(e.target.value);
                    const currentMin = Number(minPriceInput) || 0;
                    if (newMax >= currentMin) setMaxPriceInput(String(newMax));
                  }}
                  className="absolute inset-0 w-full h-full bg-transparent appearance-none pointer-events-none z-25 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab"
                />
              </div>
              <div className="flex justify-between mt-3 text-[10px] font-bold text-muted-foreground px-0.5">
                <span>۰</span>
                <span>۲۵ میلیارد</span>
                <span>۵۰ میلیارد</span>
                <span>۷۵ میلیارد</span>
                <span>۱۰۰ میلیارد</span>
              </div>
            </div>

            {/* فیلدهای ورودی رنج قیمت با ساختار گرید متقارن */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground block pr-1">
                  از قیمت (میلیارد تومان)
                </span>
                <Input
                  value={
                    minPriceInput
                      ? (Number(minPriceInput) / 1000000000).toFixed(1)
                      : ""
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinPriceInput(
                      isNaN(val) || val === 0
                        ? ""
                        : String(Math.floor(val * 1000000000)),
                    );
                  }}
                  className="rounded-xl h-11 text-xs font-black bg-background"
                  type="number"
                  step="0.1"
                  placeholder="کف قیمت"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground block pr-1">
                  تا قیمت (میلیارد تومان)
                </span>
                <Input
                  value={
                    maxPriceInput && Number(maxPriceInput) < 100000000000
                      ? (Number(maxPriceInput) / 1000000000).toFixed(1)
                      : ""
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxPriceInput(
                      isNaN(val) || val === 0
                        ? ""
                        : String(Math.floor(val * 1000000000)),
                    );
                  }}
                  className="rounded-xl h-11 text-xs font-black bg-background"
                  type="number"
                  step="0.1"
                  placeholder="سقف قیمت"
                />
              </div>
            </div>
          </div>

          {/* ==================== بخش فیلدهای اختصاصی داینامیک ==================== */}

          {/* فیلتر املاک */}
          {categoryType === "real-estate" && (
            <div className="space-y-4 p-5 border border-primary/20 rounded-xl bg-primary/5">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Home className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-black text-primary">
                  پارامترهای فنی ملک و ساختمان
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    متراژ (متر مربع)
                  </label>
                  <Input
                    placeholder="مثلاً ۱۰۰"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="rounded-xl h-11 text-xs bg-background"
                    type="number"
                  />
                </div>
                <div className="space-y-1.5 relative flex flex-col justify-end">
                  <label className="text-[11px] font-bold text-muted-foreground mb-1.5">
                    نوع ملک
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={estateType}
                      onChange={(e) => setEstateType(e.target.value)}
                      className="w-full h-11 pr-4 pl-10 text-xs font-bold rounded-xl bg-background border border-border appearance-none focus:outline-none focus:border-primary"
                    >
                      <option value="">همه موارد</option>
                      <option value="apartment">آپارتمان مسکونی</option>
                      <option value="villa">ویلایی / مستغلات</option>
                      <option value="land">زمین / کلنگی</option>
                      <option value="commercial">دفتر کار / تجاری</option>
                    </select>
                    <ChevronDown className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5 relative flex flex-col justify-end">
                  <label className="text-[11px] font-bold text-muted-foreground mb-1.5">
                    سن بنا
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={ageOfBuilding}
                      onChange={(e) => setAgeOfBuilding(e.target.value)}
                      className="w-full h-11 pr-4 pl-10 text-xs font-bold rounded-xl bg-background border border-border appearance-none focus:outline-none focus:border-primary"
                    >
                      <option value="">مهم نیست</option>
                      <option value="0">نوساز کلید نخورده</option>
                      <option value="5">تا ۵ سال</option>
                      <option value="10">تا ۱۰ سال</option>
                      <option value="20">بالای ۲۰ سال</option>
                    </select>
                    <ChevronDown className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    تعداد اتاق خواب
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { value: "any", label: "مهم" },
                      { value: "0", label: "بدون خواب" },
                      { value: "1", label: "۱" },
                      { value: "2", label: "۲" },
                      { value: "3", label: "۳" },
                    ].map((item) => (
                      <Badge
                        key={item.value}
                        variant={rooms === item.value ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer py-1.5 px-3 rounded-lg text-xs",
                          rooms === item.value &&
                            "bg-primary text-primary-foreground",
                        )}
                        onClick={() => setRooms(item.value)}
                      >
                        {item.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {pricePerMeter > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-background text-[11px] border border-border font-medium text-muted-foreground">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span>میانگین قیمت تخمینی هر متر مربع: </span>
                  <span className="font-black text-primary">
                    {pricePerMeter.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              )}
            </div>
          )}

          {/* فیلتر وسایل نقلیه */}
          {categoryType === "vehicles" && (
            <div className="space-y-4 p-5 border border-border rounded-xl bg-muted/20">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Car className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-black text-foreground">
                  مشخصات فنی وسیله نقلیه
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    برند خودرو
                  </label>
                  <Input
                    placeholder="مثال: پژو ۲۰۷"
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    className="rounded-xl h-11 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    حداکثر کارکرد (کیلومتر)
                  </label>
                  <Input
                    placeholder="مثال: ۵۰۰۰۰"
                    value={vehicleMileage}
                    onChange={(e) => setVehicleMileage(e.target.value)}
                    className="rounded-xl h-11 text-xs bg-background"
                    type="number"
                  />
                </div>
                <div className="space-y-1.5 relative flex flex-col justify-end">
                  <label className="text-[11px] font-bold text-muted-foreground mb-1.5">
                    نوع گیربکس
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full h-11 pr-4 pl-10 text-xs font-bold rounded-xl bg-background border border-border appearance-none focus:outline-none focus:border-primary"
                    >
                      <option value="">همه گیربکس‌ها</option>
                      <option value="manual">دنده‌ای (دستی)</option>
                      <option value="automatic">اتوماتیک</option>
                    </select>
                    <ChevronDown className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5 relative flex flex-col justify-end">
                  <label className="text-[11px] font-bold text-muted-foreground mb-1.5">
                    نوع سوخت
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full h-11 pr-4 pl-10 text-xs font-bold rounded-xl bg-background border border-border appearance-none focus:outline-none focus:border-primary"
                    >
                      <option value="">همه سوخت‌ها</option>
                      <option value="gasoline">بنزینی</option>
                      <option value="hybrid">هیبرید / برقی</option>
                    </select>
                    <ChevronDown className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* فیلتر کالای دیجیتال */}
          {categoryType === "digital" && (
            <div className="space-y-4 p-5 border border-border rounded-xl bg-muted/20">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Laptop className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-black text-foreground">
                  مشخصات کالای دیجیتال
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    برند یا مدل دستگاه
                  </label>
                  <Input
                    placeholder="مثال: Apple یا Asus"
                    value={digitalBrand}
                    onChange={(e) => setDigitalBrand(e.target.value)}
                    className="rounded-xl h-11 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5 relative flex flex-col justify-end">
                  <label className="text-[11px] font-bold text-muted-foreground mb-1.5">
                    وضعیت کالا
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={itemStatus}
                      onChange={(e) => setItemStatus(e.target.value)}
                      className="w-full h-11 pr-4 pl-10 text-xs font-bold rounded-xl bg-background border border-border appearance-none focus:outline-none focus:border-primary"
                    >
                      <option value="">همه وضعیت‌ها</option>
                      <option value="new">نو / آکبند</option>
                      <option value="used">دست دوم / در حد نو</option>
                    </select>
                    <ChevronDown className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* فیلتر مشاغل و استخدام */}
          {categoryType === "jobs" && (
            <div className="space-y-4 p-5 border border-border rounded-xl bg-muted/20">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Briefcase className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-black text-foreground">
                  شرایط و اطلاعات شغلی
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 relative flex flex-col justify-end">
                  <label className="text-[11px] font-bold text-muted-foreground mb-1.5">
                    نوع همکاری
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={jobCooperation}
                      onChange={(e) => setJobCooperation(e.target.value)}
                      className="w-full h-11 pr-4 pl-10 text-xs font-bold rounded-xl bg-background border border-border appearance-none focus:outline-none focus:border-primary"
                    >
                      <option value="">مهم نیست</option>
                      <option value="full_time">تمام وقت</option>
                      <option value="part_time">پاره وقت</option>
                      <option value="remote">دورکاری / پروژه ای</option>
                    </select>
                    <ChevronDown className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5 relative flex flex-col justify-end">
                  <label className="text-[11px] font-bold text-muted-foreground mb-1.5">
                    سابقه کار مورد نیاز
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={jobExperience}
                      onChange={(e) => setJobExperience(e.target.value)}
                      className="w-full h-11 pr-4 pl-10 text-xs font-bold rounded-xl bg-background border border-border appearance-none focus:outline-none focus:border-primary"
                    >
                      <option value="">مهم نیست</option>
                      <option value="none">بدون نیاز به سابقه</option>
                      <option value="1-3">۱ تا ۳ سال</option>
                      <option value="3-plus">بالای ۳ سال</option>
                    </select>
                    <ChevronDown className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* فوتر ثابت مودال */}
        <div className="p-4 px-6 border-t border-border bg-muted/40 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11 px-4 rounded-xl"
          >
            حذف فیلترها
          </Button>
          <Button
            onClick={handleApply}
            disabled={isSubmitting}
            className="text-xs font-black h-11 px-8 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground min-w-[140px]"
          >
            {isSubmitting ? "در حال اعمال..." : "اعمال فیلترها"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
