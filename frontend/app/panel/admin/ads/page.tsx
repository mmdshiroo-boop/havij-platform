"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Eye, CheckCircle, XCircle, FileText, Search,
  MoreVertical, Trash2, ChevronLeft, ChevronRight,
  RefreshCw, Loader2, Clock, AlertTriangle,
} from "lucide-react";
import apiClient from "@/services/api/client";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";

/* ─── تایپ‌ها ─── */
export interface Ad {
  _id: string;
  title: string;
  price: number;
  city: string;
  status: "pending" | "active" | "rejected" | "sold" | "expired";
  images?: string[];
  createdAt: string;
  userId?: { _id: string; firstName?: string; lastName?: string };
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  rejected: number;
}

/* ─── ثابت‌ها ─── */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "در انتظار", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  active: { label: "فعال", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  rejected: { label: "رد شده", className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
  sold: { label: "فروخته شده", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  expired: { label: "منقضی", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
};

const formatPrice = (price: number) => {
  if (!price) return "توافقی";
  return price.toLocaleString("fa-IR") + " تومان";
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fa-IR");

/* ─── StatCard داخلی ─── */
function StatCard({
  title,
  value,
  icon: Icon,
  href,
  color = "text-primary",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  color?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-xl sm:text-2xl font-black text-foreground mt-1 tabular-nums">{value}</p>
        </div>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

/* ─── کامپوننت اصلی ─── */
function AdminAdsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
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
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0, rejected: 0 });
  const [rejectAdId, setRejectAdId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteAdId, setDeleteAdId] = useState<string | null>(null);

  const limit = 12;

  useEffect(() => { setActiveTab(statusParam); }, [statusParam]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAds = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params: Record<string, any> = { page, limit, search: debouncedSearch || undefined };
      if (activeTab !== "all") params.status = activeTab;
      const res = await apiClient.get("/ads/admin/all", { params });
      setAds(res.data?.data || []);
      setTotalPages(res.data?.pagination?.pages || 1);
    } catch {
      toast.error("خطا در دریافت آگهی‌ها");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, activeTab, debouncedSearch]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

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
      } catch { }
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
    } catch { toast.error("خطا در تأیید آگهی"); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectAdId) return;
    setActionLoading(rejectAdId);
    try {
      await apiClient.post(`/ads/admin/${rejectAdId}/reject`, { reason: rejectReason || "نامناسب" });
      toast.success("آگهی رد شد");
      setRejectAdId(null);
      setRejectReason("");
      fetchAds();
    } catch { toast.error("خطا در رد آگهی"); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    if (!deleteAdId) return;
    setActionLoading(deleteAdId);
    try {
      await apiClient.delete(`/ads/${deleteAdId}`);
      toast.success("آگهی حذف شد");
      setDeleteAdId(null);
      fetchAds();
    } catch { toast.error("خطا در حذف آگهی"); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">مدیریت آگهی‌ها</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">بررسی، تأیید و مدیریت تمام آگهی‌ها</p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => fetchAds(true)}
          disabled={refreshing || loading}
          className="gap-2 rounded-xl self-end sm:self-auto text-xs font-bold"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          بروزرسانی
        </Button>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="کل آگهی‌ها" value={stats.total.toLocaleString("fa-IR")} icon={FileText} href="/panel/admin/ads" />
        <StatCard title="در انتظار" value={stats.pending.toLocaleString("fa-IR")} icon={Clock} href="/panel/admin/ads?status=pending" color="text-amber-500" />
        <StatCard title="فعال" value={stats.active.toLocaleString("fa-IR")} icon={CheckCircle} href="/panel/admin/ads?status=active" color="text-emerald-500" />
        <StatCard title="رد شده" value={stats.rejected.toLocaleString("fa-IR")} icon={XCircle} href="/panel/admin/ads?status=rejected" color="text-red-500" />
      </div>

      {/* تب‌ها + جستجو */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all" className="text-xs">همه</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">در انتظار</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">فعال</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">رد شده</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl bg-muted/30 text-sm h-10"
          />
        </div>
      </div>

      {/* جدول */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60 rounded-2xl">
          <CardContent className="py-14 text-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="p-4 rounded-2xl bg-muted/50">
                <FileText className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">آگهی‌ای یافت نشد</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-right font-bold py-3.5">آگهی</TableHead>
                      <TableHead className="text-right hidden md:table-cell font-bold">شهر</TableHead>
                      <TableHead className="text-right font-bold">قیمت</TableHead>
                      <TableHead className="text-right font-bold">وضعیت</TableHead>
                      <TableHead className="text-right hidden lg:table-cell font-bold">تاریخ</TableHead>
                      <TableHead className="w-[110px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad, i) => {
                      const imgSrc = ad.images?.[0] ? getImageUrl(ad.images[0]) : null;
                      const statusInfo = STATUS_CONFIG[ad.status] || STATUS_CONFIG.pending;

                      return (
                        <motion.tr
                          key={ad._id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              {/* ★ تصویر واقعی */}
                              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center border border-border/40">
                                {imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={ad.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <FileText className="w-5 h-5 text-muted-foreground/30" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link href={`/panel/admin/ads/${ad._id}`}
                                  className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
                                  {ad.title}
                                </Link>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {ad.userId?.firstName || ""} {ad.userId?.lastName || "کاربر ناشناس"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {ad.city || "—"}
                          </TableCell>

                          <TableCell className="font-bold text-sm">
                            {formatPrice(ad.price)}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs px-2.5 py-0.5 rounded-lg border", statusInfo.className)}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {formatDate(ad.createdAt)}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1 justify-end">
                              {ad.status === "pending" && (
                                <>
                                  <Button
                                    size="icon" variant="ghost"
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg"
                                    onClick={() => handleApprove(ad._id)}
                                    disabled={actionLoading === ad._id}
                                    title="تأیید"
                                  >
                                    {actionLoading === ad._id
                                      ? <Loader2 className="w-4 h-4 animate-spin" />
                                      : <CheckCircle className="w-4 h-4" />
                                    }
                                  </Button>
                                  <Button
                                    size="icon" variant="ghost"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                                    onClick={() => setRejectAdId(ad._id)}
                                    disabled={actionLoading === ad._id}
                                    title="رد"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-40">
                                    <DropdownMenuItem asChild>
                                    <Link href={`/panel/admin/ads/${ad._id}`} className="cursor-pointer">
                                      <Eye className="ml-2 w-4 h-4 text-muted-foreground" />
                                      مشاهده جزئیات
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                    onClick={() => setDeleteAdId(ad._id)}
                                  >
                                    <Trash2 className="ml-2 w-4 h-4" />
                                    حذف آگهی
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground hidden sm:inline">
                    صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
                  </span>
                  <div className="flex items-center gap-1 mx-auto sm:mx-0">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                      disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="px-3 py-1 font-medium bg-muted rounded-lg sm:hidden">
                      {page} / {totalPages}
                    </span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                      disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* مودال رد آگهی */}
      <Dialog open={!!rejectAdId} onOpenChange={() => setRejectAdId(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <XCircle className="w-5 h-5 text-red-500" />
              رد آگهی
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 my-2">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>دلیل رد آگهی به کاربر نمایش داده می‌شود.</span>
            </div>
            <Textarea
              placeholder="دلیل رد آگهی..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="rounded-xl resize-none text-sm"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectAdId(null)} className="rounded-xl text-xs">
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleReject}
              disabled={actionLoading === rejectAdId} className="rounded-xl text-xs gap-1.5">
              {actionLoading === rejectAdId
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <XCircle className="w-3.5 h-3.5" />
              }
              رد آگهی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال حذف */}
      <Dialog open={!!deleteAdId} onOpenChange={() => setDeleteAdId(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-destructive">
              <Trash2 className="w-5 h-5" />
              حذف آگهی
            </DialogTitle>
          </DialogHeader>
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 my-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>آیا از حذف این آگهی اطمینان دارید؟ این عملیات غیرقابل بازگشت است.</span>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteAdId(null)} className="rounded-xl text-xs">
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleDelete}
              disabled={actionLoading === deleteAdId} className="rounded-xl text-xs gap-1.5">
              {actionLoading === deleteAdId
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />
              }
              حذف قطعی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminAdsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5" dir="rtl">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    }>
      <AdminAdsPageInner />
    </Suspense>
  );
}