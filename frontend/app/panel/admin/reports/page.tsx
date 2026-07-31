"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "sonner";
import {
  Users,
  FileText,
  TrendingUp,
  Activity,
  RefreshCw,
  FileDown,
  Sheet,
  Flag,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  SlidersHorizontal,
  User,
  Building,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import apiClient from "@/services/api/client";
import { adminPanelApi, AdminPanelStats } from "@/services/api/admin-panel.api";

// ==================== Types ====================
interface Report {
  _id: string;
  reporter?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  targetType: "ad" | "property" | "user";
  targetId: string;
  type: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "rejected";
  resolution?: string;
  reviewedAt?: string;
  createdAt: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  spam: "اسپم / تبلیغاتی",
  fraud: "کلاهبرداری و مشکوک",
  fake: "محتوا یا هویت جعلی",
  offensive: "محتوای نامناسب",
  illegal: "خلاف قوانین و غیرقانونی",
  duplicate: "آگهی تکراری",
  wrong_category: "دسته‌بندی اشتباه",
  other: "سایر موارد",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "در انتظار بررسی",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  },
  reviewed: {
    label: "در حال بررسی",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  },
  resolved: {
    label: "بررسی و حل‌شده",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  },
  rejected: {
    label: "رد شده (بدون تخلف)",
    className:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900",
  },
};

