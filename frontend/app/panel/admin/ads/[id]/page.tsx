"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle, XCircle, MapPin, Calendar, Eye,
  Home, Ruler, Building, DollarSign, Phone, User, Trash2,
  Loader2, Tag, Layers, Clock, AlertCircle, ChevronLeft,
  ChevronRight, Maximize2, X, BadgeCheck, BadgeX,
  BedDouble, Car, Warehouse, Armchair, Construction,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";

/* ─── فرمت‌دهنده‌ها ─── */
const formatPrice = (price: number) => {
  if (!price) return "توافقی";
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} میلیارد تومان`;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} میلیون تومان`;
  return price.toLocaleString("fa-IR") + " تومان";
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });

const getTimeAgo = (dateString: string) => {
  const diffHrs = Math.floor((Date.now() - new Date(dateString).getTime()) / 3600000);
  if (diffHrs < 1) return "کمتر از ۱ ساعت پیش";
  if (diffHrs < 24) return `${diffHrs} ساعت پیش`;
  return `${Math.floor(diffHrs / 24)} روز پیش`;
};

/* ─── وضعیت ─── */
const STATUS_MAP: Record<string, {
  label: string;
  className: string;
  icon: React.ReactNode;
  bgGradient: string;
}> = {
  pending: {
    label: "در انتظار تأیید",
    className: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    icon: <Clock className="w-4 h-4" />,
    bgGradient: "from-amber-500/8 via-transparent to-transparent",
  },
  active: {
    label: "تأیید شده / فعال",
    className: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    icon: <BadgeCheck className="w-4 h-4" />,
    bgGradient: "from-emerald-500/8 via-transparent to-transparent",
  },
  rejected: {
    label: "رد شده",
    className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    icon: <BadgeX className="w-4 h-4" />,
    bgGradient: "from-red-500/8 via-transparent to-transparent",
  },
  sold: {
    label: "فروخته شده",
    className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    icon: <CheckCircle className="w-4 h-4" />,
    bgGradient: "from-blue-500/8 via-transparent to-transparent",
  },
  expired: {
    label: "منقضی",
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
    icon: <AlertCircle className="w-4 h-4" />,
    bgGradient: "from-slate-500/8 via-transparent to-transparent",
  },
};

/* ─── FeatureBadge ─── */
function FeatureBadge({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2.5 p-3 rounded-xl border transition-all",
      highlight
        ? "bg-primary/5 border-primary/20 text-primary"
        : "bg-background/60 border-border/40 hover:border-border",
    )}>
      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-xs font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

