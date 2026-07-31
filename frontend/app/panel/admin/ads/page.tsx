"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  MoreVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Clock,
} from "lucide-react";
import apiClient from "@/services/api/client";

// تایپ‌های اختصاصی
export interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
}

export interface Ad {
  _id: string;
  title: string;
  price: number;
  city: string;
  status: "pending" | "active" | "rejected" | "sold" | "expired";
  images?: string[];
  createdAt: string;
  userId?: User;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  rejected: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "در انتظار", color: "bg-amber-500" },
  active: { label: "فعال", color: "bg-emerald-500" },
  rejected: { label: "رد شده", color: "bg-red-500" },
  sold: { label: "فروخته شده", color: "bg-blue-500" },
  expired: { label: "منقضی", color: "bg-gray-500" },
};

const formatPrice = (price: number) => {
  if (!price) return "توافقی";
  return price.toLocaleString("fa-IR") + " تومان";
};

const formatDate = (date: string) => new Date(date).toLocaleDateString("fa-IR");

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  return `${baseUrl}${imagePath}`;
};

export default function AdminAdsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname(); // مسیر فعلی (/panel/admin/ads)

  const statusParam = searchParams.get("status") || "all";

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(statusParam);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // آمار
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
    rejected: 0,
  });

  // مودال‌ها
  const [rejectAdId, setRejectAdId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteAdId, setDeleteAdId] = useState<string | null>(null);

  const limit = 12;

  // همگام‌سازی وضعیت Tab با تغییرات URL Query Params
  useEffect(() => {
    setActiveTab(statusParam);
  }, [statusParam]);

  // کنترل تاخیر در جستجو (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // دریافت آگهی‌ها
  const fetchAds = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params: Record<string, any> = {
          page,
          limit,
          search: debouncedSearch || undefined,
        };
        if (activeTab !== "all") params.status = activeTab;

        const res = await apiClient.get("/ads/admin/all", { params });
        setAds(res.data?.data || []);
        setTotalPages(res.data?.pagination?.pages || 1);
      } catch (err) {
        toast.error("خطا در دریافت آگهی‌ها");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, activeTab, debouncedSearch],
  );

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // دریافت آمار کلی
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allRes, pendingRes, activeRes, rejectedRes] = await Promise.all([
          apiClient.get("/ads/admin/all", { params: { limit: 1 } }),
          apiClient.get("/ads/admin/pending", { params: { limit: 1 } }),
          apiClient.get("/ads/admin/approved", { params: { limit: 1 } }),
          apiClient.get("/ads/admin/rejected", { params: { limit: 1 } }),
        ]);

        setStats({
          total: allRes.data?.pagination?.total || 0,
          pending: pendingRes.data?.pagination?.total || 0,
          active: activeRes.data?.pagination?.total || 0,
          rejected: rejectedRes.data?.pagination?.total || 0,
        });
      } catch {
        // مدیریت خاموش خطا برای آمار
      }
    };
    fetchStats();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
    router.push(value === "all" ? pathname : `${pathname}?status=${value}`);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.post(`/ads/admin/${id}/approve`);
      toast.success("آگهی تأیید شد");
      fetchAds();
    } catch {
      toast.error("خطا در تأیید آگهی");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectAdId) return;
    setActionLoading(rejectAdId);
    try {
      await apiClient.post(`/ads/admin/${rejectAdId}/reject`, {
        reason: rejectReason || "نامناسب",
      });
      toast.success("آگهی رد شد");
      setRejectAdId(null);
      setRejectReason("");
      fetchAds();
    } catch {
      toast.error("خطا در رد آگهی");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteAdId) return;
    setActionLoading(deleteAdId);
    try {
      await apiClient.delete(`/ads/${deleteAdId}`);
      toast.success("آگهی حذف شد");
      setDeleteAdId(null);
      fetchAds();
    } catch {
      toast.error("خطا در حذف آگهی");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر اصلی */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">مدیریت آگهی‌ها</h1>
          <p className="text-sm text-muted-foreground mt-1">
            بررسی، تأیید و مدیریت تمام آگهی‌ها
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAds(true)}
          disabled={refreshing || loading}
          className="gap-2 rounded-xl"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          بروزرسانی
        </Button>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="کل آگهی‌ها"
          value={stats.total.toLocaleString("fa-IR")}
          icon={FileText}
          href="/panel/admin/ads"
        />
        <StatCard
          title="در انتظار"
          value={stats.pending.toLocaleString("fa-IR")}
          icon={Clock}
          href="/panel/admin/ads?status=pending"
        />
        <StatCard
          title="فعال"
          value={stats.active.toLocaleString("fa-IR")}
          icon={CheckCircle}
          href="/panel/admin/ads?status=active"
        />
        <StatCard
          title="رد شده"
          value={stats.rejected.toLocaleString("fa-IR")}
          icon={XCircle}
          href="/panel/admin/ads?status=rejected"
        />
      </div>

      {/* تب‌ها + جستجو */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full max-w-md"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">همه</TabsTrigger>
            <TabsTrigger value="pending">در انتظار</TabsTrigger>
            <TabsTrigger value="active">فعال</TabsTrigger>
            <TabsTrigger value="rejected">رد شده</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl bg-muted/30"
          />
        </div>
      </div>

      {/* جدول آگهی‌ها */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            آگهی‌ای یافت نشد
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>آگهی</TableHead>
                  <TableHead className="hidden md:table-cell">شهر</TableHead>
                  <TableHead>قیمت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="hidden lg:table-cell">تاریخ</TableHead>
                  <TableHead className="w-[120px]">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => {
                  const imageUrl = getImageUrl(ad.images?.[0]);

                  return (
                    <motion.tr
                      key={ad._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={ad.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileText className="w-5 h-5 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/panel/admin/ads/${ad._id}`}
                              className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                            >
                              {ad.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {ad.userId?.firstName || ""}{" "}
                              {ad.userId?.lastName || "کاربر ناشناس"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {ad.city || "-"}
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {formatPrice(ad.price)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            statusConfig[ad.status]?.color || "bg-gray-500"
                          } text-white text-xs`}
                        >
                          {statusConfig[ad.status]?.label || ad.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {formatDate(ad.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {ad.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700"
                                onClick={() => handleApprove(ad._id)}
                                disabled={actionLoading === ad._id}
                              >
                                {actionLoading === ad._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => setRejectAdId(ad._id)}
                                disabled={actionLoading === ad._id}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/panel/admin/ads/${ad._id}`}
                                  className="cursor-pointer"
                                >
                                  <Eye className="ml-2 w-4 h-4" />
                                  مشاهده
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500 cursor-pointer"
                                onClick={() => setDeleteAdId(ad._id)}
                              >
                                <Trash2 className="ml-2 w-4 h-4" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm px-3 py-1">
                {page} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* مودال رد آگهی */}
      <Dialog open={!!rejectAdId} onOpenChange={() => setRejectAdId(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>رد آگهی</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="دلیل رد آگهی..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
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
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "رد آگهی"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال حذف آگهی */}
      <Dialog open={!!deleteAdId} onOpenChange={() => setDeleteAdId(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تأیید حذف آگهی</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            آیا از حذف این آگهی مطمئن هستید؟ این عملیات قابل بازگشت نیست.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteAdId(null)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === deleteAdId}
            >
              {actionLoading === deleteAdId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "حذف آگهی"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