export default function AdminReportsPage() {
  const [stats, setStats] = useState<AdminPanelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // وضعیت خروجی‌گیری
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"filtered" | "all" | "recent">(
    "filtered",
  );

  // بخش گزارشات تخلف
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // جزئیات گزارش
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // دریافت آمار کلی
  const fetchStats = useCallback(async () => {
    try {
      const data = await adminPanelApi.getStats();
      setStats(data);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      if (error.response?.status === 403) {
        toast.error("شما دسترسی لازم برای مشاهده آمار گزارشات را ندارید.");
      }
    }
  }, []);

  // دریافت لیست گزارش‌ها
  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    setReportError(null);
    try {
      const params: Record<string, any> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const { data } = await apiClient.get("/reports", { params });
      if (data.success || Array.isArray(data.data)) {
        setReports(data.data || []);
      } else {
        throw new Error(data.message || "خطا در دریافت گزارشات");
      }
    } catch (err: any) {
      setReportError(
        err.response?.data?.message || err.message || "خطا در ارتباط با سرور",
      );
    } finally {
      setLoadingReports(false);
    }
  }, [statusFilter, debouncedSearch]);

  // Initial Load
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchReports()]);
      setLoading(false);
    };
    initData();
  }, [fetchReports, fetchStats]);

  // بروزرسانی دستی
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchReports()]);
    setRefreshing(false);
    toast.success("اطلاعات گزارشات به‌روزرسانی شد");
  };

  // دانلود PDF با پارامترهای پیشرفته
  const handleDownloadPDF = async () => {
    setDownloading("pdf");
    try {
      const options: Record<string, any> = {};
      if (exportScope === "filtered") {
        if (statusFilter !== "all") options.status = statusFilter;
        if (debouncedSearch) options.search = debouncedSearch;
      } else if (exportScope === "recent") {
        options.days = 30;
      }

      await adminPanelApi.downloadPdfReport(options);
      toast.success("فایل PDF گزارشات با موفقیت تولید و دانلود شد");
      setExportModalOpen(false);
    } catch (error) {
      toast.error("خطا در دانلود فایل PDF. لطفاً مجدداً تلاش نمایید.");
    } finally {
      setDownloading(null);
    }
  };

  // دانلود Excel با پارامترهای پیشرفته
  const handleDownloadExcel = async () => {
    setDownloading("excel");
    try {
      const options: Record<string, any> = {};
      if (exportScope === "filtered") {
        if (statusFilter !== "all") options.status = statusFilter;
        if (debouncedSearch) options.search = debouncedSearch;
      } else if (exportScope === "recent") {
        options.days = 30;
      }

      await adminPanelApi.downloadExcelReport(options);
      toast.success("فایل Excel گزارشات با موفقیت دانلود شد");
      setExportModalOpen(false);
    } catch (error) {
      toast.error("خطا در ساخت و دانلود فایل Excel");
    } finally {
      setDownloading(null);
    }
  };

  // عملیات تایید و حل گزارش
  const handleResolve = async (id: string) => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/reports/${id}/resolve`, {
        resolution: "توسط مدیریت بررسی و برطرف گردید",
      });
      toast.success("گزارش با موفقیت علامت‌گذاری و حل شد");
      fetchReports();
      if (selectedReport?._id === id) {
        setSelectedReport((prev) =>
          prev
            ? {
                ...prev,
                status: "resolved",
                resolution: "توسط مدیریت بررسی و برطرف گردید",
              }
            : null,
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ثبت وضعیت گزارش");
    } finally {
      setActionLoading(false);
    }
  };

  // عملیات رد گزارش
  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/reports/${id}/reject`, {
        reason: "تخلفی یافت نشد و گزارش رد شد",
      });
      toast.success("گزارش مورد نظر رد شد");
      fetchReports();
      if (selectedReport?._id === id) {
        setSelectedReport((prev) =>
          prev
            ? {
                ...prev,
                status: "rejected",
                resolution: "تخلفی یافت نشد و گزارش رد شد",
              }
            : null,
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در رد گزارش");
    } finally {
      setActionLoading(false);
    }
  };

  // فرمت تاریخ
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // لینک هدایت به هدف گزارش
  const getTargetUrl = (type: string, id: string) => {
    switch (type) {
      case "ad":
        return `/panel/admin/ads?id=${id}`;
      case "property":
        return `/panel/admin/properties?id=${id}`;
      case "user":
        return `/panel/admin/users?id=${id}`;
      default:
        return "#";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-1" dir="rtl">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* HEADER SECTION */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/15 via-primary/5 to-background p-6 lg:p-8 border border-primary/10 shadow-sm"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl ring-1 ring-primary/20 text-primary shrink-0">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                مرکز گزارشات و آمار سیستم
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                مدیریت گزارشات تخلف، بررسی گزارش‌ها و خروجی‌گیری کامل از
                داده‌های سامانه
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2 rounded-xl bg-background/80 backdrop-blur-sm h-10 px-4"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              به‌روزرسانی
            </Button>

            <Button
              onClick={() => setExportModalOpen(true)}
              className="gap-2 rounded-xl h-10 px-5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <FileSpreadsheet className="w-4 h-4" />
              خروجی و گزارش‌گیری (PDF / Excel)
            </Button>
          </div>
        </div>
      </motion.div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <StatCard
            title="کل کاربران"
            value={stats?.totalUsers?.toLocaleString("fa-IR") || "۰"}
            icon={Users}
            description={`${stats?.todayUsers?.toLocaleString("fa-IR") || "۰"} کاربر جدید امروز`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="کل آگهی‌ها"
            value={stats?.totalAds?.toLocaleString("fa-IR") || "۰"}
            icon={FileText}
            description={`${stats?.pendingAds?.toLocaleString("fa-IR") || "۰"} در انتظار تایید`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StatCard
            title="آگهی‌های امروز"
            value={stats?.todayAds?.toLocaleString("fa-IR") || "۰"}
            icon={TrendingUp}
            description="ثبت شده در ۲۴ ساعت گذشته"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="کل گزارشات تخلف"
            value={
              stats?.totalReports?.toLocaleString("fa-IR") ||
              reports.length.toLocaleString("fa-IR")
            }
            icon={Flag}
            description="تخلفات گزارش‌شده کاربران"
          />
        </motion.div>
      </div>

      {/* SUMMARY STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              خلاصه وضعیت آگهی‌ها و املاک
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {[
                { label: "مجموع کل آگهی‌ها", value: stats?.totalAds },
                {
                  label: "آگهی‌های در انتظار تأیید",
                  value: stats?.pendingAds,
                  badge: "نیازمند اقدام",
                },
                { label: "آگهی‌های جدید امروز", value: stats?.todayAds },
                { label: "کل املاک ثبت‌شده", value: stats?.totalProperties },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0 text-sm"
                >
                  <span className="text-muted-foreground flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-600 border-amber-300"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </span>
                  <span className="font-extrabold tabular-nums">
                    {item.value !== undefined && item.value !== null
                      ? item.value.toLocaleString("fa-IR")
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              خلاصه آمار کاربران و فعالیت‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {[
                { label: "کل کاربران فعال سیستم", value: stats?.totalUsers },
                { label: "ثبت‌نامی‌های امروز", value: stats?.todayUsers },
                {
                  label: "کل گزارشات تخلف ثبت‌شده",
                  value: stats?.totalReports || reports.length,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0 text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-extrabold tabular-nums">
                    {item.value !== undefined && item.value !== null
                      ? item.value.toLocaleString("fa-IR")
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REPORTS MANAGEMENT TABLE CARD */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-gradient-to-r from-destructive/5 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 bg-destructive/10 text-destructive rounded-lg">
                <Flag className="w-4 h-4" />
              </div>
              مدیریت گزارشات تخلف دریافت شده
            </CardTitle>
            <Badge variant="secondary" className="w-fit text-xs">
              مجموع: {reports.length.toLocaleString("fa-IR")} گزارش
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس عنوان یا نوع تخلف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 rounded-xl border-border/60"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-xl border-border/60">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="فیلتر وضعیت" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="pending">در انتظار بررسی</SelectItem>
                <SelectItem value="reviewed">در حال بررسی</SelectItem>
                <SelectItem value="resolved">حل‌شده</SelectItem>
                <SelectItem value="rejected">ردشده</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Display */}
          {reportError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3.5 rounded-xl flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reportError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReports}
                className="h-8 border-destructive/30 hover:bg-destructive/10"
              >
                تلاش مجدد
              </Button>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-right font-bold text-xs py-3.5">
                    تاریخ ثبت
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs py-3.5">
                    گزارش‌دهنده
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs py-3.5">
                    نوع تخلف
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs py-3.5">
                    هدف گزارش
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs py-3.5">
                    وضعیت
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs py-3.5">
                    توضیحات
                  </TableHead>
                  <TableHead className="text-center font-bold text-xs py-3.5">
                    عملیات
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingReports ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Flag className="w-10 h-10 opacity-30 text-muted-foreground" />
                        <p className="font-semibold text-sm">
                          هیچ گزارشی یافت نشد
                        </p>
                        <p className="text-xs text-muted-foreground">
                          با تغییر فیلترها یا عبارت جستجو دوباره امتحان کنید.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => {
                    const statusConfig =
                      STATUS_BADGE[report.status] || STATUS_BADGE.pending;
                    return (
                      <TableRow
                        key={report._id}
                        className="hover:bg-muted/40 transition-colors group"
                      >
                        <TableCell className="text-xs font-medium whitespace-nowrap">
                          {formatDate(report.createdAt)}
                        </TableCell>

                        <TableCell className="text-sm font-medium">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>
                              {report.reporter
                                ? `${report.reporter.firstName || ""} ${report.reporter.lastName || ""}`.trim() ||
                                  "کاربر سامانه"
                                : "کاربر مهمان"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">
                          <Badge
                            variant="outline"
                            className="text-xs font-normal border-border/80 bg-background"
                          >
                            {REPORT_TYPE_LABELS[report.type] || report.type}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm font-medium">
                          <div className="flex items-center gap-1">
                            {report.targetType === "ad" && (
                              <FileText className="w-3.5 h-3.5 text-blue-500" />
                            )}
                            {report.targetType === "property" && (
                              <Building className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            {report.targetType === "user" && (
                              <User className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            <span>
                              {report.targetType === "ad"
                                ? "آگهی"
                                : report.targetType === "property"
                                  ? "ملک"
                                  : "کاربر"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">
                          <Badge
                            className={`text-[11px] font-medium border ${statusConfig.className}`}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs max-w-[220px] truncate text-muted-foreground">
                          {report.description || "بدون توضیح"}
                        </TableCell>

                        <TableCell className="text-sm">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setSelectedReport(report);
                                setDetailOpen(true);
                              }}
                              title="مشاهده جزئیات کامل"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {report.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50"
                                  onClick={() => handleResolve(report._id)}
                                  title="تأیید و رفع گزارش"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"
                                  onClick={() => handleReject(report._id)}
                                  title="رد گزارش (بدون مشکل)"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 🟢 MODAL: EXPORT & DOWNLOAD OPTIONS */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              تنظیمات خروجی‌گیری گزارشات
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              فرمت و محدوده داده‌های مدنظر برای خروجی‌گیری را انتخاب کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">
                محدوده گزارش:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${exportScope === "filtered" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "filtered"}
                      onChange={() => setExportScope("filtered")}
                      className="accent-primary"
                    />
                    <div>
                      <p className="font-semibold text-xs">
                        مطابق با فیلترهای فعال فعلی
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        بر اساس فیلتر وضعیت و جستجوی کنونی
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${exportScope === "all" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "all"}
                      onChange={() => setExportScope("all")}
                      className="accent-primary"
                    />
                    <div>
                      <p className="font-semibold text-xs">
                        کل گزارشات تخلف سامانه
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        خروجی کامل بدون اعمال هیچ فیلتری
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${exportScope === "recent" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === "recent"}
                      onChange={() => setExportScope("recent")}
                      className="accent-primary"
                    />
                    <div>
                      <p className="font-semibold text-xs">
                        گزارشات ۳۰ روز اخیر
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        فقط موارد ثبت‌شده در یک ماه گذشته
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              onClick={handleDownloadExcel}
              disabled={!!downloading}
              variant="outline"
              className="w-full sm:w-1/2 gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-xl"
            >
              <Sheet className="w-4 h-4" />
              {downloading === "excel" ? "در حال ساخت..." : "خروجی Excel"}
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={!!downloading}
              className="w-full sm:w-1/2 gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              <FileDown className="w-4 h-4" />
              {downloading === "pdf" ? "در حال ساخت..." : "خروجی PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔴 MODAL: REPORT DETAILS */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-destructive/10 text-destructive rounded-xl">
                <Flag className="w-5 h-5" />
              </div>
              بررسی جزئیات گزارش تخلف
            </DialogTitle>

            <DialogDescription className="text-xs text-muted-foreground">
              اطلاعات فرستنده، هدف گزارش و توضیحات مربوطه
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 text-sm py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                  <span className="text-xs text-muted-foreground block mb-1">
                    نوع تخلف
                  </span>
                  <span className="font-bold text-xs text-foreground">
                    {REPORT_TYPE_LABELS[selectedReport.type] ||
                      selectedReport.type}
                  </span>
                </div>

                <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                  <span className="text-xs text-muted-foreground block mb-1">
                    هدف گزارش
                  </span>
                  <span className="font-bold text-xs text-foreground">
                    {selectedReport.targetType === "ad"
                      ? "آگهی"
                      : selectedReport.targetType === "property"
                        ? "ملک"
                        : "کاربر"}
                  </span>
                </div>

                <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                  <span className="text-xs text-muted-foreground block mb-1">
                    گزارش‌دهنده
                  </span>
                  <span className="font-bold text-xs text-foreground">
                    {selectedReport.reporter
                      ? `${selectedReport.reporter.firstName || ""} ${selectedReport.reporter.lastName || ""}`.trim()
                      : "کاربر مهمان"}
                  </span>
                </div>

                <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                  <span className="text-xs text-muted-foreground block mb-1">
                    وضعیت فعلی
                  </span>
                  <Badge
                    className={`text-[10px] font-medium border ${STATUS_BADGE[selectedReport.status]?.className}`}
                  >
                    {STATUS_BADGE[selectedReport.status]?.label}
                  </Badge>
                </div>
              </div>

              {/* شناسه هدف همراه با لینک هدایت */}
              <div className="bg-muted/30 p-3 rounded-xl border border-border/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">
                    شناسه هدف (ID):
                  </span>
                  <span className="font-mono text-xs font-bold dir-ltr block text-left text-primary">
                    {selectedReport.targetId}
                  </span>
                </div>
                <a
                  href={getTargetUrl(
                    selectedReport.targetType,
                    selectedReport.targetId,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  مشاهده هدف
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* نتیجه یا توضیحات مدیریت */}
              {selectedReport.resolution && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-bold mb-1">
                    نتیجه و اقدام انجام شده:
                  </span>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    {selectedReport.resolution}
                  </p>
                </div>
              )}

              {/* متن توضیحات گزارش */}
              <div>
                <span className="text-xs text-muted-foreground block mb-1 font-semibold">
                  توضیحات گزارش‌دهنده:
                </span>
                <p className="bg-muted/30 p-3.5 rounded-xl border border-border/40 text-xs leading-relaxed text-foreground/90 min-h-[70px]">
                  {selectedReport.description ||
                    "توضیحاتی توسط کاربر ارائه نشده است."}
                </p>
              </div>

              {/* دکمه‌های اقدام سریع در صورت معلق بودن */}
              {selectedReport.status === "pending" && (
                <div className="pt-2 flex gap-2">
                  <Button
                    onClick={() => handleResolve(selectedReport._id)}
                    disabled={actionLoading}
                    className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9"
                  >
                    <CheckCircle className="w-4 h-4" />
                    تأیید و علامت‌گذاری به عنوان حل‌شده
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedReport._id)}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1 gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl text-xs h-9"
                  >
                    <XCircle className="w-4 h-4" />
                    رد گزارش
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
