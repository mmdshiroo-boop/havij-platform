// app/panel/expert/rejected/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  XCircle,
  Search,
  X,
  MapPin,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { expertApi } from "@/services/api/expert.api";
import { getImageUrl } from "@/lib/getImageUrl"; // ✅ helper مرکزی

// ─── فرمت‌دهنده‌ها ──────────────────────
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

// ❌ تابع getImageUrl محلی حذف شد — استفاده از helper مرکزی

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function RejectedAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 12;

  const fetchAds = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await expertApi.getRejectedAds({
          page,
          limit,
          search: searchTerm || undefined,
        });
        setAds(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalAds(res.pagination?.total || 0);
      } catch (error) {
        toast.error("خطا در دریافت آگهی‌های رد شده");
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
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              آگهی‌های رد شده
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalAds > 0 ? `${totalAds.toLocaleString("fa-IR")} آگهی رد شده` : "لیست آگهی‌های رد شده"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 px-4 py-2 rounded-full text-xs font-bold gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> رد شده
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-1.5 rounded-xl border-border/60 hover:bg-muted"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
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
        <Button onClick={handleSearch} variant="outline" className="rounded-xl h-10 border-border/60 hover:bg-muted gap-1.5">
          <Search className="w-4 h-4" /> جستجو
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted flex items-center justify-center rounded-full">
              <XCircle className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1.5">هیچ آگهی رد شده‌ای یافت نشد</h3>
            <p className="text-muted-foreground text-xs">
              {searchTerm ? "با عبارت دیگری جستجو کنید" : "آگهی‌های رد شده در اینجا نمایش داده می‌شوند"}
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
                    <Badge className="absolute top-2 right-2 bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-bold">
                      <XCircle className="w-3 h-3 ml-1" /> رد شده
                    </Badge>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <Link href={`/ad/${ad._id}`} target="_blank" className="font-bold text-sm line-clamp-1 hover:text-primary transition-colors">
                        {ad.title}
                      </Link>
                      <p className="font-black text-primary text-lg">{formatPrice(ad.price)}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary/70" />{ad.city || "نامشخص"}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary/70" />{getTimeAgo(ad.createdAt)}</span>
                      </div>
                      {ad.rejectReason && (
                        <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg p-2 mt-1 line-clamp-2">
                          دلیل: {ad.rejectReason}
                        </p>
                      )}
                    </div>
                    <div className="pt-3 mt-3 border-t border-border/40">
                      <Button variant="outline" size="sm" className="w-full gap-1 rounded-lg text-xs" onClick={() => window.open(`/ad/${ad._id}`, "_blank")}>
                        <Eye className="w-3.5 h-3.5" /> مشاهده
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
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
    </motion.div>
  );
}