"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
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
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

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

const getOrCreateGuestId = (): string => {
  if (typeof window === "undefined") return "";
  let guestId = localStorage.getItem("app_guest_id");
  if (!guestId) {
    guestId =
      "guest_" +
      Math.random().toString(36).substring(2, 9) +
      "_" +
      Date.now();
    localStorage.setItem("app_guest_id", guestId);
  }
  return guestId;
};

// ═══════════════════════════════════════════════════════════════
// SearchBoxInner — کامپوننت داخلی که useSearchParams دارد
// ═══════════════════════════════════════════════════════════════

function SearchBoxInner({
  placeholder = "جستجو در آگهی‌ها (مثلا: اجاره ویلا)...",
  className = "",
  onSearch,
}: SearchBoxProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ اینجا امن است چون در Suspense wrap شده

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"province" | "city">("province");
  const [searchLocationQuery, setSearchLocationQuery] = useState("");

  const [tempProvince, setTempProvince] = useState<{
    _id: string;
    name: string;
  } | null>(null);
  const [tempCity, setTempCity] = useState<string>("");

  const [selectedProvinceName, setSelectedProvinceName] = useState("");
  const [selectedCityName, setSelectedCityName] = useState(
    searchParams.get("city") || ""
  );

  const [isDetecting, setIsDetecting] = useState(false);

  // دریافت استان‌ها
  useEffect(() => {
    locationApi
      .getProvinces()
      .then(setProvinces)
      .catch((error) => console.error("خطا در دریافت استان‌ها:", error));
  }, []);

  // دریافت شهرها
  useEffect(() => {
    if (!tempProvince?._id) {
      setCities([]);
      return;
    }
    locationApi
      .getCitiesByProvince(tempProvince._id)
      .then(setCities)
      .catch((error) =>
        console.error("خطا در دریافت شهرهای استان:", error)
      );
  }, [tempProvince]);

  // همگام‌سازی URL با State
  useEffect(() => {
    const q = searchParams.get("q");
    const city = searchParams.get("city");
    const provinceParam = searchParams.get("province");

    if (q) setQuery(q);
    if (city) setSelectedCityName(city);

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

  // اجرای جستجو
  const executeSearch = useCallback(
    (
      searchQ?: string,
      searchCity?: string,
      searchProvinceId?: string
    ) => {
      const params = new URLSearchParams();
      const finalQ = searchQ?.trim() || "";

      let smartPropertyType = "";
      let smartAdType = "";

      if (finalQ) {
        SMART_KEYWORDS.propertyTypes.forEach((pt) => {
          if (finalQ.includes(pt.key)) smartPropertyType = pt.value;
        });
        SMART_KEYWORDS.adTypes.forEach((at) => {
          if (finalQ.includes(at.key)) smartAdType = at.value;
        });
      }

      if (finalQ) params.set("q", finalQ);
      if (searchCity) params.set("city", searchCity);

      const pId =
        searchProvinceId !== undefined
          ? searchProvinceId
          : tempProvince?._id;
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
    executeSearch(
      query.trim() || undefined,
      selectedCityName || undefined
    );
  };

  const handleProvinceSelect = (provId: string, provName: string) => {
    setTempProvince({ _id: provId, name: provName });
    setTempCity("");
    setSearchLocationQuery("");
    setStep("city");
  };

  const handleConfirmLocationWithValues = (
    provName: string,
    cityName: string,
    provId?: string
  ) => {
    setSelectedProvinceName(provName);
    setSelectedCityName(cityName);
    setIsOpen(false);
    setSearchLocationQuery("");
    executeSearch(query.trim() || undefined, cityName || undefined, provId);
  };

  const handleConfirmLocation = () => {
    handleConfirmLocationWithValues(
      tempProvince?.name || "",
      tempCity,
      tempProvince?._id
    );
  };

  const clearLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempProvince(null);
    setTempCity("");
    setSelectedProvinceName("");
    setSelectedCityName("");
    setStep("province");
    executeSearch(query.trim() || undefined, undefined, "");
  };

  // ذخیره موقعیت در بک‌اند
  const saveLocationToBackend = async (payload: {
    lat?: number;
    lng?: number;
    province?: string;
    city?: string;
  }) => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;
      const guestId = getOrCreateGuestId();
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      await axios.post(
        `${API_BASE_URL}/api/location/save-from-search`,
        {
          ...payload,
          guestId: !token ? guestId : undefined,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "x-guest-id": guestId,
          },
        }
      );
    } catch (err) {
      console.error("خطا در ثبت موقعیت مکانی:", err);
    }
  };

  // تشخیص موقعیت مکانی
  const handleDetectLocation = () => {
    setIsDetecting(true);

    if (!navigator.geolocation) {
      handleFallbackIP(
        "مرورگر شما از GPS پشتیبانی نمی‌کند. در حال دریافت بر اساس IP..."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.neshan.org/v5/reverse?lat=${latitude}&lng=${longitude}`,
            {
              headers: {
                "Api-Key": "service.f3da8afc6b384ab5bda01e3375e1f3f5",
              },
            }
          );
          const data = await response.json();
          const city =
            data.city || data.municipality_zone || "نامشخص";
          const province = data.state || "نامشخص";

          const foundProvince = provinces.find(
            (p) =>
              p?.name?.includes(province) || province.includes(p?.name)
          );
          const provinceId = foundProvince ? foundProvince._id : "";

          if (provinceId) {
            setTempProvince({
              _id: provinceId,
              name: foundProvince?.name || province,
            });
          }

          setTempCity(city);
          setSelectedProvinceName(foundProvince?.name || province);
          setSelectedCityName(city);
          setIsOpen(false);

          const finalCity = city !== "نامشخص" ? city : undefined;
          executeSearch(
            query.trim() || undefined,
            finalCity,
            provinceId
          );

          await saveLocationToBackend({
            lat: latitude,
            lng: longitude,
            province: foundProvince?.name || province,
            city: finalCity,
          });

          toast.success(
            `موقعیت شما شناسایی شد: ${foundProvince?.name || province}، ${city}`
          );
        } catch (error) {
          console.error("خطا در سرویس نشان:", error);
          toast.error("خطا در تطبیق موقعیت با پایگاه داده");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        let msg = "دریافت موقعیت بر اساس IP شبکه انجام شد.";
        if (error.code === error.PERMISSION_DENIED) {
          msg =
            "دسترسی GPS مسدود است. موقعیت بر اساس IP شبکه ثبت شد.";
        }
        handleFallbackIP(msg);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleFallbackIP = async (message: string) => {
    try {
      await saveLocationToBackend({});
      toast.info(message);
      setIsOpen(false);
    } catch {
      toast.error("خطا در ثبت موقعیت شبکه.");
    } finally {
      setIsDetecting(false);
    }
  };

  // فیلتر
  const safeSearch = searchLocationQuery.trim();
  const filteredProvinces = provinces.filter((p) =>
    p?.name?.includes(safeSearch)
  );
  const filteredCities = cities.filter((c) =>
    c?.name?.includes(safeSearch)
  );

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={`w-full ${className}`}
      dir="rtl"
    >
      <div className="flex items-center bg-card text-card-foreground border border-border rounded-2xl px-3 md:px-4 shadow-xs transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 w-full h-12">
        <div className="relative flex-1 h-full flex items-center gap-1 bg-transparent">
          <button
            type="submit"
            className="p-2 text-muted-foreground hover:text-primary rounded-xl transition-colors shrink-0 bg-transparent cursor-pointer"
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
              onClick={() => setQuery("")}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full ml-1 bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="h-6 w-[1px] bg-border mx-1 md:mx-2 shrink-0" />

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setSearchLocationQuery("");
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
                  {step === "province"
                    ? "انتخاب استان"
                    : `انتخاب شهر (${tempProvince?.name})`}
                </DialogTitle>
              </div>
            </DialogHeader>

            {/* تشخیص موقعیت */}
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
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    در حال بازیابی موقعیت فعلی شما...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 text-primary fill-primary/10" />
                    شناسایی هوشمند شهر من (مکان‌یاب)
                  </>
                )}
              </Button>
            </div>

            {/* جستجوی مکان */}
            <div className="p-4 bg-muted/30 border-b border-border/60">
              <div className="relative flex items-center bg-card border border-border rounded-xl px-3 h-11 w-full focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Search className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                <input
                  type="text"
                  placeholder={
                    step === "province"
                      ? "جستجوی استان..."
                      : "جستجوی شهر..."
                  }
                  value={searchLocationQuery}
                  onChange={(e) =>
                    setSearchLocationQuery(e.target.value)
                  }
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

            {/* لیست استان‌ها / شهرها */}
            <div className="max-h-[280px] overflow-y-auto p-3 pl-1.5 space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/60">
              {step === "province" && (
                <>
                  <button
                    key="all-iran"
                    type="button"
                    onClick={() => {
                      setTempProvince(null);
                      setTempCity("");
                      handleConfirmLocationWithValues("", "", "");
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
                      onClick={() =>
                        handleProvinceSelect(prov._id, prov.name)
                      }
                      className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold rounded-xl text-popover-foreground text-right hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <span>{prov.name}</span>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground/60" />
                    </button>
                  ))}
                </>
              )}

              {step === "city" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setTempCity("");
                      handleConfirmLocationWithValues(
                        tempProvince?.name || "",
                        "",
                        tempProvince?._id
                      );
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold rounded-xl text-right transition-all cursor-pointer",
                      tempCity === ""
                        ? "text-primary bg-primary/10"
                        : "text-popover-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>همه شهرهای {tempProvince?.name}</span>
                    {tempCity === "" && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>

                  <div className="h-[1px] bg-border/60 my-1.5" />

                  {filteredCities.map((city) => (
                    <button
                      key={city._id}
                      type="button"
                      onClick={() => {
                        setTempCity(city.name);
                        handleConfirmLocationWithValues(
                          tempProvince?.name || "",
                          city.name,
                          tempProvince?._id
                        );
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold rounded-xl text-right transition-all cursor-pointer",
                        tempCity === city.name
                          ? "text-primary bg-primary/10"
                          : "text-popover-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{city.name}</span>
                      {tempCity === city.name && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* دکمه‌های تایید */}
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

        {(selectedProvinceName || selectedCityName) && (
          <button
            type="button"
            onClick={clearLocation}
            className="w-5 h-5 rounded-lg bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center justify-center mr-1 shrink-0 active:scale-90 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════
// SearchBox — کامپوننت بیرونی با Suspense
// ✅ این همیشه export می‌شود و داخلش Suspense دارد
// ═══════════════════════════════════════════════════════════════

export function SearchBox({
  placeholder,
  className,
  onSearch,
}: SearchBoxProps) {
  return (
    <Suspense
      fallback={
        // Skeleton ساده هنگام بارگذاری
        <div className={`w-full ${className}`}>
          <div className="flex items-center bg-card border border-border rounded-2xl px-3 md:px-4 h-12 gap-3 animate-pulse">
            <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
            <div className="flex-1 h-4 bg-muted rounded-lg" />
            <div className="w-[1px] h-6 bg-border" />
            <div className="w-24 h-4 bg-muted rounded-lg shrink-0" />
          </div>
        </div>
      }
    >
      <SearchBoxInner
        placeholder={placeholder}
        className={className}
        onSearch={onSearch}
      />
    </Suspense>
  );
}