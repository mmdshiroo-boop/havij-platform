// app/panel/expert/pending/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  Tag,
  Eye,
  Phone,
  AlertTriangle,
  FileText,
  Home,
  ImageIcon,
  ArrowLeft,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { expertApi } from "@/services/api/expert.api";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";

export default function ExpertReviewAdPage() {
  const params = useParams();
  const router = useRouter();
  const adId = params.id as string;

  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (adId) fetchAdDetails();
  }, [adId]);

  const fetchAdDetails = async () => {
    try {
      setLoading(true);
      const response = await expertApi.getPendingAdById(adId);
      let adData = response.data || response;
      if (response.success && response.data) adData = response.data;
      setAd(adData);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "خطا در دریافت اطلاعات");
      router.push("/panel/expert/pending");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await expertApi.approveAd(adId);
      toast.success("✅ آگهی با موفقیت تأیید شد");
      router.push("/panel/expert/pending");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "خطا در تأیید آگهی");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("لطفاً دلیل رد آگهی را وارد کنید");
      return;
    }
    setSubmitting(true);
    try {
      await expertApi.rejectAd(adId, rejectionReason);
      toast.success("❌ آگهی با موفقیت رد شد");
      router.push("/panel/expert/pending");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "خطا در رد آگهی");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return "نامشخص";
    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
  };

  const formatDate = (date?: string) => {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR");
  };

  const getLocationText = () => {
    if (!ad) return "نامشخص";
    if (ad.location) {
      let text = "";
      if (ad.location.province) text += ad.location.province;
      if (ad.location.city) text += (text ? "، " : "") + ad.location.city;
      if (ad.location.district) text += (text ? " - " : "") + ad.location.district;
      if (text) return text;
    }
    return ad.city || ad.province || ad.address || "موقعیت نامشخص";
  };

  const getUserName = () => {
    if (!ad) return "نامشخص";
    if (ad.userId?.firstName) return `${ad.userId.firstName} ${ad.userId.lastName || ""}`;
    if (ad.user?.firstName) return `${ad.user.firstName} ${ad.user.lastName || ""}`;
    return ad.contactName || ad.fullName || "نامشخص";
  };

  const getUserPhone = () => {
    if (!ad) return null;
    return ad.userId?.phone || ad.user?.phone || ad.contactPhone || ad.phoneNumber || null;
  };

  if (loading) {
    return (
      <div className="space-y-6 px-3 sm:px-6 py-8" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4" dir="rtl">
        <AlertTriangle className="w-16 h-16 text-yellow-500" />
        <h2 className="text-xl font-bold">آگهی یافت نشد</h2>
        <Button onClick={() => router.back()} className="gap-2 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> بازگشت
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 rounded-xl border-border/60 hover:bg-muted"
      >
        <ArrowLeft className="w-4 h-4" /> بازگشت به لیست
      </Button>

      {/* Header card */}
      <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-5 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">
                در انتظار بررسی • {formatDate(ad.createdAt)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground mb-2">
              {ad.title || "بدون عنوان"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4 text-primary/70" />
                {ad.category?.name || "دسته‌بندی نشده"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary/70" />
                {getLocationText()}
              </span>
            </div>
          </div>
          <div className="text-2xl font-black text-primary">{formatPrice(ad.price)}</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {ad.images && ad.images.length > 0 && (
            <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-primary" /> تصاویر آگهی
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ad.images.map((image: string, index: number) => (
                    <div
                      key={index}
                      className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/30"
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`تصویر ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/user.webp"; }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {ad.description && (
            <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" /> توضیحات
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground bg-muted/20 rounded-xl p-4 border border-border/30">
                  {ad.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Property details */}
          {ad.propertyDetails && (
            <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                  <Home className="w-5 h-5 text-primary" /> جزئیات ملک
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {ad.propertyDetails.area && (
                    <div>
                      <p className="text-muted-foreground text-xs">متراژ</p>
                      <p className="font-bold">{ad.propertyDetails.area} متر مربع</p>
                    </div>
                  )}
                  {ad.propertyDetails.rooms && (
                    <div>
                      <p className="text-muted-foreground text-xs">تعداد اتاق</p>
                      <p className="font-bold">{ad.propertyDetails.rooms}</p>
                    </div>
                  )}
                  {ad.propertyDetails.propertyType && (
                    <div>
                      <p className="text-muted-foreground text-xs">نوع ملک</p>
                      <p className="font-bold">{ad.propertyDetails.propertyType}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-base font-bold">اقدامات کارشناسی</h2>

              <Button
                onClick={handleApprove}
                disabled={submitting}
                className="w-full gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? "در حال تأیید..." : "تأیید آگهی"}
              </Button>

              <div className="space-y-3">
                <Label className="text-sm font-bold">دلیل رد (در صورت نیاز)</Label>
                <Textarea
                  placeholder="دلیل رد آگهی..."
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="rounded-xl bg-muted/40 border-border/60 focus:ring-primary resize-none"
                />
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={submitting || !rejectionReason.trim()}
                  className="w-full gap-2 rounded-xl font-bold"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  رد آگهی
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User info */}
          <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> اطلاعات آگهی‌دهنده
              </h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نام:</span>
                  <span className="font-bold">{getUserName()}</span>
                </div>
                {getUserPhone() && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">تلفن:</span>
                    <a href={`tel:${getUserPhone()}`} className="font-bold text-primary hover:underline flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {getUserPhone()}
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">بازدید:</span>
                  <span className="font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-primary/70" />
                    {ad.views || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}