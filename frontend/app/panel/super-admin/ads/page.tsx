"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreVertical,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  Archive,
  Filter,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/api/admin.api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// هوک Debounce برای جستجو
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// وضعیت‌ها
const statusLabels: Record<
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
    label: "در انتظار",
    badgeClass:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: Clock,
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
    icon: ShoppingBag,
  },
  expired: {
    label: "منقضی شده",
    badgeClass:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    icon: Archive,
  },
};

const getImageUrl = (img: string | null | undefined): string | null => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  return `${base}${img.startsWith("/") ? "" : "/"}${img}`;
};

export default function SuperAdminAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);

  // فیلترها
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [adTypeFilter, setAdTypeFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [startDate, setStartDate] = useState<DateObject | null>(null);
  const [endDate, setEndDate] = useState<DateObject | null>(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const debouncedSearch = useDebounce(search, 500);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy,
        sortOrder,
      };
      if (sourceFilter !== "all") params.source = sourceFilter;
      if (adTypeFilter !== "all") params.adType = adTypeFilter;
      if (priceMin) params.minPrice = priceMin;
      if (priceMax) params.maxPrice = priceMax;
      if (startDate) params.startDate = startDate.toDate().toISOString();
      if (endDate) params.endDate = endDate.toDate().toISOString();

      const result = await adminApi.getAllAds(params);

      // بررسی مطمئن ساختار دیتای دریافتی جهت جلوگیری از سفید شدن صفحه
    const adsData = Array.isArray(result?.data) ? result.data : [];

      setAds(adsData);

      if (result?.pagination) {
        setPagination((prev) => ({ ...prev, ...result.pagination }));
      } else {
        setPagination((prev) => ({
          ...prev,
          total: adsData.length,
          pages: Math.ceil(adsData.length / prev.limit) || 1,
        }));
      }
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast.error("خطا در دریافت لیست آگهی‌ها");
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    statusFilter,
    sourceFilter,
    adTypeFilter,
    priceMin,
    priceMax,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [
    debouncedSearch,
    statusFilter,
    sourceFilter,
    adTypeFilter,
    priceMin,
    priceMax,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  const handleDeleteAd = async (id: string) => {
    try {
      await adminApi.forceDeleteAd(id);
      toast.success("آگهی با موفقیت حذف شد");
      fetchAds();
    } catch {
      toast.error("خطا در حذف آگهی");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`آیا از حذف گروهی ${selectedIds.size} آگهی مطمئن هستید؟`))
      return;

    try {
      for (const id of selectedIds) {
        await adminApi.forceDeleteAd(id);
      }
      toast.success(`${selectedIds.size} آگهی با موفقیت حذف شدند`);
      fetchAds();
    } catch {
      toast.error("خطا در حذف برخی آگهی‌ها");
    }
  };

  const toggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedIds(updated);
  };

  const toggleSelectAll = () => {
    if (!Array.isArray(ads) || ads.length === 0) return;
    if (selectedIds.size === ads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ads.map((a) => a._id)));
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("all");
    setAdTypeFilter("all");
    setPriceMin("");
    setPriceMax("");
    setStartDate(null);
    setEndDate(null);
    setSortBy("createdAt");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const safeAds = Array.isArray(ads) ? ads : [];
  const stats = {
    total: pagination.total || safeAds.length,
    active: safeAds.filter((a) => a?.status === "active").length,
    pending: safeAds.filter((a) => a?.status === "pending").length,
    rejected: safeAds.filter((a) => a?.status === "rejected").length,
  };

  if (loading && safeAds.length === 0) {
    return (
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div
      className="space-y-6 p-4 md:p-6 text-foreground bg-background min-h-screen"
      dir="rtl"
    >
      {/* هدر اول صفحه */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-orange-500/20 shadow-lg p-5 md:p-6 bg-gradient-to-l from-orange-500/10 via-background to-background">
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              مدیریت آگهی‌ها
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              کنترل، تایید و فیلتر تمام آگهی‌های ثبت‌شده در سامانه
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "table"
                    ? "bg-card shadow-sm text-orange-600 dark:text-orange-400 font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="نمایش جدولی"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "grid"
                    ? "bg-card shadow-sm text-orange-600 dark:text-orange-400 font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="نمایش کارتی"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAds}
              className="gap-1.5 text-xs border-border hover:bg-orange-500/10"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", loading && "animate-spin")}
              />
              به‌روزرسانی
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" /> حذف ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* کارت‌های آماری اختصاصی */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                کل آگهی‌ها
              </p>
              <h3 className="text-xl font-black mt-1 text-foreground">
                {stats.total.toLocaleString("fa-IR")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">فعال</p>
              <h3 className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
                {stats.active.toLocaleString("fa-IR")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                در انتظار بررسی
              </p>
              <h3 className="text-xl font-black mt-1 text-orange-600 dark:text-orange-400">
                {stats.pending.toLocaleString("fa-IR")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                رد شده
              </p>
              <h3 className="text-xl font-black mt-1 text-rose-600 dark:text-rose-400">
                {stats.rejected.toLocaleString("fa-IR")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* پنل فیلتر پیشرفته */}
      <Card className="border-border shadow-sm bg-card">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
            <SlidersHorizontal className="w-4 h-4 text-orange-500" />
            <h2 className="font-bold text-sm text-foreground">
              جستجو و فیلترهای هوشمند
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* جستجوی متنی */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                عنوان آگهی
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در عنوان..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9 text-xs bg-background border-border"
                />
              </div>
            </div>

            {/* وضعیت */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                وضعیت
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs bg-background border-border">
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="rejected">رد شده</SelectItem>
                  <SelectItem value="sold">فروخته شده</SelectItem>
                  <SelectItem value="expired">منقضی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* منبع */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                منبع
              </label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="text-xs bg-background border-border">
                  <SelectValue placeholder="همه منابع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه منابع</SelectItem>
                  <SelectItem value="manual">دستی / سایت</SelectItem>
                  <SelectItem value="divar">دیوار</SelectItem>
                  <SelectItem value="sheypoor">شیپور</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* نوع آگهی */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                نوع معامله
              </label>
              <Select value={adTypeFilter} onValueChange={setAdTypeFilter}>
                <SelectTrigger className="text-xs bg-background border-border">
                  <SelectValue placeholder="همه انواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه انواع</SelectItem>
                  <SelectItem value="sale">فروش</SelectItem>
                  <SelectItem value="rent">اجاره</SelectItem>
                  <SelectItem value="daily_rent">اجاره روزانه</SelectItem>
                  <SelectItem value="mortgage">رهن</SelectItem>
                  <SelectItem value="exchange">معاوضه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* حداقل قیمت */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                حداقل قیمت (تومان)
              </label>
              <Input
                type="number"
                placeholder="مثال: ۱۰۰,۰۰۰,۰۰۰"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="text-xs bg-background border-border"
              />
            </div>

            {/* حداکثر قیمت */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                حداکثر قیمت (تومان)
              </label>
              <Input
                type="number"
                placeholder="مثال: ۵۰۰,۰۰۰,۰۰۰"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="text-xs bg-background border-border"
              />
            </div>

            {/* از تاریخ */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                از تاریخ
              </label>
              <DatePicker
                value={startDate}
                onChange={(date: DateObject | null) => setStartDate(date)}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                placeholder="انتخاب تاریخ"
                inputClass="w-full border border-border rounded-md px-3 py-2 text-xs bg-background text-foreground h-9"
              />
            </div>

            {/* تا تاریخ */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                تا تاریخ
              </label>
              <DatePicker
                value={endDate}
                onChange={(date: DateObject | null) => setEndDate(date)}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                placeholder="انتخاب تاریخ"
                inputClass="w-full border border-border rounded-md px-3 py-2 text-xs bg-background text-foreground h-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              تعداد دیتای یافت شده:{" "}
              <strong className="text-foreground">
                {pagination.total.toLocaleString("fa-IR")}
              </strong>{" "}
              مورد
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="gap-1 text-xs border-border"
              >
                <RotateCcw className="w-3.5 h-3.5" /> پاک‌سازی
              </Button>
              <Button
                size="sm"
                onClick={fetchAds}
                className="gap-1 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                <Filter className="w-3.5 h-3.5" /> اعمال فیلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* لیست آگهی‌ها (جدولی / کارتی) */}
      {viewMode === "table" ? (
        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        safeAds.length > 0 &&
                        selectedIds.size === safeAds.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-border accent-orange-600"
                    />
                  </TableHead>
                  <TableHead className="w-16">تصویر</TableHead>
                  <TableHead>عنوان آگهی</TableHead>
                  <TableHead>قیمت</TableHead>
                  <TableHead>شهر</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="hidden md:table-cell">بازدید</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    تاریخ ثبت
                  </TableHead>
                  <TableHead className="w-[80px] text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {safeAds.length > 0 ? (
                    safeAds.map((ad) => {
                      const status = statusLabels[ad.status] || {
                        label: ad.status || "نامشخص",
                        badgeClass:
                          "bg-gray-500/10 text-gray-600 border-gray-500/20",
                        icon: Archive,
                      };
                      const StatusIcon = status.icon;
                      const imgUrl = getImageUrl(ad.images?.[0]);

                      return (
                        <motion.tr
                          key={ad._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-border/50 hover:bg-muted/40 transition-colors text-xs"
                        >
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(ad._id)}
                              onChange={() => toggleSelect(ad._id)}
                              className="rounded border-border accent-orange-600"
                            />
                          </TableCell>
                          <TableCell>
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt=""
                                className="w-10 h-10 object-cover rounded-xl border border-border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-bold max-w-[220px] truncate text-foreground">
                            <Link
                              href={`/panel/super-admin/ads/${ad._id}`}
                              className="hover:text-orange-600 transition-colors"
                            >
                              {ad.title || "بدون عنوان"}
                            </Link>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {ad.price
                              ? `${ad.price.toLocaleString("fa-IR")} تومان`
                              : "توافقی"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {ad.city || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1 font-semibold border",
                                status.badgeClass,
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {(ad.views || 0).toLocaleString("fa-IR")}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="text-xs"
                              >
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/panel/super-admin/ads/${ad._id}`}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Eye className="ml-2 h-3.5 h-3.5 text-orange-500" />{" "}
                                    بررسی و جزییات
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAd(ad._id)}
                                  className="text-rose-600 focus:text-rose-600 cursor-pointer"
                                >
                                  <Trash2 className="ml-2 h-3.5 h-3.5" /> حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        هیچ آگهی پیدا نشد.
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {/* صفحه بندی */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                صفحه {pagination.page} از {pagination.pages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="gap-1 text-xs"
                >
                  <ChevronRight className="w-4 h-4" /> قبلی
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="gap-1 text-xs"
                >
                  بعدی <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        /* نمای کارتی گرید */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeAds.map((ad) => {
            const status = statusLabels[ad.status] || {
              label: ad.status || "نامشخص",
              badgeClass: "bg-gray-500/10 text-gray-600 border-gray-500/20",
              icon: Archive,
            };
            const StatusIcon = status.icon;
            const imgUrl = getImageUrl(ad.images?.[0]);

            return (
              <Card
                key={ad._id}
                className="border-border shadow-sm bg-card overflow-hidden flex flex-col justify-between hover:border-orange-500/40 transition-all"
              >
                <div>
                  <div className="h-44 bg-muted relative overflow-hidden">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "absolute top-3 right-3 backdrop-blur-md border",
                        status.badgeClass,
                      )}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {ad.title || "بدون عنوان"}
                    </h3>
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                      {ad.price
                        ? `${ad.price.toLocaleString("fa-IR")} تومان`
                        : "توافقی"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ad.city || "—"}
                    </p>
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-border/50 flex items-center justify-between gap-2 mt-2">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                  <div className="flex gap-1">
                    <Link href={`/panel/super-admin/ads/${ad._id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-orange-500" /> مدیریت
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAd(ad._id)}
                      className="text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
