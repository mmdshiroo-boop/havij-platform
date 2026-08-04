"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle,
  Search,
  X,
  MapPin,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { expertApi } from "@/services/api/expert.api";
import apiClient from "@/services/api/client";
import { useAuth } from "@/app/context/AuthContext";
import { getImageUrl } from "@/lib/getImageUrl"; // ✅ helper مرکزی
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdCard } from "@/components/home/AdCard"; // ✅ کارت آگهی استاندارد

// 📅 DatePicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment-jalaali";

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

export default function ApprovedAdsPage() {
  const { user } = useAuth();
  const canDelete =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "expert";

  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 12;

  const toApiDate = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    return moment(date).format("YYYY-MM-DD");
  };

  const applyFilters = () => {
    setPage(1);
    setModalOpen(false);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const fetchAds = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const params: any = { page, limit, search: searchTerm || undefined };
        const from = toApiDate(startDate);
        const to = toApiDate(endDate);
        if (from) params.startDate = from;
        if (to) params.endDate = to;

        const res = await expertApi.getApprovedAds(params);
        setAds(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalAds(res.pagination?.total || 0);
      } catch (error) {
        toast.error("خطا در دریافت آگهی‌های تأیید شده");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, searchTerm, startDate, endDate],
  );

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleSearch = () => setPage(1);
  const handleRefresh = () => fetchAds(true);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/ads/${deleteTarget}`);
      toast.success("آگهی با موفقیت حذف شد");
      setAds((prev) => prev.filter((a) => a._id !== deleteTarget));
      setTotalAds((prev) => prev - 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در حذف آگهی");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const formatJalali = (date: Date | null): string => {
    if (!date) return "";
    return moment(date).format("jYYYY/jMM/jDD");
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                آگهی‌های تأیید شده
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalAds > 0
                  ? `${totalAds.toLocaleString("fa-IR")} آگهی تأیید شده`
                  : "لیست آگهی‌های تأیید شده"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20">
              <CheckCircle className="w-3.5 h-3.5" />
              تأیید شده
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-1.5 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              بروزرسانی
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی عنوان، شهر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pr-9 rounded-xl h-11 bg-background border-border/60 focus:border-primary/40 focus:ring-primary/30"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setPage(1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleSearch}
            variant="outline"
            className="rounded-xl h-11 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all gap-1.5"
          >
            <Search className="w-4 h-4" />
            جستجو
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            variant="outline"
            className="rounded-xl h-11 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all gap-1.5"
          >
            <Filter className="w-4 h-4" />
            فیلتر
          </Button>
        </div>
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 border border-border/50"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  فیلتر بر اساس تاریخ
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                    از تاریخ
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    dateFormat="yyyy/MM/dd"
                    placeholderText="انتخاب تاریخ"
                    className="w-full border border-border/60 rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                  />
                  {startDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      شمسی: {formatJalali(startDate)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                    تا تاریخ
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    dateFormat="yyyy/MM/dd"
                    placeholderText="انتخاب تاریخ"
                    className="w-full border border-border/60 rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                  />
                  {endDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      شمسی: {formatJalali(endDate)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border/30">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="rounded-xl"
                >
                  پاک کردن
                </Button>
                <Button
                  onClick={applyFilters}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                >
                  اعمال فیلترها
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ads Grid (با AdCard) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-dashed border-border/60 rounded-2xl bg-muted/5">
          <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-base">
              هیچ آگهی تأیید شده‌ای یافت نشد
            </p>
            <p className="text-xs max-w-xs">
              {searchTerm || startDate || endDate
                ? "با تغییر فیلترها ممکن است نتیجه‌ای پیدا شود"
                : "آگهی‌های تأیید شده در اینجا نمایش داده می‌شوند"}
            </p>
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
                className="flex flex-col"
              >
                {/* کارت آگهی استاندارد */}
                <AdCard
                  _id={ad._id}
                  title={ad.title}
                  price={ad.price || 0}
                  city={ad.city}
                  district={ad.district}
                  images={ad.images}
                  createdAt={ad.createdAt}
                  isUrgent={ad.isUrgent}
                  isVerified={ad.isVerified}
                  adType={ad.adType}
                  userRole={ad.userId?.role}
                />

                {/* نوار عملیات (مشاهده / حذف) */}
                <div className="flex items-center gap-2 mt-2 px-1">
                  <Link
                    href={`/ad/${ad._id}`}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1 rounded-lg text-xs border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      مشاهده
                    </Button>
                  </Link>
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 rounded-lg text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(ad._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
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
                      className={`w-9 h-9 p-0 rounded-xl text-sm font-bold transition-all ${
                        page === pageNum
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                          : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
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
                className="gap-1 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-40"
              >
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      {canDelete && (
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <AlertDialogContent className="rounded-2xl dir-rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                حذف آگهی
              </AlertDialogTitle>
              <AlertDialogDescription>
                آیا از حذف این آگهی اطمینان دارید؟ این عملیات غیرقابل بازگشت
                است.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl">
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "بله، حذف شود"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}