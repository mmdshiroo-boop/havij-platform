// app/panel/user/my-ads/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adsApi, Ad } from "@/services/api/ads.api";
import {
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "/placeholder.jpg";
  if (imagePath.startsWith("http")) return imagePath;
  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5001";
  return `${base}${imagePath}`;
};

const formatPrice = (price: number) => {
  if (!price || price === 0) return "توافقی";
  return price.toLocaleString() + " تومان";
};

const formatDate = (date: string) => new Date(date).toLocaleDateString("fa-IR");

export default function MyAdsPage() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // آمار سریع
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    pending: 0,
    sold: 0,
  });

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: ITEMS_PER_PAGE };
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await adsApi.getUserAds(params);
      setAds(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast.error("خطا در دریافت آگهی‌ها");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  // دریافت آمار کلی (فقط یک بار)
  const fetchCounts = useCallback(async () => {
    try {
      const [all, active, pending, sold] = await Promise.all([
        adsApi
          .getUserAds({ limit: 1 })
          .then((r) => r.pagination?.total ?? 0)
          .catch(() => 0),
        adsApi
          .getUserAds({ status: "active", limit: 1 })
          .then((r) => r.pagination?.total ?? 0)
          .catch(() => 0),
        adsApi
          .getUserAds({ status: "pending", limit: 1 })
          .then((r) => r.pagination?.total ?? 0)
          .catch(() => 0),
        adsApi
          .getUserAds({ status: "sold", limit: 1 })
          .then((r) => r.pagination?.total ?? 0)
          .catch(() => 0),
      ]);
      setCounts({ total: all, active, pending, sold });
    } catch {}
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await adsApi.delete(deleteId);
      toast.success("آگهی با موفقیت حذف شد");
      fetchAds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در حذف آگهی");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs font-bold">
            <CheckCircle2 className="w-3 h-3 ml-1" />
            فعال
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg text-xs font-bold">
            <Clock className="w-3 h-3 ml-1" />
            در انتظار
          </Badge>
        );
      case "sold":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg text-xs font-bold">
            <Archive className="w-3 h-3 ml-1" />
            فروخته شده
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-lg text-xs font-bold">
            <XCircle className="w-3 h-3 ml-1" />
            رد شده
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="rounded-lg text-xs">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div
      className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4 select-none"
      dir="rtl"
    >
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-l from-primary/10 to-transparent p-4 rounded-2xl border border-primary/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            آگهی‌های من
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-medium">
            مدیریت، ویرایش و پیگیری وضعیت آگهی‌های شما
          </p>
        </div>
        <Link href="/create-ad" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 rounded-xl font-bold shadow-md shadow-primary/10">
            <PlusCircle className="w-4 h-4" />
            ثبت آگهی جدید
          </Button>
        </Link>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="کل آگهی‌ها"
          value={counts.total.toLocaleString()}
          icon={FileText}
          href="/panel/user/my-ads"
        />
        <StatCard
          title="فعال"
          value={counts.active.toLocaleString()}
          icon={CheckCircle2}
          href="/panel/user/my-ads?status=active"
        />
        <StatCard
          title="در انتظار"
          value={counts.pending.toLocaleString()}
          icon={Clock}
          href="/panel/user/my-ads?status=pending"
        />
        <StatCard
          title="فروخته شده"
          value={counts.sold.toLocaleString()}
          icon={Archive}
          href="/panel/user/my-ads?status=sold"
        />
      </div>

      {/* تب‌ها */}
      <div className="w-full overflow-x-auto pb-2">
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="w-full"
        >
          <TabsList className="flex w-full max-w-2xl bg-muted/40 p-1 rounded-2xl h-12 border border-border/40 gap-1">
            {[
              { value: "all", label: "همه" },
              { value: "active", label: "فعال" },
              { value: "pending", label: "در انتظار" },
              { value: "sold", label: "فروخته شده" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex-1 rounded-xl font-bold text-xs transition-all relative h-10",
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* محتوا */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/40 shadow-xs">
              <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                <Skeleton className="w-full sm:w-28 h-32 sm:h-24 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-2/3 rounded-md" />
                  <div className="flex gap-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted flex items-center justify-center rounded-full text-muted-foreground/70">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1.5">
              هیچ آگهی یافت نشد
            </h3>
            <p className="text-muted-foreground text-xs font-medium mb-5">
              {statusFilter !== "all"
                ? "آگهی با این وضعیت وجود ندارد."
                : "شما هنوز آگهی ثبت نکرده‌اید."}
            </p>
            {statusFilter === "all" && (
              <Link href="/create-ad">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl font-bold text-xs px-5 border-primary/20 hover:bg-primary/5 text-primary"
                >
                  <PlusCircle className="w-4 h-4" /> ثبت اولین آگهی
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <Card
              key={ad._id}
              className="overflow-hidden border-border/60 bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300 group rounded-2xl"
            >
              <CardContent className="p-0">
                <div className="p-4 flex flex-col sm:flex-row gap-4 items-stretch">
                  <div className="relative w-full sm:w-32 h-44 sm:h-28 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border/30">
                    <img
                      src={getImageUrl(ad.images?.[0])}
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.jpg";
                      }}
                    />
                    <div className="absolute top-2 right-2 sm:hidden">
                      {statusBadge(ad.status!)}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-sm sm:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {ad.title}
                        </h3>
                        <div className="hidden sm:flex items-center gap-1">
                          {statusBadge(ad.status!)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-muted-foreground/90">
                        <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                          {ad.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                          {formatDate(ad.createdAt!)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground/70" />
                          {ad.views || 0} بازدید
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 sm:mt-0 border-t border-border/40 sm:border-0">
                      <div>
                        <p className="text-[11px] font-bold text-muted-foreground/70">
                          قیمت:
                        </p>
                        <p className="text-base sm:text-lg font-black text-primary tracking-tight">
                          {formatPrice(ad.price)}
                        </p>
                      </div>

                      <div className="hidden sm:flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-xl font-bold text-xs gap-1.5"
                          onClick={() => router.push(`/ad/${ad._id}`)}
                        >
                          <Eye className="w-3.5 h-3.5" /> مشاهده
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-xl font-bold text-xs gap-1.5 text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white"
                          onClick={() =>
                            router.push(`/panel/user/my-ads/edit/${ad._id}`)
                          }
                        >
                          <Edit className="w-3.5 h-3.5" /> ویرایش
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-xl font-bold text-xs gap-1.5 text-rose-500 border-rose-500/20 hover:bg-rose-600 hover:text-white"
                          onClick={() => setDeleteId(ad._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* نوار عملیات موبایل */}
                <div className="flex sm:hidden items-center border-t border-border/50 divide-x divide-border/50 bg-muted/20">
                  <button
                    className="flex-1 py-3 text-[11px] font-black flex items-center justify-center gap-1 text-foreground active:bg-muted/60"
                    onClick={() => router.push(`/ad/${ad._id}`)}
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" /> مشاهده
                  </button>
                  <button
                    className="flex-1 py-3 text-[11px] font-black flex items-center justify-center gap-1 text-amber-600"
                    onClick={() =>
                      router.push(`/panel/user/my-ads/edit/${ad._id}`)
                    }
                  >
                    <Edit className="w-3.5 h-3.5" /> ویرایش
                  </button>
                  <button
                    className="flex-1 py-3 text-[11px] font-black flex items-center justify-center gap-1 text-rose-500"
                    onClick={() => setDeleteId(ad._id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> حذف
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl h-9 gap-1"
          >
            <ChevronRight className="w-4 h-4" /> قبلی
          </Button>
          <span className="text-sm font-bold px-4">
            {page} از {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl h-9 gap-1"
          >
            بعدی <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* دیالوگ حذف */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent
          className="rounded-2xl max-w-[90vw] sm:max-w-md"
          dir="rtl"
        >
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-lg font-black text-destructive">
              حذف آگهی
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              آیا از حذف کامل این آگهی اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl text-sm font-bold">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-rose-500 hover:bg-rose-600 rounded-xl text-sm font-bold text-white gap-1"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