/* ─── کامپوننت اصلی ─── */
export default function AdminAdDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => { fetchAd(); }, []);

  const fetchAd = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/ads/${params.id}`);
      setAd(res.data.data);
    } catch { toast.error("خطا در دریافت اطلاعات آگهی"); }
    finally { setLoading(false); }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/ads/admin/${ad._id}/approve`);
      toast.success("آگهی تأیید شد");
      fetchAd();
    } catch { toast.error("خطا در تأیید آگهی"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/ads/admin/${ad._id}/reject`, { reason: rejectReason || "نامناسب" });
      toast.success("آگهی رد شد");
      setShowRejectModal(false);
      setRejectReason("");
      fetchAd();
    } catch { toast.error("خطا در رد آگهی"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await apiClient.delete(`/ads/${ad._id}`);
      toast.success("آگهی حذف شد");
      router.push("/panel/admin/ads");
    } catch { toast.error("خطا در حذف آگهی"); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6" dir="rtl">
        <Skeleton className="h-12 w-72 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
        <div className="p-5 rounded-2xl bg-muted/30">
          <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-bold">آگهی یافت نشد</h2>
        <Link href="/panel/admin/ads">
          <Button variant="outline" className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" /> بازگشت
          </Button>
        </Link>
      </div>
    );
  }

  const status = STATUS_MAP[ad.status] || STATUS_MAP.pending;
  const sellerName = ad.contactName ||
    `${ad.userId?.firstName || ""} ${ad.userId?.lastName || ""}`.trim() || "کاربر";
  const images = ad.images || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 sm:space-y-6" dir="rtl">
      {/* هدر */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-2xl border border-border/60 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Link href="/panel/admin/ads">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
          </Link>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
              <Link href="/panel/admin/ads" className="hover:text-primary transition-colors">مدیریت آگهی‌ها</Link>
              <ChevronLeft className="w-3 h-3" />
              <span className="text-foreground font-medium truncate max-w-[200px]">{ad.title}</span>
            </p>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight line-clamp-1">{ad.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {ad.status === "pending" && (
            <>
              <Button size="sm"
                className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs"
                onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                تأیید
              </Button>
              <Button size="sm" variant="outline"
                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 rounded-xl text-xs"
                onClick={() => setShowRejectModal(true)}>
                <XCircle className="w-3.5 h-3.5" /> رد آگهی
              </Button>
            </>
          )}
          <Button size="sm" variant="outline"
            className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl text-xs"
            onClick={() => setShowDeleteConfirm(true)} disabled={actionLoading}>
            <Trash2 className="w-3.5 h-3.5" /> حذف
          </Button>
        </div>
      </motion.div>

      {/* بدنه */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* ستون اصلی */}
        <div className="lg:col-span-2 space-y-5">
          {/* گالری */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            {images.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden bg-muted/30 border border-border/50 shadow-sm group">
                <div className="relative aspect-[16/9] cursor-pointer" onClick={() => setGalleryOpen(true)}>
                  <img
                    src={getImageUrl(images[currentImageIndex])}
                    alt={ad.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-md rounded-xl gap-1 text-xs">
                      <Maximize2 className="w-3.5 h-3.5" /> بزرگ‌نمایی
                    </Button>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-bold">
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((p) => p === 0 ? images.length - 1 : p - 1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-background"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((p) => p === images.length - 1 ? 0 : p + 1); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-background"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 p-3 bg-card/50 backdrop-blur-sm border-t border-border/30 overflow-x-auto scrollbar-hide">
                    {images.map((img: string, idx: number) => (
                      <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                        className={cn("relative w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all",
                          idx === currentImageIndex
                            ? "border-primary shadow-md"
                            : "border-transparent opacity-60 hover:opacity-100",
                        )}>
                        <img
                          src={getImageUrl(img)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border/50 rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                    <Home className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm">تصویری ثبت نشده</p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* ویژگی‌ها */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  مشخصات و ویژگی‌ها
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {(ad.area || ad.rooms || ad.floor || ad.totalFloors || ad.yearBuilt || ad.parking || ad.elevator || ad.storage || ad.balcony) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ad.area && <FeatureBadge icon={<Ruler className="w-4 h-4" />} label="متراژ" value={`${ad.area} متر`} />}
                    {ad.rooms && <FeatureBadge icon={<BedDouble className="w-4 h-4" />} label="اتاق" value={`${ad.rooms} خواب`} />}
                    {ad.floor && <FeatureBadge icon={<Layers className="w-4 h-4" />} label="طبقه" value={ad.floor} />}
                    {ad.totalFloors && <FeatureBadge icon={<Building className="w-4 h-4" />} label="کل طبقات" value={ad.totalFloors} />}
                    {ad.yearBuilt && <FeatureBadge icon={<Construction className="w-4 h-4" />} label="سال ساخت" value={ad.yearBuilt} />}
                    {ad.parking && <FeatureBadge icon={<Car className="w-4 h-4" />} label="پارکینگ" value="دارد" highlight />}
                    {ad.elevator && <FeatureBadge icon={<Armchair className="w-4 h-4" />} label="آسانسور" value="دارد" highlight />}
                    {ad.storage && <FeatureBadge icon={<Warehouse className="w-4 h-4" />} label="انباری" value="دارد" highlight />}
                    {ad.balcony && <FeatureBadge icon={<Home className="w-4 h-4" />} label="بالکن" value="دارد" highlight />}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">ویژگی خاصی ثبت نشده</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* توضیحات */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  توضیحات آگهی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {ad.description ? (
                  <p className="text-sm leading-8 whitespace-pre-wrap text-foreground/80">{ad.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">توضیحاتی ثبت نشده</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ستون کناری */}
        <div className="space-y-5">
          {/* وضعیت + قیمت */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={cn("rounded-2xl border shadow-sm overflow-hidden bg-gradient-to-br", status.bgGradient)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("p-2.5 rounded-xl border", status.className)}>
                    {status.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">وضعیت</p>
                    <p className="text-sm font-black">{status.label}</p>
                  </div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-border/30 mb-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-primary/70" />
                    {ad.adType === "sale" ? "قیمت فروش" : "اجاره"}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-primary">{formatPrice(ad.price)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/50 rounded-xl p-3 text-center border border-border/30">
                    <Eye className="w-4 h-4 text-primary/60 mx-auto mb-1" />
                    <p className="text-base font-black">{ad.views?.toLocaleString("fa-IR") || 0}</p>
                    <p className="text-[10px] text-muted-foreground">بازدید</p>
                  </div>
                  <div className="bg-background/50 rounded-xl p-3 text-center border border-border/30">
                    <Calendar className="w-4 h-4 text-primary/60 mx-auto mb-1" />
                    <p className="text-xs font-bold leading-tight">{getTimeAgo(ad.createdAt)}</p>
                    <p className="text-[10px] text-muted-foreground">ثبت</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* فروشنده */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  اطلاعات فروشنده
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  {/* ★ آواتار فروشنده – اصلاح‌شده برای حذف children از AvatarFallback */}
                  <Avatar className="h-12 w-12 ring-2 ring-primary/15 border border-border/60">
                    <AvatarImage
                      src={ad.userId?.avatar ? getImageUrl(ad.userId.avatar) : "/images/user.webp"}
                      alt={sellerName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold" />
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{sellerName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {ad.contactPhone || ad.userId?.phone || "—"}
                    </p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">ایمیل</span>
                    <span className="text-xs font-medium">{ad.userId?.email || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">تاریخ عضویت</span>
                    <span className="text-xs">{ad.userId?.createdAt ? formatDate(ad.userId.createdAt) : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">وضعیت</span>
                    <Badge className={cn("text-[10px]",
                      ad.userId?.isVerified
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                    )}>
                      {ad.userId?.isVerified ? "تأیید شده" : "عادی"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* موقعیت */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  موقعیت مکانی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {[
                  { label: "شهر", value: ad.city },
                  { label: "منطقه", value: ad.district },
                  { label: "استان", value: ad.province },
                ].filter((item) => item.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <span className="font-medium text-sm">{value}</span>
                  </div>
                ))}
                {ad.address && (
                  <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border/20">
                    <p className="text-xs text-muted-foreground mb-1">آدرس دقیق</p>
                    <p className="text-sm">{ad.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* مودال گالری */}
      <AnimatePresence>
        {galleryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setGalleryOpen(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={getImageUrl(images[currentImageIndex])}
              alt=""
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((p) => p === 0 ? images.length - 1 : p - 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((p) => p === images.length - 1 ? 0 : p + 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_: string, idx: number) => (
                    <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                      className={cn("w-2.5 h-2.5 rounded-full transition-all",
                        idx === currentImageIndex ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال رد */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <XCircle className="w-5 h-5 text-red-500" /> رد آگهی
            </DialogTitle>
            <DialogDescription className="text-xs">
              دلیل رد آگهی به کاربر نمایش داده می‌شود.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="مثال: تصاویر نامرتبط، اطلاعات ناقص..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="rounded-xl resize-none text-sm my-2"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)} className="rounded-xl text-xs">
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading} className="rounded-xl text-xs gap-1.5">
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              ثبت و رد آگهی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال حذف */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-destructive">
              <Trash2 className="w-5 h-5" /> حذف آگهی
            </DialogTitle>
          </DialogHeader>
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 my-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>آیا از حذف این آگهی اطمینان دارید؟ این عمل غیرقابل بازگشت است.</span>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl text-xs">
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading} className="rounded-xl text-xs gap-1.5">
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              حذف قطعی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}