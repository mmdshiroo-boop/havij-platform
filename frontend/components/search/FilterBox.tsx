"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { Province, City, locationApi } from "@/services/api/location.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SearchBoxProps {
  placeholder?: string;
  className?: string;
  onSearch?: (filters: {
    q?: string;
    city?: string;
    province?: string;
    propertyType?: string;
    adType?: string;
  }) => void;
}

// ─── دیکشنری تشخیص هوشمند کلمات کلیدی ───
const SMART_KEYWORDS = {
  propertyTypes: [
    { key: "ویلا", value: "villa" },
    { key: "ویلایی", value: "villa" },
    { key: "آپارتمان", value: "apartment" },
    { key: "خانه", value: "house" },
    { key: "سوئیت", value: "suite" },
    { key: "استودیو", value: "suite" },
    { key: "مغازه", value: "commercial" },
    { key: "تجاری", value: "commercial" },
    { key: "دفتر", value: "office" },
    { key: "اداری", value: "office" },
    { key: "باغ", value: "garden" },
    { key: "زمین", value: "land" },
    { key: "پنت", value: "penthouse" },
    { key: "دوبلکس", value: "duplex" },
  ],
  adTypes: [
    { key: "اجاره", value: "rent" },
    { key: "فروش", value: "sale" },
    { key: "رهن", value: "mortgage" },
    { key: "روزانه", value: "daily_rent" },
    { key: "معاوضه", value: "exchange" },
    { key: "پیش فروش", value: "presale" },
    { key: "پیش‌فروش", value: "presale" },
  ],
};

