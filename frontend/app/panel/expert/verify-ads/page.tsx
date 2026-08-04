// app/panel/expert/verify-ads/page.tsx
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
  AlertTriangle,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { expertApi } from "@/services/api/expert.api";
import { getImageUrl } from "@/lib/getImageUrl"; // ✅ helper مرکزی
import { cn } from "@/lib/utils";

const formatPrice = (price: number) => {
  if (!price) return "توافقی";
  if (price >= 1_000_000_000)
    return `${(price / 1_000_000_000).toFixed(1)} میلیارد`;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} میلیون`;
  return price.toLocaleString("fa-IR") + " تومان";
};

const getTimeAgo = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  if (diffHrs < 1) return "کمتر از ۱ ساعت";
  if (diffHrs < 24) return `${diffHrs} ساعت`;
  return `${Math.floor(diffHrs / 24)} روز`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
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

  const handleApprove = async (id: string, title: string) => {
    setActionLoading(id);
    try {
      await expertApi.approveAd(id);
      toast.success(`آگهی "${title}" تأیید شد`);
      fetchAds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در تأیید آگهی");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectAdId(id);
    setRejectReason("");
  };

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
              بررسی و تأیید آگهی‌ها
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalAds > 0
                ? `${totalAds.toLocaleString("fa-IR")} آگهی در انتظار`
                : "لیست آگهی‌های در انتظار"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-4 py-2 rounded-full text-xs font-bold gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> در انتظار
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-1.5 rounded-xl border-border/60 hover:bg-muted"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            {refreshing ? "در حال بروزرسانی..." : "بروزرسانی"}
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی عنوان، شهر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pr-9 rounded-xl h-10 bg-muted/40 border-border/60 focus:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setPage(1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          variant="outline"
          className="rounded-xl h-10 border-border/60 hover:bg-muted gap-1.5"
        >
          <Search className="w-4 h-4" /> جستجو
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted flex items-center justify-center rounded-full">
              <CheckCircle className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1.5">
              هیچ آگهی در انتظاری وجود ندارد
            </h3>
            <p className="text-muted-foreground text-xs">
              {searchTerm ? "با عبارت دیگری جستجو کنید" : "آگهی‌های در انتظار تأیید اینجا نمایش داده می‌شوند"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map((ad, index) => (
              <motion.div key={ad._id} variants={itemVariants}>
                <Card className="border-border/60 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm group h-full flex flex-col">
                  <div className="relative h-40 bg-muted overflow-hidden">
                    {ad.images?.[0] ? (
                      <img
                        src={getImageUrl(ad.images[0])}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/user.webp"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                        <FileText className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">
                      <Clock className="w-3 h-3 ml-1" /> در انتظار
                    </Badge>
                    <Link
                      href={`/panel/expert/pending/${ad._id}`}
                      className="absolute bottom-2 left-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <Link href={`/panel/expert/pending/${ad._id}`} className="font-bold text-sm line-clamp-1 hover:text-primary transition-colors">
                        {ad.title}
                      </Link>
                      <p className="font-black text-primary text-lg">{formatPrice(ad.price)}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary/70" />{ad.city || "نامشخص"}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary/70" />{getTimeAgo(ad.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 mt-3 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs gap-1 rounded-lg text-emerald-600 border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
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
                        className="flex-1 h-8 text-xs gap-1 rounded-lg text-rose-600 border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10"
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl h-9 gap-1">
                <ChevronRight className="w-4 h-4" /> قبلی
              </Button>
              <span className="text-sm font-bold px-4">{page} از {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-xl h-9 gap-1">
                بعدی <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      <Dialog open={!!rejectAdId} onOpenChange={(open) => !open && setRejectAdId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border/50" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              رد آگهی
            </DialogTitle>
            <DialogDescription>
              لطفاً دلیل رد آگهی را وارد کنید. این دلیل به آژانس نمایش داده خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Textarea
              placeholder="مثال: تصاویر نامرتبط، اطلاعات ناقص..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="resize-none rounded-xl bg-muted/40 border-border/60 focus:ring-primary"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectAdId(null)} className="rounded-xl">
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading === rejectAdId}
              className="rounded-xl gap-1"
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
    </motion.div>
  );
}