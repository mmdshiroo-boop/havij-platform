"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Eye,
  Home,
  Ruler,
  Building,
  DollarSign,
  Phone,
  User,
  Trash2,
  Loader2,
  Tag,
  Layers,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  BadgeCheck,
  BadgeX,
  BedDouble,
  Car,
  Warehouse,
  Armchair,
  Construction,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";

// ─── فرمت‌دهنده‌ها ──────────────────────
const formatPrice = (price: number) => {
  if (!price) return "توافقی";
  if (price >= 1_000_000_000)
    return `${(price / 1_000_000_000).toFixed(1)} میلیارد تومان`;
  if (price >= 1_000_000)
    return `${(price / 1_000_000).toFixed(0)} میلیون تومان`;
  return price.toLocaleString() + " تومان";
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const getTimeAgo = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  if (diffHrs < 1) return "کمتر از ۱ ساعت پیش";
  if (diffHrs < 24) return `${diffHrs} ساعت پیش`;
  return `${Math.floor(diffHrs / 24)} روز پیش`;
};

const getImageUrl = (url: string) => {
  if (!url) return "/placeholder.jpg";
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${url}`;
};

// ─── وضعیت آگهی ──────────────────────────
const statusMap: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; bgGradient: string }
> = {
  pending: {
    label: "در انتظار تأیید",
    color:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    icon: <Clock className="w-4 h-4" />,
    bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
  },
  active: {
    label: "تأیید شده / فعال",
    color:
      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    icon: <BadgeCheck className="w-4 h-4" />,
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
  },
  rejected: {
    label: "رد شده",
    color:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    icon: <BadgeX className="w-4 h-4" />,
    bgGradient: "from-red-500/10 via-red-500/5 to-transparent",
  },
  sold: {
    label: "فروخته شده",
    color:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    icon: <CheckCircle className="w-4 h-4" />,
    bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
  },
  expired: {
    label: "منقضی",
    color:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
    icon: <AlertCircle className="w-4 h-4" />,
    bgGradient: "from-slate-500/10 via-slate-500/5 to-transparent",
  },
};

// ─── انیمیشن‌ها ──────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

// ─── کامپوننت نشانگر ویژگی‌ها ──────────────
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
    <div
      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
        highlight
          ? "bg-primary/5 border-primary/20 text-primary"
          : "bg-background/60 border-border/40 hover:border-border"
      }`}
    >
      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-xs font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

