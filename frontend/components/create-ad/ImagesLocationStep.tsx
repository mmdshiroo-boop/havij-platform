"use client";
import { getCityCoords } from "@/lib/cityCoordinates";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateAdData } from "@/services/api/ads.api";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  MapPin,
  MapPinned,
  Home,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import {
  PROVINCES,
  CITIES,
} from "@/lib/iranLocations";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 sm:h-80 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:5001";

const getImageUrl = (img: string): string => {
  if (!img) return "/placeholder.jpg";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/uploads")) return `${API_BASE}${img}`;
  return `${API_BASE}/uploads/${img}`;
};

interface ImagesLocationStepProps {
  data: Partial<CreateAdData>;
  updateData: (data: Partial<CreateAdData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ImagesLocationStep({
  data,
  updateData,
  onNext,
  onBack,
}: ImagesLocationStepProps) {
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
  lat: data.latitude || 35.6892,
  lng: data.longitude || 51.3890,
});
const [mapKey, setMapKey] = useState(0);
  // اگر data.province از قبل وجود داشت، dropdown استان sync شود
  useEffect(() => {
    if (!data.province) return;

    const foundProvince = PROVINCES.find((p) => p.name === data.province);
    if (foundProvince) {
      setSelectedProvinceId(String(foundProvince.id));
    }
  }, [data.province]);

  const filteredCities = useMemo(() => {
    if (!selectedProvinceId) return [];
    return CITIES.filter((c) => c.province_id === Number(selectedProvinceId));
  }, [selectedProvinceId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.images || data.images.length === 0) {
      newErrors.images = "حداقل یک تصویر برای آگهی الزامی است";
    }

    if (!selectedProvinceId) {
      newErrors.province = "انتخاب استان الزامی است";
    }

    if (!data.city) {
      newErrors.city = "انتخاب شهر الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    setUploading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("لطفاً ابتدا وارد حساب کاربری خود شوید");
      setUploading(false);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`فایل ${file.name} بزرگتر از ۵ مگابایت است`);
        continue;
      }

      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/ads/upload-image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          const imageUrl = response.data.data.url;
          const newImages = [...(data.images || []), imageUrl];
          updateData({ images: newImages });
          toast.success(`تصویر ${file.name} با موفقیت آپلود شد`);
        } else {
          toast.error(response.data.message || "خطا در آپلود تصویر");
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        const errorMessage =
          error.response?.data?.message || "خطا در ارتباط با سرور آپلود";
        toast.error(errorMessage);
      }
    }

    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const newImages = [...(data.images || [])];
    newImages.splice(index, 1);
    updateData({ images: newImages });
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    updateData({ latitude: lat, longitude: lng });
  };

const handleProvinceChange = (val: string) => {
  setSelectedProvinceId(val);

  const provinceName = PROVINCES.find((p) => String(p.id) === val)?.name || "";

  updateData({ province: provinceName, city: "" });

  // نقشه رو نرم ببر به مرکز استان
  const coords = getCityCoords("", Number(val));
  setMapCenter(coords);

  setErrors((prev) => {
    const next = { ...prev };
    delete next.province;
    delete next.city;
    return next;
  });
};

