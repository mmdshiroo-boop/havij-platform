"use client";
import { useEffect, useState } from "react";
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
import { locationApi, Province, City } from "@/services/api/location.api";
import { CreateAdData } from "@/services/api/ads.api";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/utils";
import LocationPickerMap from "./LocationPickerMap";

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
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [latitude, setLatitude] = useState<number | undefined>(data.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(
    data.longitude,
  );

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const response = await locationApi.getProvinces();
        setProvinces(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Error fetching provinces:", error);
        toast.error("خطا در دریافت لیست استان‌ها");
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedProvinceId) {
        setCities([]);
        return;
      }

      setLoadingCities(true);
      try {
        const response =
          await locationApi.getCitiesByProvince(selectedProvinceId);
        setCities(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast.error("خطا در دریافت لیست شهرها");
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [selectedProvinceId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.images || data.images.length === 0) {
      newErrors.images = "حداقل یک تصویر برای آگهی الزامی است";
    }
    if (!data.city) newErrors.city = "انتخاب شهر الزامی است";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

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
    setLatitude(lat);
    setLongitude(lng);
    updateData({ latitude: lat, longitude: lng });
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* ─── بخش آپلود تصاویر ─── */}
      <div className="space-y-3">
        <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
          تصاویر آگهی <span className="text-destructive">*</span>
        </Label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border hover:border-primary/50 rounded-2xl cursor-pointer bg-muted/10 hover:bg-muted/30 transition-all group relative overflow-hidden">
            <div className="flex flex-col items-center justify-center p-4 text-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground/80 group-hover:text-primary transition-colors mb-2" />
              )}
              <span className="text-xs font-bold text-foreground/80">
                {uploading ? "در حال آپلود..." : "افزودن عکس"}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 hidden sm:block">
                حداکثر حجم: ۵ مگابایت
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>

          {data.images?.map((img: string, idx: number) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl border border-border overflow-hidden bg-muted shadow-sm group"
            >
              <img
                src={getImageUrl(img)}
                alt={`تصویر آگهی ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.jpg";
                }}
              />
              {idx === 0 && (
                <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-xs text-[10px] font-black text-primary px-2 py-0.5 rounded-md border border-primary/20 shadow-xs flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  تصویر اصلی
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="w-8 h-8 rounded-xl shadow-md scale-90 group-hover:scale-100 transition-transform"
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
      </div>

      {/* ─── بخش موقعیت مکانی (دستی) ─── */}
      <div className="space-y-4 pt-2 border-t border-border/40">
        <Label className="text-sm font-bold text-foreground">
          موقعیت مکانی آگهی
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">
              استان
            </Label>
            <Select
              value={selectedProvinceId}
              onValueChange={setSelectedProvinceId}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background border-border font-semibold">
                <SelectValue
                  placeholder={
                    loadingProvinces ? "در حال بارگذاری..." : "انتخاب استان"
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {provinces.map((province) => (
                  <SelectItem
                    key={province._id}
                    value={province._id}
                    className="rounded-lg font-medium"
                  >
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">
              شهر <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.city || ""}
              onValueChange={(value) => updateData({ city: value })}
              disabled={!selectedProvinceId || loadingCities}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background border-border font-semibold">
                <SelectValue
                  placeholder={
                    loadingCities
                      ? "در حال بارگذاری..."
                      : selectedProvinceId
                        ? "انتخاب شهر"
                        : "ابتدا استان را انتخاب کنید"
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {cities.map((city) => (
                  <SelectItem
                    key={city._id}
                    value={city.name}
                    className="rounded-lg font-medium"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">
              محله (اختیاری)
            </Label>
            <Input
              placeholder="مثال: ونک، گلسار"
              value={data.district || ""}
              onChange={(e) => updateData({ district: e.target.value })}
              className="h-11 rounded-xl"
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
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-border/40">
          <Label className="text-sm font-bold text-foreground">
            موقعیت دقیق روی نقشه (اختیاری)
          </Label>
          <LocationPickerMap
            initialLat={latitude}
            initialLng={longitude}
            onLocationSelect={handleLocationSelect}
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-border/40 select-none">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 rounded-xl h-10 px-6 text-xs font-bold border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
          مرحله قبل
        </Button>
        <Button
          onClick={handleNext}
          className="gap-2 rounded-xl h-10 px-6 text-xs font-bold bg-primary hover:bg-primary/95 shadow-xs"
        >
          ادامه و مشخصات تماس
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}