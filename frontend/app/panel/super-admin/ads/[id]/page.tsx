"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Ruler,
  BedDouble,
  Building2,
  AlertCircle,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  Home,
  Code,
  Cog,
  Sparkles,
  Layers,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";
import { adminApi } from "@/services/api/admin.api";
import { cn } from "@/lib/utils";

// نگاشت وضعیت‌ها
const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: any }
> = {
  active: {
    label: "فعال",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle,
  },
  pending: {
    label: "در انتظار بررسی",
    badgeClass:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: AlertCircle,
  },
  rejected: {
    label: "رد شده",
    badgeClass:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: XCircle,
  },
  sold: {
    label: "فروخته شده",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: CheckCircle,
  },
  expired: {
    label: "منقضی شده",
    badgeClass:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    icon: AlertCircle,
  },
};

// کمکی ساخت URL تصویر
const getImageUrl = (img: string | null | undefined): string | null => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  return `${base}${img.startsWith("/") ? "" : "/"}${img}`;
};

// فرمت قیمت
function formatPrice(price: number | null | undefined): string {
  if (!price || price === 0) return "توافقی";
  if (price >= 1_000_000_000)
    return `${(price / 1_000_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 2 })} میلیارد تومان`;
  if (price >= 1_000_000)
    return `${(price / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 0 })} میلیون تومان`;
  return `${price.toLocaleString("fa-IR")} تومان`;
}

// فرمت مطمئن تاریخ
function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

// ترجمه کلیدهای امکانات
const amenityLabels: Record<string, string> = {
  parking: "پارکینگ",
  storage: "انباری",
  elevator: "آسانسور",
  balcony: "بالکن",
  fireplace: "شومینه",
  gym: "باشگاه ورزشی",
  pool: "استخر",
  sauna: "سونا",
  jacuzzi: "جکوزی",
  wifi: "اینترنت بی‌سیم",
  tv: "تلویزیون",
  kitchen: "آشپزخانه مجهز",
};