export function SearchBox({
  placeholder = "جستجو در آگهی‌ها (مثلا: اجاره ویلا)...",
  className = "",
  onSearch,
}: SearchBoxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── State های جستجو و موقعیت قطعی شده ───
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedProvinceName, setSelectedProvinceName] = useState("");
  const [selectedCityName, setSelectedCityName] = useState(searchParams.get("city") || "");

  // ─── State های مربوط به دیالوگ و انتخاب موقت ───
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"province" | "city">("province");
  const [searchLocationQuery, setSearchLocationQuery] = useState("");
  const [tempProvince, setTempProvince] = useState<{ _id: string; name: string } | null>(null);
  const [tempCity, setTempCity] = useState<string>("");

  // ─── State های داده‌های پایه ───
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // ─── ۱. دریافت تمام استان‌ها در ابتدای لود ───
  useEffect(() => {
    let isMounted = true;
    async function fetchProvinces() {
      try {
        const data = await locationApi.getProvinces();
        if (isMounted) setProvinces(data);
      } catch (error) {
        console.error("خطا در دریافت استان‌ها:", error);
        toast.error("خطا در برقراری ارتباط با سرور برای دریافت استان‌ها");
      }
    }
    fetchProvinces();
    return () => { isMounted = false; };
  }, []);

  // ─── ۲. همگام‌سازی State با URL Params (بعد از لود استان‌ها) ───
  useEffect(() => {
    const qParam = searchParams.get("q");
    const cityParam = searchParams.get("city");
    const provinceParam = searchParams.get("province");

    if (qParam !== null) setQuery(qParam);
    if (cityParam !== null) setSelectedCityName(cityParam);

    if (provinceParam && provinces.length > 0) {
      const foundProv = provinces.find(
        (p) => p._id === provinceParam || p.name === provinceParam
      );
      if (foundProv) {
        setSelectedProvinceName(foundProv.name);
        setTempProvince({ _id: foundProv._id, name: foundProv.name });
      } else {
        setSelectedProvinceName(provinceParam);
      }
    }
  }, [searchParams, provinces]);

  // ─── ۳. دریافت شهرهای یک استان هنگام انتخاب موقت ───
  useEffect(() => {
    let isMounted = true;
    async function fetchCities() {
      if (!tempProvince?._id) {
        setCities([]);
        return;
      }
      setIsLoadingCities(true);
      try {
        const data = await locationApi.getCitiesByProvince(tempProvince._id);
        if (isMounted) setCities(data);
      } catch (error) {
        console.error("خطا در دریافت شهرهای استان:", error);
      } finally {
        if (isMounted) setIsLoadingCities(false);
      }
    }
    fetchCities();
    return () => { isMounted = false; };
  }, [tempProvince?._id]);

  // ─── منطق اجرای جستجو ───
  const executeSearch = useCallback(
    (searchQ?: string, searchCity?: string, searchProvinceId?: string) => {
      const params = new URLSearchParams();
      const finalQ = searchQ?.trim() || "";

      let smartPropertyType = "";
      let smartAdType = "";

      // استخراج کلمات کلیدی هوشمند
      if (finalQ) {
        SMART_KEYWORDS.propertyTypes.forEach((pt) => {
          if (finalQ.includes(pt.key)) smartPropertyType = pt.value;
        });
        SMART_KEYWORDS.adTypes.forEach((at) => {
          if (finalQ.includes(at.key)) smartAdType = at.value;
        });
      }

      // تنظیم پارامترها
      if (finalQ) params.set("q", finalQ);
      if (searchCity) params.set("city", searchCity);
      
      const pId = searchProvinceId !== undefined ? searchProvinceId : tempProvince?._id;
      if (pId) params.set("province", pId);

      if (smartPropertyType) params.set("propertyType", smartPropertyType);
      if (smartAdType) params.set("adType", smartAdType);

      params.set("page", "1");

      if (onSearch) {
        onSearch({
          q: finalQ,
          city: searchCity,
          province: pId || undefined,
          propertyType: smartPropertyType || undefined,
          adType: smartAdType || undefined,
        });
      } else {
        router.push(`/search?${params.toString()}`, { scroll: false });
      }
    },
    [onSearch, router, tempProvince?._id]
  );

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(query, selectedCityName || undefined);
  };

  // ─── مدیریت رویدادهای انتخاب مکان ───
  const handleProvinceSelect = (provId: string, provName: string) => {
    setTempProvince({ _id: provId, name: provName });
    setTempCity("");
    setSearchLocationQuery("");
    setStep("city");
  };

  const finalizeLocation = (provName: string, cityName: string, provId?: string) => {
    setSelectedProvinceName(provName);
    setSelectedCityName(cityName);
    setIsOpen(false);
    setSearchLocationQuery("");
    executeSearch(query, cityName || undefined, provId);
  };

  const handleConfirmLocation = () => {
    finalizeLocation(tempProvince?.name || "", tempCity, tempProvince?._id);
  };

  const clearLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempProvince(null);
    setTempCity("");
    setSelectedProvinceName("");
    setSelectedCityName("");
    setStep("province");
    executeSearch(query, undefined, "");
  };

  // ─── مکان‌یابی هوشمند (نشان) ───
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("مرورگر شما از قابلیت تشخیص موقعیت مکانی پشتیبانی نمی‌کند.");
      return;
    }
    
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.neshan.org/v5/reverse?lat=${latitude}&lng=${longitude}`,
            {
              headers: {
                // هشدار: بهتر است این کلید از process.env خوانده شود
                "Api-Key": "service.f3da8afc6b384ab5bda01e3375e1f3f5", 
              },
            }
          );
          
          if (!response.ok) throw new Error("Network response was not ok");
          
          const data = await response.json();
          const city = data.city || data.municipality_zone || "نامشخص";
          const province = data.state || "نامشخص";

          const foundProvince = provinces.find(
            (p) => p?.name?.includes(province) || province.includes(p?.name)
          );
          const provinceId = foundProvince ? foundProvince._id : "";

          if (provinceId) {
            setTempProvince({ _id: provinceId, name: foundProvince?.name || province });
          }

          setTempCity(city);
          const finalCity = city !== "نامشخص" ? city : undefined;
          
          finalizeLocation(foundProvince?.name || province, city, provinceId);
          toast.success(`موقعیت شما شناسایی شد: ${foundProvince?.name || province}، ${city}`);
          
        } catch (error) {
          console.error("Error detecting location:", error);
          toast.error("خطا در تطبیق موقعیت با پایگاه داده");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        toast.error("خطا در دریافت مختصات جغرافیایی. لطفاً دسترسی مرورگر را بررسی کنید.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─── فیلتر کردن لیست‌ها بر اساس جستجو در دیالوگ ───
  const safeSearch = searchLocationQuery.trim();
  const filteredProvinces = useMemo(() => 
    provinces.filter((p) => p?.name?.includes(safeSearch)),
  [provinces, safeSearch]);

  const filteredCities = useMemo(() => 
    cities.filter((c) => c?.name?.includes(safeSearch)),
  [cities, safeSearch]);

  return (
    <form onSubmit={handleSearchSubmit} className={cn("w-full", className)} dir="rtl">
      <div className="flex items-center bg-card text-card-foreground border border-border rounded-2xl px-3 md:px-4 shadow-xs transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 w-full h-12">
        
        {/* بخش ورودی متن جستجو */}
        <div className="relative flex-1 h-full flex items-center gap-1 bg-transparent">
          <button
            type="submit"
            className="p-2 text-muted-foreground hover:text-primary rounded-xl transition-colors shrink-0 bg-transparent cursor-pointer"
            aria-label="جستجو"
          >
            <Search className="h-5 w-5 transition-transform active:scale-95" />
          </button>
          
          <Input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-full border-0 bg-transparent px-1 text-foreground text-[14px] font-bold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 shadow-none"
          />
          
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                executeSearch("", selectedCityName || undefined, tempProvince?._id);
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full ml-1 bg-transparent cursor-pointer"
              aria-label="پاک کردن متن جستجو"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="h-6 w-[1px] bg-border mx-1 md:mx-2 shrink-0" />

        {/* بخش انتخاب موقعیت مکانی (دیالوگ) */}
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setSearchLocationQuery("");
              // بازگردانی state موقت به مقادیر تایید شده در صورت بستن بدون تایید
              if (selectedProvinceName === "") {
                  setStep("province");
              }
            }
          }}
        >
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 h-9 bg-transparent hover:bg-muted/50 text-[13px] font-bold text-foreground rounded-xl px-2.5 md:px-3.5 transition-all shrink-0 max-w-[130px] sm:max-w-[180px] md:max-w-[240px] select-none cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-muted-foreground/80 shrink-0" />
              <span className="truncate text-ellipsis overflow-hidden whitespace-nowrap block">
                {selectedCityName
                  ? `${selectedProvinceName}، ${selectedCityName}`
                  : selectedProvinceName || "همهٔ ایران"}
              </span>
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-[480px] w-[95%] rounded-2xl p-0 overflow-hidden border border-border bg-popover shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* هدر دیالوگ */}
            <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between gap-2 space-y-0">
              <div className="flex items-center gap-2">
                {step === "city" && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("province");
                      setSearchLocationQuery("");
                    }}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                <DialogTitle className="text-base font-black text-popover-foreground">
                  {step === "province" ? "انتخاب استان" : `انتخاب شهر (${tempProvince?.name})`}
                </DialogTitle>
              </div>
            </DialogHeader>

            {/* دکمه موقعیت یابی خودکار */}
            <div className="p-4 pb-2 bg-muted/20 border-b border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="w-full justify-center gap-2 rounded-xl h-11 text-xs font-bold border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> در حال بازیابی موقعیت فعلی شما...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 text-primary fill-primary/10" /> شناسایی هوشمند شهر من (مکان‌یاب)
                  </>
                )}
              </Button>
            </div>

            {/* نوار جستجوی داخلی دیالوگ */}
            <div className="p-4 bg-muted/30 border-b border-border/60">
              <div className="relative flex items-center bg-card border border-border rounded-xl px-3 h-11 w-full focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Search className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                <input
                  type="text"
                  placeholder={step === "province" ? "جستجوی استان..." : "جستجوی شهر..."}
                  value={searchLocationQuery}
                  onChange={(e) => setSearchLocationQuery(e.target.value)}
                  className="w-full px-2 py-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-sm font-medium"
                />
                {searchLocationQuery && (
                  <X
                    className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-popover-foreground"
                    onClick={() => setSearchLocationQuery("")}
                  />
                )}
              </div>
            </div>

            {/* لیست استان‌ها یا شهرها */}
            <div className="max-h-[280px] overflow-y-auto p-3 pl-1.5 space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/60">
              
              {/* لیست استان‌ها */}
              {step === "province" && (
                <>
                  <button
                    key="all-iran"
                    type="button"
                    onClick={() => {
                      setTempProvince(null);
                      setTempCity("");
                      finalizeLocation("", "", "");
                    }}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold rounded-xl text-primary bg-primary/10 text-right hover:bg-primary/15 transition-all cursor-pointer"
                  >
                    <span>همهٔ ایران</span>
                    <ChevronLeft className="w-4 h-4 text-primary" />
                  </button>
                  <div className="h-[1px] bg-border/60 my-1.5" />
                  
                  {filteredProvinces.map((prov) => (
                    <button
                      key={prov._id}
                      type="button"
                      onClick={() => handleProvinceSelect(prov._id, prov.name)}
                      className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold rounded-xl text-popover-foreground text-right hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <span>{prov.name}</span>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground/60" />
                    </button>
                  ))}
                  
                  {filteredProvinces.length === 0 && (
                     <p className="text-center text-sm text-muted-foreground py-4">استانی یافت نشد.</p>
                  )}
                </>
              )}

              {/* لیست شهرها */}
              {step === "city" && (
                <>
                  {isLoadingCities ? (
                     <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                     </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setTempCity("");
                          finalizeLocation(tempProvince?.name || "", "", tempProvince?._id);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold rounded-xl text-right transition-all cursor-pointer",
                          tempCity === "" ? "text-primary bg-primary/10" : "text-popover-foreground hover:bg-muted/50"
                        )}
                      >
                        <span>همه شهرهای {tempProvince?.name}</span>
                        {tempCity === "" && <Check className="w-4 h-4 text-primary" />}
                      </button>
                      <div className="h-[1px] bg-border/60 my-1.5" />
                      
                      {filteredCities.map((city) => (
                        <button
                          key={city._id}
                          type="button"
                          onClick={() => {
                            setTempCity(city.name);
                            finalizeLocation(tempProvince?.name || "", city.name, tempProvince?._id);
                          }}
                          className={cn(
                            "flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold rounded-xl text-right transition-all cursor-pointer",
                            tempCity === city.name ? "text-primary bg-primary/10" : "text-popover-foreground hover:bg-muted/50"
                          )}
                        >
                          <span>{city.name}</span>
                          {tempCity === city.name && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}

                      {filteredCities.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">شهری یافت نشد.</p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* فوتر دیالوگ */}
            <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-5 font-bold border-border text-muted-foreground hover:bg-muted h-11 text-xs cursor-pointer"
              >
                انصراف
              </Button>
              <Button
                type="button"
                onClick={handleConfirmLocation}
                disabled={step === "province" && !tempProvince}
                className="rounded-xl px-6 font-bold bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground h-11 text-xs transition-all shadow-md shadow-primary/10 cursor-pointer"
              >
                تایید مکان
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* دکمه پاک کردن لوکیشن در صورت انتخاب شدن */}
        {(selectedProvinceName || selectedCityName) && (
          <button
            type="button"
            onClick={clearLocation}
            className="w-5 h-5 rounded-lg bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center justify-center mr-1 shrink-0 active:scale-90 cursor-pointer"
            aria-label="پاک کردن مکان"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </form>
  );
}