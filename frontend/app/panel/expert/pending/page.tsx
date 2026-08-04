// app/panel/expert/pending/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Calendar,
  MapPin,
  User,
  Phone,
  Loader2,
  Clock,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { expertApi } from "@/services/api/expert.api";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";

interface Ad {
  _id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  images: string[];
  userId: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  category: { name: string };
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const formatPrice = (price: number) => {
  if (!price || price === 0) return "توافقی";
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} میلیارد تومان`;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} میلیون تومان`;
  return price.toLocaleString("fa-IR") + " تومان";
};

const formatDate = (date: string) => {
  if (!date) return "نامشخص";
  return new Date(date).toLocaleDateString("fa-IR");
};

export default function ExpertPendingAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAds = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await expertApi.getPendingAds({
        page: 1,
        limit: 20,
        search: searchTerm || undefined,
      });
      const adsData = response.data || response.ads || [];
      setAds(adsData);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "خطا در دریافت آگهی‌ها");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAds();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAds]);

  const handleApprove = async (id: string) => {
    setApproveLoadingId(id);
    try {
      await expertApi.approveAd(id);
      toast.success("✅ آگهی با موفقیت تایید شد");
      fetchAds(true);
      setShowDetailModal(false);
      setSelectedAd(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "خطا در تایید آگهی");
    } finally {
      setApproveLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAd) return;
    if (!rejectReason.trim()) {
      toast.error("لطفاً دلیل رد آگهی را وارد کنید");
      return;
    }
    setActionLoading(true);
    try {
      await expertApi.rejectAd(selectedAd._id, rejectReason);
      toast.success("❌ آگهی با موفقیت رد شد");
      fetchAds(true);
      setShowDetailModal(false);
      setSelectedAd(null);
      setRejectReason("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "خطا در رد آگهی");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailModal = (ad: Ad) => {
    setSelectedAd(ad);
    setRejectReason("");
    setShowDetailModal(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              آگهی‌های در انتظار تأیید
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              بررسی و تأیید آگهی‌های ثبت‌شده
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAds(true)}
          disabled={refreshing}
          className="gap-1.5 rounded-xl border-border/60 hover:bg-muted self-end sm:self-auto"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          {refreshing ? "در حال بروزرسانی..." : "بروزرسانی"}
        </Button>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="جستجوی آگهی (عنوان، شهر)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 rounded-xl h-10 bg-muted/40 border-border/60 focus:ring-primary"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted flex items-center justify-center rounded-full">
              <CheckCircle className="w-8 h-8 text-emerald-500/50" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1.5">
              هیچ آگهی در انتظار تأیید نیست
            </h3>
            <p className="text-muted-foreground text-xs">همه آگهی‌ها بررسی شده‌اند</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ads.map((ad, index) => (
            <motion.div key={ad._id} variants={itemVariants}>
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm group">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                  {/* Image */}
                  <div className="w-full sm:w-24 h-44 sm:h-24 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/30">
                    {ad.images?.[0] ? (
                      <img
                        src={getImageUrl(ad.images[0])}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/user.webp"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {ad.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary/70" />
                          {ad.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary/70" />
                          {formatDate(ad.createdAt)}
                        </span>
                        <span className="font-bold text-primary">{formatPrice(ad.price)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {ad.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 rounded-lg text-xs"
                        onClick={() => openDetailModal(ad)}
                      >
                        <Eye className="w-3.5 h-3.5" /> جزئیات
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 rounded-lg text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => handleApprove(ad._id)}
                        disabled={approveLoadingId === ad._id}
                      >
                        {approveLoadingId === ad._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        تأیید
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1 rounded-lg text-xs"
                        onClick={() => openDetailModal(ad)}
                      >
                        <XCircle className="w-3.5 h-3.5" /> رد
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border-border/50" dir="rtl">
          {selectedAd && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-extrabold">{selectedAd.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Images */}
                {selectedAd.images && selectedAd.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedAd.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={getImageUrl(img)}
                        alt={`تصویر ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-xl border border-border/30 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/user.webp"; }}
                      />
                    ))}
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">قیمت</p>
                    <p className="font-bold">{formatPrice(selectedAd.price)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">شهر</p>
                    <p className="font-bold">{selectedAd.city}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">دسته‌بندی</p>
                    <p className="font-bold">{selectedAd.category?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">تاریخ ثبت</p>
                    <p className="font-bold">{formatDate(selectedAd.createdAt)}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm font-bold mb-1">توضیحات</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/20 rounded-xl p-3 border border-border/30">
                    {selectedAd.description}
                  </p>
                </div>

                {/* Contact */}
                <div className="bg-muted/20 rounded-xl p-4 space-y-2 border border-border/30">
                  <p className="text-sm font-bold">اطلاعات تماس کاربر</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedAd.userId.firstName} {selectedAd.userId.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedAd.userId.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Reject Form */}
                <div className="border-t border-border/40 pt-4">
                  <Label className="text-sm font-bold">دلیل رد آگهی</Label>
                  <Textarea
                    placeholder="دلیل رد آگهی را وارد کنید..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="mt-2 rounded-xl bg-muted/40 border-border/60 focus:ring-primary"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDetailModal(false)} className="rounded-xl">
                  انصراف
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="gap-2 rounded-xl"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  رد آگهی
                </Button>
                <Button
                  onClick={() => handleApprove(selectedAd._id)}
                  disabled={approveLoadingId === selectedAd._id}
                  className="gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {approveLoadingId === selectedAd._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  تأیید آگهی
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}