export default function SuperAdminAdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adId = params?.id as string;

  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    if (adId) {
      fetchAd();
    }
  }, [adId]);

  const fetchAd = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/ads/${adId}`);
      setAd(response.data?.data || response.data);
    } catch (error) {
      console.error("Error fetching ad:", error);
      toast.error("خطا در دریافت اطلاعات آگهی");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/ads/admin/${adId}/approve`);
      toast.success("آگهی با موفقیت تایید شد");
      fetchAd();
    } catch (error) {
      toast.error("خطا در تایید آگهی");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("لطفاً دلیل رد آگهی را وارد کنید");
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.post(`/ads/admin/${adId}/reject`, {
        reason: rejectReason,
      });
      toast.success("آگهی با موفقیت رد شد");
      fetchAd();
      setRejectReason("");
    } catch (error) {
      toast.error("خطا در رد آگهی");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAd = async () => {
    if (confirm("آیا از حذف دائم این آگهی مطمئن هستید؟")) {
      try {
        await adminApi.forceDeleteAd(adId);
        toast.success("آگهی با موفقیت حذف شد");
        router.push("/panel/super-admin/ads");
      } catch (error) {
        toast.error("خطا در حذف آگهی");
      }
    }
  };

  const images = Array.isArray(ad?.images) ? ad.images : [];

  const handlePrevImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const getActiveAmenities = () => {
    if (!ad?.amenities || typeof ad.amenities !== "object") return [];
    return Object.entries(ad.amenities)
      .filter(([_, val]) => val === true)
      .map(([key]) => amenityLabels[key] || key);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-60 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center"
        dir="rtl"
      >
        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 text-orange-600">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          آگهی یافت نشد
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          آگهی مورد نظر شما در سیستم وجود ندارد یا پاک شده است.
        </p>
        <Link href="/panel/super-admin/ads">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <ArrowLeft className="w-4 h-4" />
            بازگشت به لیست آگهی‌ها
          </Button>
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[ad.status] || {
    label: ad.status || "نامشخص",
    badgeClass: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    icon: AlertCircle,
  };
  const StatusIcon = statusInfo.icon;
  const activeAmenities = getActiveAmenities();
  const additionalProps = Array.isArray(ad.additionalProperties)
    ? ad.additionalProperties
    : [];

  return (
    <div
      className="space-y-6 p-4 md:p-6 text-foreground bg-background min-h-screen"
      dir="rtl"
    >
      {/* هدر بالایی با تم سفید-نارنجی */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-orange-500/20 shadow-lg p-5 md:p-6 bg-gradient-to-l from-orange-500/10 via-background to-background">
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/panel/super-admin/ads">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-border hover:bg-orange-500/10"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Button>
            </Link>
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-foreground truncate">
                {ad.title || "بدون عنوان"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 font-semibold border",
                    statusInfo.badgeClass,
                  )}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusInfo.label}
                </Badge>
                {ad.source && ad.source !== "manual" && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground"
                  >
                    منبع:{" "}
                    {ad.source === "sheypoor"
                      ? "شیپور"
                      : ad.source === "divar"
                        ? "دیوار"
                        : ad.source}
                  </Badge>
                )}
                {ad.isVip && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold border-0">
                    <Sparkles className="w-3 h-3 ml-1 fill-white" /> ویژه VIP
                  </Badge>
                )}
                {ad.isUrgent && (
                  <Badge className="bg-rose-500 text-white animate-pulse border-0 font-bold">
                    🔥 فوری
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAd}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              به‌روزرسانی
            </Button>
            <Link href={`/ad/${ad._id}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                مشاهده در سایت
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAd}
              className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف آگهی
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ستون راست - جزییات و گالری */}
        <div className="lg:col-span-2 space-y-6">
          {/* گالری تصاویر */}
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="flex items-center justify-between text-base font-bold text-foreground">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-orange-500" />
                  گالری تصاویر
                </div>
                {images.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  >
                    {images.length} تصویر
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {images.length > 0 ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative w-full h-72 sm:h-96 bg-muted rounded-2xl overflow-hidden cursor-pointer group border border-border">
                        <img
                          src={getImageUrl(images[currentImageIndex]) || ""}
                          alt={ad.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrevImage();
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background text-foreground backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-md"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNextImage();
                              }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background text-foreground backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-md"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-md text-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-background border-border">
                      <img
                        src={getImageUrl(images[currentImageIndex]) || ""}
                        alt={ad.title}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </DialogContent>
                  </Dialog>

                  {images.length > 1 && (
                    <div className="flex gap-2.5 overflow-x-auto pt-4 pb-1 scrollbar-thin">
                      {images.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={cn(
                            "relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all",
                            idx === currentImageIndex
                              ? "border-orange-500 shadow-md scale-95"
                              : "border-transparent opacity-60 hover:opacity-100",
                          )}
                        >
                          <img
                            src={getImageUrl(img) || ""}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImageIcon className="w-16 h-16 mb-2 opacity-30 text-orange-500" />
                  <p className="text-sm font-medium">
                    تصویری برای این آگهی ثبت نشده است.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* توضیحات */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Info className="w-5 h-5 text-orange-500" />
                توضیحات آگهی
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {ad.description ? (
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
                  {ad.description}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  توضیحاتی ثبت نشده است.
                </p>
              )}
            </CardContent>
          </Card>

          {/* مشخصات ملک */}
          {(ad.area || ad.rooms || ad.buildingAge != null || ad.floorCount) && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Building2 className="w-5 h-5 text-orange-500" />
                  مشخصات ملک
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {ad.area && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Ruler className="w-3.5 h-3.5 text-orange-500" /> متراژ
                      </span>
                      <p className="font-bold text-sm">{ad.area} متر</p>
                    </div>
                  )}
                  {ad.rooms != null && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <BedDouble className="w-3.5 h-3.5 text-orange-500" />{" "}
                        اتاق
                      </span>
                      <p className="font-bold text-sm">{ad.rooms} خواب</p>
                    </div>
                  )}
                  {ad.buildingAge != null && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" /> سن
                        بنا
                      </span>
                      <p className="font-bold text-sm">
                        {ad.buildingAge === 0
                          ? "نوساز"
                          : `${ad.buildingAge} سال`}
                      </p>
                    </div>
                  )}
                  {ad.floorCount && (
                    <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Layers className="w-3.5 h-3.5 text-orange-500" /> طبقه
                      </span>
                      <p className="font-bold text-sm">{ad.floorCount} طبقه</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* امکانات */}
          {activeAmenities.length > 0 && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Home className="w-5 h-5 text-orange-500" />
                  امکانات و ویژگی‌ها
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {activeAmenities.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="px-3 py-1.5 bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20 rounded-lg text-xs"
                    >
                      ✓ {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ویژگی‌های اضافی */}
          {additionalProps.length > 0 && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Cog className="w-5 h-5 text-orange-500" />
                  ویژگی‌های تکمیلی
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {additionalProps.map((prop: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2.5 rounded-xl bg-muted/40 border border-border/40 text-xs"
                    >
                      <span className="text-muted-foreground font-medium">
                        {prop.name || prop.key}
                      </span>
                      <span className="font-bold text-foreground">
                        {prop.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* داده‌های خام */}
          {ad.rawData && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader
                className="pb-3 cursor-pointer select-none border-b border-border/50"
                onClick={() => setShowRawData(!showRawData)}
              >
                <CardTitle className="flex items-center justify-between text-base font-bold text-foreground">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-orange-500" /> داده‌های خام
                    (JSON)
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {showRawData ? "پنهان‌سازی" : "نمایش ساختار"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              {showRawData && (
                <CardContent className="pt-4">
                  <pre className="text-xs font-mono bg-slate-950 text-emerald-400 p-4 rounded-xl overflow-x-auto max-h-96 dir-ltr">
                    {JSON.stringify(ad.rawData, null, 2)}
                  </pre>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* ستون چپ - وضعیت و مشخصات فنی */}
        <div className="space-y-6">
          {/* قیمت و مشخصات کلیدی */}
          <Card className="border-orange-500/30 shadow-md bg-card relative overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-amber-500" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Tag className="w-5 h-5 text-orange-500" />
                اطلاعات مالی و موقعیت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex justify-between items-center">
                <span className="text-muted-foreground font-medium">
                  قیمت کل:
                </span>
                <span className="font-extrabold text-base text-orange-600 dark:text-orange-400">
                  {formatPrice(ad.price)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" /> شهر
                </span>
                <span className="font-bold text-foreground">
                  {ad.city || "—"}
                </span>
              </div>
              {ad.district && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">محله/منطقه</span>
                  <span className="font-bold text-foreground">
                    {ad.district}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-orange-500" /> تعداد بازدید
                </span>
                <span className="font-bold text-foreground">
                  {(ad.views || 0).toLocaleString("fa-IR")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-500" /> تاریخ ثبت
                </span>
                <span className="font-bold text-foreground">
                  {formatDate(ad.createdAt)}
                </span>
              </div>
              {ad.adType && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">نوع معامله</span>
                  <Badge variant="outline" className="font-semibold">
                    {ad.adType === "sale"
                      ? "فروش"
                      : ad.adType === "rent"
                        ? "اجاره"
                        : ad.adType}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* اطلاعات کاربر */}
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <User className="w-5 h-5 text-orange-500" />
                اطلاعات آگهی‌دهنده
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate">
                    {ad.userId?.firstName || ad.userId?.lastName
                      ? `${ad.userId?.firstName || ""} ${ad.userId?.lastName || ""}`
                      : "کاربر ناشناس"}
                  </p>
                  <p className="text-xs text-muted-foreground dir-ltr text-right">
                    {ad.userId?.phone || "—"}
                  </p>
                </div>
              </div>

              {ad.userId?.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                  <Mail className="w-4 h-4 text-orange-500" />
                  <span className="truncate">{ad.userId.email}</span>
                </div>
              )}

              {ad.contactPhone && ad.contactPhone !== ad.userId?.phone && (
                <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                  <p className="text-xs text-muted-foreground mb-1">
                    شماره تماس اختصاصی آگهی:
                  </p>
                  <div className="flex items-center gap-2 dir-ltr text-left">
                    <Phone className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-sm text-foreground">
                      {ad.contactPhone}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* عملیات تایید / رد برای آگهی‌های در انتظار */}
          {ad.status === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-orange-500/40 bg-gradient-to-br from-orange-500/10 via-card to-card shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-orange-600 dark:text-orange-400">
                    <AlertCircle className="w-5 h-5" />
                    مدیریت تایید آگهی
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="rejectReason"
                      className="text-xs font-semibold"
                    >
                      دلیل رد آگهی (در صورت رد شدن)
                    </Label>
                    <Textarea
                      id="rejectReason"
                      placeholder="علت رد آگهی را جهت اطلاع کاربر بنویسید..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="resize-none bg-background text-xs border-border"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      تأیید انتشار
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={actionLoading || !rejectReason.trim()}
                      variant="destructive"
                      className="flex-1 gap-1.5 text-xs font-bold"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      رد آگهی
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* نمایش علت رد آگهی */}
          {ad.status === "rejected" && ad.rejectReason && (
            <Card className="border-rose-500/30 bg-rose-500/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
                  <XCircle className="w-4 h-4" />
                  علت رد آگهی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  {ad.rejectReason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
