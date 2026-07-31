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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  Search,
  X,
  MapPin,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { expertApi } from "@/services/api/expert.api";

// ─── فرمت‌دهنده‌ها ──────────────────────
const formatPrice = (price: number) => {
  if (!price) return "توافقی";
  if (price >= 1_000_000_000)
    return `${(price / 1_000_000_000).toFixed(1)} میلیارد`;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} میلیون`;
  return price.toLocaleString() + " تومان";
};

const getTimeAgo = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  if (diffHrs < 1) return "کمتر از ۱ ساعت";
  if (diffHrs < 24) return `${diffHrs} ساعت`;
  return `${Math.floor(diffHrs / 24)} روز`;
};

const getImageUrl = (url: string) => {
  if (!url) return "/placeholder.jpg";
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${url}`;
};

export default function VerifyAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 12;

  // عملیات تأیید/رد
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectAdId, setRejectAdId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchAds = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await expertApi.getPendingAds({
          page,
          limit,
          search: searchTerm || undefined,
        });
        setAds(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalAds(res.pagination?.total || 0);
      } catch (error) {
        toast.error("خطا در دریافت آگهی‌ها");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, searchTerm],
  );

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleSearch = () => setPage(1);
  const handleRefresh = () => {
    fetchAds(true);
    toast.success("لیست بروزرسانی شد");
  };

  // تأیید آگهی
  const handleApprove = async (id: string, title: string) => {
    setActionLoading(id);
    try {
      await expertApi.approveAd(id);
      toast.success(`آگهی "${title}" تأیید شد`);
      fetchAds(); // بروزرسانی لیست
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در تأیید آگهی");
    } finally {
      setActionLoading(null);
    }
  };

  // باز کردن مودال رد
  const openRejectModal = (id: string) => {
    setRejectAdId(id);
    setRejectReason("");
  };

  // ارسال رد
  const handleReject = async () => {
    if (!rejectAdId) return;
    if (!rejectReason.trim()) {
      toast.error("لطفاً دلیل رد را وارد کنید");
      return;
    }
    setActionLoading(rejectAdId);
    try {
      await expertApi.rejectAd(rejectAdId, rejectReason);
      toast.success("آگهی رد شد");
      setRejectAdId(null);
      fetchAds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در رد آگهی");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-500/15 via-amber-500/5 to-transparent p-6 border border-amber-500/10 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl ring-1 ring-amber-200/50 dark:ring-amber-500/20">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">بررسی و تأیید آگهی‌ها</h1>
              <p className="text-sm text-muted-foreground">
                {totalAds > 0
                  ? `${totalAds} آگهی در انتظار`
                  : "لیست آگهی‌های در انتظار"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 text-white px-4 py-2 rounded-full text-xs font-bold gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> در انتظار
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-1.5 rounded-xl"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              بروزرسانی
            </Button>
          </div>
        </div>
      </motion.div>

      {/* جستجو */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی عنوان، شهر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pr-10 rounded-xl bg-muted/30 border-0 focus:ring-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setPage(1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-amber-500" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          variant="outline"
          className="rounded-xl gap-1"
        >
          <Search className="w-4 h-4" /> جستجو
        </Button>
      </div>

      {/* لیست */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center text-muted-foreground">
            <CheckCircle className="w-14 h-14 mx-auto mb-4 text-amber-500/20" />
            <p className="text-sm font-medium">
              هیچ آگهی در انتظاری وجود ندارد
            </p>
            {searchTerm && (
              <p className="text-xs mt-1">با عبارت دیگری جستجو کنید</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map((ad, index) => (
              <motion.div
                key={ad._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  {/* تصویر */}
                  <div className="relative h-32 bg-muted overflow-hidden">
                    {ad.images?.[0] ? (
                      <img
                        src={getImageUrl(ad.images[0])}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={ad.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/5 dark:to-amber-500/10">
                        <FileText className="w-10 h-10 text-amber-300 dark:text-amber-500/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0.5 shadow-md">
                        در انتظار
                      </Badge>
                    </div>
                    {/* دکمه مشاهده جزئیات */}
                    <Link
                      href={`/panel/expert/pending/${ad._id}`}
                      className="absolute bottom-2 left-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <CardContent className="p-3 space-y-1.5">
                    <Link href={`/panel/expert/pending/${ad._id}`}>
                      <h3 className="font-bold text-sm line-clamp-1 hover:text-amber-600 transition-colors">
                        {ad.title}
                      </h3>
                    </Link>

                    <p className="text-base font-extrabold text-foreground">
                      {formatPrice(ad.price)}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> {ad.city}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> {getTimeAgo(ad.createdAt)}
                      </span>
                    </div>

                    {/* دکمه‌های عملیات */}
                    <div className="flex gap-2 mt-2 pt-2 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                        disabled={actionLoading === ad._id}
                        onClick={() => handleApprove(ad._id, ad.title)}
                      >
                        {actionLoading === ad._id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        تأیید
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs gap-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                        disabled={actionLoading === ad._id}
                        onClick={() => openRejectModal(ad._id)}
                      >
                        <XCircle className="w-3 h-3" />
                        رد
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* صفحه‌بندی */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 rounded-full"
              >
                <ChevronRight className="w-4 h-4" /> قبلی
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) pageNum = i + 1;
                  else if (page <= 4) pageNum = i + 1;
                  else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                  else pageNum = page - 3 + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 p-0 rounded-full ${
                        page === pageNum
                          ? "bg-amber-500 hover:bg-amber-600"
                          : ""
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="gap-1 rounded-full"
              >
                بعدی <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* مودال رد */}
      <Dialog
        open={!!rejectAdId}
        onOpenChange={(open) => !open && setRejectAdId(null)}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              رد آگهی
            </DialogTitle>
            <DialogDescription>
              لطفاً دلیل رد آگهی را وارد کنید. این دلیل به آژانس نمایش داده
              خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Textarea
              placeholder="مثال: تصاویر نامرتبط، اطلاعات ناقص..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectAdId(null)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading === rejectAdId}
            >
              {actionLoading === rejectAdId ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              رد آگهی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