const handleCityChange = (val: string) => {
  updateData({ city: val });

  // نقشه رو ببر به مختصات شهر انتخاب‌شده
  const coords = getCityCoords(val, Number(selectedProvinceId));
  setMapCenter(coords);
  setMapKey((prev) => prev + 1); // force re-mount نقشه

  setErrors((prev) => {
    const next = { ...prev };
    delete next.city;
    return next;
  });
};

  return (
    <div className="space-y-8" dir="rtl">
      {/* ───────────────── تصاویر ───────────────── */}
      <div className="space-y-3">
        <Label className="text-sm font-bold flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
          تصاویر آگهی <span className="text-destructive">*</span>
        </Label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* دکمه آپلود */}
          <label
            className={cn(
              "flex flex-col items-center justify-center aspect-square",
              "border-2 border-dashed rounded-2xl cursor-pointer",
              "transition-all group",
              uploading
                ? "border-primary/30 bg-primary/5"
                : "border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/30",
            )}
          >
            <div className="flex flex-col items-center gap-2 p-3 text-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              )}

              <span className="text-xs font-bold text-foreground/70">
                {uploading ? "آپلود..." : "افزودن عکس"}
              </span>

              <span className="text-[10px] text-muted-foreground hidden sm:block">
                حداکثر ۵ مگابایت
              </span>
            </div>

            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>

          {/* تصاویر آپلود شده */}
          {data.images?.map((img: string, idx: number) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl border border-border overflow-hidden bg-muted shadow-sm group"
            >
              <img
                src={getImageUrl(img)}
                alt={`تصویر ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.jpg";
                }}
              />

              {idx === 0 && (
                <div className="absolute bottom-1.5 right-1.5 bg-background/90 backdrop-blur-sm text-[10px] font-black text-primary px-2 py-0.5 rounded-lg border border-primary/20 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  تصویر اصلی
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="w-8 h-8 rounded-xl"
                  onClick={() => removeImage(idx)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {errors.images && (
          <p className="text-xs font-bold text-destructive">{errors.images}</p>
        )}

        <p className="text-[11px] text-muted-foreground">
          اولین تصویر به عنوان تصویر اصلی آگهی نمایش داده می‌شود.
        </p>
      </div>

      {/* ───────────────── موقعیت مکانی ───────────────── */}
      <div className="space-y-5 pt-2 border-t border-border/40">
        <Label className="text-sm font-bold flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          موقعیت مکانی آگهی
        </Label>

        {/* استان و شهر */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* استان */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <MapPinned className="w-3.5 h-3.5" />
              استان <span className="text-destructive">*</span>
            </Label>

            <Select value={selectedProvinceId} onValueChange={handleProvinceChange}>
              <SelectTrigger
                className={cn(
                  "h-11 sm:h-12 rounded-2xl bg-background border-border",
                  "text-sm font-medium shadow-sm",
                  "px-3",
                  errors.province && "border-destructive/60 focus:ring-destructive/20",
                )}
              >
                <SelectValue placeholder="انتخاب استان" />
              </SelectTrigger>

              <SelectContent
                className={cn(
                  "rounded-2xl border-border shadow-xl",
                  "max-h-[280px] overflow-hidden",
                  "[&_[data-radix-select-viewport]]:max-h-[280px]",
                  "[&_[data-radix-select-viewport]]:overflow-y-auto",
                )}
                position="popper"
                sideOffset={8}
              >
                {PROVINCES.map((province) => (
                  <SelectItem
                    key={province.id}
                    value={String(province.id)}
                    className="text-sm py-2.5 rounded-lg"
                  >
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.province && (
              <p className="text-xs font-bold text-destructive">
                {errors.province}
              </p>
            )}
          </div>

          {/* شهر */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              شهر <span className="text-destructive">*</span>
            </Label>

            <Select
              value={data.city || ""}
              onValueChange={handleCityChange}
              disabled={!selectedProvinceId}
            >
              <SelectTrigger
                className={cn(
                  "h-11 sm:h-12 rounded-2xl bg-background border-border",
                  "text-sm font-medium shadow-sm px-3",
                  !selectedProvinceId && "opacity-70",
                  errors.city && "border-destructive/60 focus:ring-destructive/20",
                )}
              >
                <SelectValue
                  placeholder={
                    selectedProvinceId
                      ? "انتخاب شهر"
                      : "ابتدا استان را انتخاب کنید"
                  }
                />
              </SelectTrigger>

              <SelectContent
                className={cn(
                  "rounded-2xl border-border shadow-xl",
                  "max-h-[280px] overflow-hidden",
                  "[&_[data-radix-select-viewport]]:max-h-[280px]",
                  "[&_[data-radix-select-viewport]]:overflow-y-auto",
                )}
                position="popper"
                sideOffset={8}
              >
                {filteredCities.map((city) => (
                  <SelectItem
                    key={city.id}
                    value={city.name}
                    className="text-sm py-2.5 rounded-lg"
                  >
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.city && (
              <p className="text-xs font-bold text-destructive">
                {errors.city}
              </p>
            )}
          </div>
        </div>

        {/* محله و آدرس */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">
              محله (اختیاری)
            </Label>
            <Input
              placeholder="مثال: ونک، گلسار، مطهری"
              value={data.district || ""}
              onChange={(e) => updateData({ district: e.target.value })}
              className="h-11 sm:h-12 rounded-2xl text-sm shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">
              آدرس دقیق (اختیاری)
            </Label>
            <Input
              placeholder="خیابان، کوچه، پلاک"
              value={data.address || ""}
              onChange={(e) => updateData({ address: e.target.value })}
              className="h-11 sm:h-12 rounded-2xl text-sm shadow-sm"
            />
          </div>
        </div>

        {/* نقشه */}
        <div className="space-y-3">
          <Label className="text-sm font-bold flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
            موقعیت دقیق روی نقشه (اختیاری)
          </Label>
        <LocationPickerMap
  key={`map-${mapKey}`}
  initialLat={mapCenter.lat}
  initialLng={mapCenter.lng}
  onLocationSelect={handleLocationSelect}
/>
        </div>
      </div>

      {/* دکمه‌ها */}
      <div className="flex justify-between items-center pt-6 border-t border-border/40">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 rounded-xl h-10 px-6 text-sm font-bold"
        >
          <ChevronRight className="w-4 h-4" />
          مرحله قبل
        </Button>

        <Button
          onClick={() => validate() && onNext()}
          className="gap-2 rounded-xl h-10 px-6 text-sm font-bold bg-primary"
        >
          ادامه و اطلاعات تماس
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}