export default function AdminAdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // گالری
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchAd();
  }, []);

  const fetchAd = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/ads/${params.id}`);
      setAd(res.data.data);
    } catch {
      toast.error("خطا در دریافت اطلاعات آگهی");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/ads/admin/${ad._id}/approve`);
      toast.success("آگهی با موفقیت تأیید شد");
      fetchAd();
    } catch {
      toast.error("خطا در تأیید آگهی");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/panel/ads/admin/${ad._id}/reject`, {
        reason: rejectReason || "نامناسب",
      });
      toast.success("آگهی رد شد");
      setShowRejectModal(false);
      setRejectReason("");
      fetchAd();
    } catch {
      toast.error("خطا در رد آگهی");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await apiClient.delete(`/ads/${ad._id}`);
      toast.success("آگهی با موفقیت حذف شد");
      router.push("/panel/admin/ads");
    } catch {
      toast.error("خطا در حذف آگهی");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── لودینگ ──────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6" dir="rtl">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── خطا ─────────────────────────────────
  if (!ad) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        dir="rtl"
      >
        <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-bold">آگهی یافت نشد</h2>
        <p className="text-muted-foreground text-sm">
          این آگهی ممکن است حذف شده باشد یا دسترسی به آن نداشته باشید.
        </p>
        <Link href="/panel/admin/ads">
          <Button variant="outline" className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" /> بازگشت به لیست
          </Button>
        </Link>
      </div>
    );
  }

  const status = statusMap[ad.status] || statusMap.pending;
  const sellerName =
    ad.contactName ||
    `${ad.userId?.firstName || ""} ${ad.userId?.lastName || ""}`.trim() ||
    "کاربر";
  const images = ad.images || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6" dir="rtl">
      {/* ─── هدر + بردکرامب ─── */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Link href="/panel/admin/ads">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
              <Link
                href="/admin/ads"
                className="hover:text-primary transition-colors"
              >
                مدیریت آگهی‌ها
              </Link>
              <ChevronLeft className="w-3 h-3" />
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {ad.title}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight line-clamp-1">
              {ad.title}
            </h1>
          </div>
        </div>

        {/* دکمه‌های عملیات سریع */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {ad.status === "pending" && (
            <>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-500/20"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                تأیید آگهی
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10 rounded-xl"
                onClick={() => setShowRejectModal(true)}
              >
                <XCircle className="w-4 h-4" />
                رد آگهی
              </Button>
            </>
          )}
          {ad.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10 rounded-xl"
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle className="w-4 h-4" />
              لغو تأیید
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10 rounded-xl"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={actionLoading}
          >
            <Trash2 className="w-4 h-4" />
            حذف
          </Button>
        </div>
      </motion.div>

      {/* ─── بدنه اصلی ─── */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* ستون اصلی (راست) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── گالری تصاویر ── */}
          <motion.div variants={fadeInUp}>
            {images.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden bg-muted/30 border border-border/50 shadow-sm group">
                {/* تصویر اصلی */}
                <div
                  className="relative aspect-[16/9] cursor-pointer"
                  onClick={() => setGalleryOpen(true)}
                >
                  <img
                    src={getImageUrl(images[currentImageIndex])}
                    alt={ad.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  {/* دکمه بزرگ‌نمایی */}
                  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-background/80 backdrop-blur-md rounded-xl gap-1"
                    >
                      <Maximize2 className="w-4 h-4" /> بزرگ‌نمایی
                    </Button>
                  </div>

                  {/* شمارش تصاویر */}
                  <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-bold">
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  {/* ناوبری */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) =>
                            prev === 0 ? images.length - 1 : prev - 1,
                          );
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-background"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) =>
                            prev === images.length - 1 ? 0 : prev + 1,
                          );
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-background"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* بندانگشتی‌ها */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 bg-card/50 backdrop-blur-sm border-t border-border/30 overflow-x-auto">
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          idx === currentImageIndex
                            ? "border-primary shadow-md shadow-primary/20"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt=""
                          className="w-full h-full object-cover"
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
                  <p className="text-sm font-medium">
                    تصویری برای این آگهی ثبت نشده است
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* ── ویژگی‌های ملک ── */}
          <motion.div variants={fadeInUp}>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-gradient-to-br from-card to-muted/5">
              <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  مشخصات و ویژگی‌ها
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {ad.area && (
                    <FeatureBadge
                      icon={<Ruler className="w-4 h-4" />}
                      label="متراژ"
                      value={`${ad.area} متر`}
                    />
                  )}
                  {ad.rooms && (
                    <FeatureBadge
                      icon={<BedDouble className="w-4 h-4" />}
                      label="اتاق"
                      value={`${ad.rooms} خواب`}
                    />
                  )}
                  {ad.floor && (
                    <FeatureBadge
                      icon={<Layers className="w-4 h-4" />}
                      label="طبقه"
                      value={`${ad.floor}`}
                    />
                  )}
                  {ad.totalFloors && (
                    <FeatureBadge
                      icon={<Building className="w-4 h-4" />}
                      label="کل طبقات"
                      value={`${ad.totalFloors}`}
                    />
                  )}
                  {ad.yearBuilt && (
                    <FeatureBadge
                      icon={<Construction className="w-4 h-4" />}
                      label="سال ساخت"
                      value={`${ad.yearBuilt}`}
                    />
                  )}
                  {ad.parking && (
                    <FeatureBadge
                      icon={<Car className="w-4 h-4" />}
                      label="پارکینگ"
                      value="دارد"
                      highlight
                    />
                  )}
                  {ad.elevator && (
                    <FeatureBadge
                      icon={<Armchair className="w-4 h-4" />}
                      label="آسانسور"
                      value="دارد"
                      highlight
                    />
                  )}
                  {ad.storage && (
                    <FeatureBadge
                      icon={<Warehouse className="w-4 h-4" />}
                      label="انباری"
                      value="دارد"
                      highlight
                    />
                  )}
                  {ad.balcony && (
                    <FeatureBadge
                      icon={<Home className="w-4 h-4" />}
                      label="بالکن"
                      value="دارد"
                      highlight
                    />
                  )}
                </div>
                {!ad.area && !ad.rooms && !ad.floor && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    ویژگی خاصی برای این آگهی ثبت نشده است
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── توضیحات ── */}
          <motion.div variants={fadeInUp}>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  توضیحات آگهی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {ad.description ? (
                  <p className="text-sm leading-8 whitespace-pre-wrap text-foreground/80">
                    {ad.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    توضیحاتی برای این آگهی ثبت نشده است
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ستون کناری (چپ) */}
        <div className="space-y-5">
          {/* ── کارت وضعیت ── */}
          <motion.div variants={fadeInUp}>
            <Card
              className={`rounded-2xl border shadow-sm overflow-hidden bg-gradient-to-br ${status.bgGradient}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${status.color} border`}>
                    {status.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">وضعیت آگهی</p>
                    <p className="text-sm font-black">{status.label}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* قیمت */}
                  <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-primary/70" />
                      {ad.adType === "sale" ? "قیمت فروش" : "اجاره"}
                    </p>
                    <p className="text-2xl font-black text-primary">
                      {formatPrice(ad.price)}
                    </p>
                    {ad.priceType === "negotiable" && (
                      <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 text-[10px]">
                        قابل مذاکره
                      </Badge>
                    )}
                  </div>

                  {/* آمار */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 rounded-xl p-3 text-center border border-border/30">
                      <Eye className="w-4 h-4 text-primary/60 mx-auto mb-1" />
                      <p className="text-lg font-black">
                        {ad.views?.toLocaleString() || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        بازدید
                      </p>
                    </div>
                    <div className="bg-background/50 rounded-xl p-3 text-center border border-border/30">
                      <Calendar className="w-4 h-4 text-primary/60 mx-auto mb-1" />
                      <p className="text-lg font-black">
                        {getTimeAgo(ad.createdAt)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        تاریخ ثبت
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── کارت فروشنده ── */}
          <motion.div variants={fadeInUp}>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  اطلاعات فروشنده
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {ad.userId?.firstName?.[0] ||
                        ad.userId?.phone?.[0] ||
                        "?"}
                    </AvatarFallback>
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
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ایمیل</span>
                    <span className="font-medium text-xs">
                      {ad.userId?.email || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاریخ عضویت</span>
                    <span className="font-medium text-xs">
                      {ad.userId?.createdAt
                        ? formatDate(ad.userId.createdAt)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">وضعیت کاربر</span>
                    <Badge
                      className={
                        ad.userId?.isVerified
                          ? "bg-emerald-100 text-emerald-700 text-[10px]"
                          : "bg-amber-100 text-amber-700 text-[10px]"
                      }
                    >
                      {ad.userId?.isVerified ? "تأیید شده" : "عادی"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── کارت موقعیت ── */}
          <motion.div variants={fadeInUp}>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  موقعیت مکانی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">شهر</span>
                    <span className="font-medium">{ad.city}</span>
                  </div>
                  {ad.district && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">منطقه</span>
                      <span className="font-medium">{ad.district}</span>
                    </div>
                  )}
                  {ad.province && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">استان</span>
                      <span className="font-medium">{ad.province}</span>
                    </div>
                  )}
                  {ad.address && (
                    <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        آدرس دقیق
                      </p>
                      <p className="text-sm">{ad.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* ─── مودال گالری تمام‌صفحه ─── */}
      <AnimatePresence>
        {galleryOpen && (
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setGalleryOpen(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={getImageUrl(images[currentImageIndex])}
              alt=""
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? images.length - 1 : prev - 1,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === images.length - 1 ? 0 : prev + 1,
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}

            {/* بندانگشتی‌های پایین */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      idx === currentImageIndex
                        ? "bg-white scale-125"
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── مودال رد آگهی ─── */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <XCircle className="w-5 h-5 text-red-500" />
              رد آگهی
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              لطفاً دلیل رد این آگهی را وارد کنید. این پیام به کاربر نمایش داده
              خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="مثال: تصاویر نامرتبط، اطلاعات ناقص، محتوای نامناسب..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="rounded-xl resize-none"
          />
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowRejectModal(false)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl gap-1.5"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              ثبت و رد آگهی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── مودال تأیید حذف ─── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-red-600">
              <Trash2 className="w-5 h-5 text-red-500" />
              حذف آگهی
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              آیا از حذف این آگهی اطمینان دارید؟ این عمل غیرقابل بازگشت است.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowDeleteConfirm(false)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl gap-1.5 bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              حذف قطعی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
