"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Users, FileText, TrendingUp, Activity,
  RefreshCw, FileDown, Flag, Search, CheckCircle,
  XCircle, Eye, ExternalLink, SlidersHorizontal,
  User, Building, AlertCircle, FileSpreadsheet,
  Sheet, Clock,
} from "lucide-react";
import apiClient from "@/services/api/client";
import { adminPanelApi, AdminPanelStats } from "@/services/api/admin-panel.api";
import { cn } from "@/lib/utils";

/* ─── تایپ‌ها ─── */
interface Report {
  _id: string;
  reporter?: { _id: string; firstName?: string; lastName?: string; phone?: string };
  targetType: "ad" | "property" | "user";
  targetId: string;
  type: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "rejected";
  resolution?: string;
  reviewedAt?: string;
  createdAt: string;
}

/* ─── ثابت‌ها ─── */
const REPORT_TYPE_LABELS: Record<string, string> = {
  spam: "اسپم / تبلیغاتی",
  fraud: "کلاهبرداری و مشکوک",
  fake: "محتوا یا هویت جعلی",
  offensive: "محتوای نامناسب",
  illegal: "خلاف قوانین",
  duplicate: "آگهی تکراری",
  wrong_category: "دسته‌بندی اشتباه",
  other: "سایر موارد",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: "در انتظار بررسی",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  },
  reviewed: {
    label: "در حال بررسی",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  },
  resolved: {
    label: "حل‌شده",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  },
  rejected: {
    label: "رد شده",
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900",
  },
};

/* ─── StatCard داخلی ─── */
function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = "text-primary",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-xl sm:text-2xl font-black text-foreground mt-1 tabular-nums">{value}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── کامپوننت اصلی ─── */
export default function AdminReportsPage() {
  const [stats, setStats] = useState<AdminPanelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"filtered" | "all" | "recent">("filtered");

  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminPanelApi.getStats();
      setStats(data);
    } catch (err: any) {
      if (err.response?.status === 403) toast.error("شما دسترسی لازم را ندارید.");
    }
  }, []);

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
      setReportError(err.response?.data?.message || err.message || "خطا در ارتباط با سرور");
    } finally {
      setLoadingReports(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchReports()]);
      setLoading(false);
    };
    init();
  }, [fetchReports, fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchReports()]);
    setRefreshing(false);
    toast.success("اطلاعات به‌روزرسانی شد");
  };

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
      toast.success("PDF با موفقیت دانلود شد");
      setExportModalOpen(false);
    } catch { toast.error("خطا در دانلود PDF"); }
    finally { setDownloading(null); }
  };

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
      toast.success("Excel با موفقیت دانلود شد");
      setExportModalOpen(false);
    } catch { toast.error("خطا در دانلود Excel"); }
    finally { setDownloading(null); }
  };

  const handleResolve = async (id: string) => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/reports/${id}/resolve`, { resolution: "توسط مدیریت بررسی و برطرف گردید" });
      toast.success("گزارش حل‌شده علامت‌گذاری شد");
      fetchReports();
      setSelectedReport((prev) => prev ? { ...prev, status: "resolved", resolution: "توسط مدیریت بررسی و برطرف گردید" } : null);
    } catch (err: any) { toast.error(err.response?.data?.message || "خطا"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/reports/${id}/reject`, { reason: "تخلفی یافت نشد" });
      toast.success("گزارش رد شد");
      fetchReports();
      setSelectedReport((prev) => prev ? { ...prev, status: "rejected", resolution: "تخلفی یافت نشد" } : null);
    } catch (err: any) { toast.error(err.response?.data?.message || "خطا"); }
    finally { setActionLoading(false); }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fa-IR", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return dateStr; }
  };

  const getTargetUrl = (type: string, id: string) => {
    const paths: Record<string, string> = {
      ad: `/panel/admin/ads?id=${id}`,
      property: `/panel/admin/properties?id=${id}`,
      user: `/panel/admin/users?id=${id}`,
    };
    return paths[type] || "#";
  };

  if (loading) {
    return (
      <div className="space-y-5 p-1" dir="rtl">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-10" dir="rtl">
      {/* هدر */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5 sm:p-6 lg:p-8 shadow-sm"
      >
        <div className="absolute -top-20 -left-20 w-52 h-52 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight">
                مرکز گزارشات و آمار سیستم
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                مدیریت گزارشات تخلف، بررسی و خروجی‌گیری داده‌ها
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <Button
              variant="outline" size="sm"
              onClick={handleRefresh} disabled={refreshing}
              className="gap-2 rounded-xl h-10 px-4 text-xs font-bold bg-background/80 backdrop-blur-sm"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              به‌روزرسانی
            </Button>
            <Button
              onClick={() => setExportModalOpen(true)}
              className="gap-2 rounded-xl h-10 px-4 text-xs font-bold shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              خروجی (PDF / Excel)
            </Button>
          </div>
        </div>
      </motion.div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: "کل کاربران",
            value: stats?.totalUsers?.toLocaleString("fa-IR") || "۰",
            icon: Users,
            description: `${stats?.todayUsers?.toLocaleString("fa-IR") || "۰"} کاربر جدید امروز`,
          },
          {
            title: "کل آگهی‌ها",
            value: stats?.totalAds?.toLocaleString("fa-IR") || "۰",
            icon: FileText,
            description: `${stats?.pendingAds?.toLocaleString("fa-IR") || "۰"} در انتظار تایید`,
          },
          {
            title: "آگهی‌های امروز",
            value: stats?.todayAds?.toLocaleString("fa-IR") || "۰",
            icon: TrendingUp,
            description: "ثبت در ۲۴ ساعت گذشته",
          },
          {
            title: "گزارشات تخلف",
            value: stats?.totalReports?.toLocaleString("fa-IR") || reports.length.toLocaleString("fa-IR"),
            icon: Flag,
            description: "تخلفات گزارش‌شده",
            color: "text-red-500",
          },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* خلاصه آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          {
            title: "وضعیت آگهی‌ها و املاک",
            icon: FileText,
            rows: [
              { label: "مجموع کل آگهی‌ها", value: stats?.totalAds },
              { label: "در انتظار تأیید", value: stats?.pendingAds, badge: "نیازمند اقدام" },
              { label: "آگهی‌های جدید امروز", value: stats?.todayAds },
              { label: "کل املاک ثبت‌شده", value: stats?.totalProperties },
            ],
          },
          {
            title: "آمار کاربران و فعالیت‌ها",
            icon: Users,
            rows: [
              { label: "کل کاربران فعال", value: stats?.totalUsers },
              { label: "ثبت‌نامی‌های امروز", value: stats?.todayUsers },
              { label: "کل گزارشات تخلف", value: stats?.totalReports || reports.length },
            ],
          },
        ].map((section, si) => (
          <Card key={si} className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <section.icon className="w-4 h-4 text-primary" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-0">
                {section.rows.map((row, ri) => (
                  <div key={ri} className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0 text-sm">
                    <span className="text-muted-foreground text-xs flex items-center gap-2">
                      {row.label}
                      {row.badge && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          {row.badge}
                        </Badge>
                      )}
                    </span>
                    <span className="font-extrabold tabular-nums text-sm">
                      {row.value != null ? Number(row.value).toLocaleString("fa-IR") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* جدول گزارشات */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-gradient-to-r from-destructive/5 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="p-1.5 bg-destructive/10 text-destructive rounded-lg">
                <Flag className="w-4 h-4" />
              </div>
              مدیریت گزارشات تخلف دریافت‌شده
            </CardTitle>
            <Badge variant="secondary" className="w-fit text-xs font-bold">
              {reports.length.toLocaleString("fa-IR")} گزارش
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* فیلترها */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="جستجو بر اساس نوع تخلف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 rounded-xl border-border/60 h-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-xl border-border/60 h-10 text-sm">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="فیلتر وضعیت" />
                </div>
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="pending">در انتظار بررسی</SelectItem>
                <SelectItem value="reviewed">در حال بررسی</SelectItem>
                <SelectItem value="resolved">حل‌شده</SelectItem>
                <SelectItem value="rejected">رد شده</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* خطا */}
          {reportError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reportError}</span>
              </div>
              <Button variant="outline" size="sm" onClick={fetchReports}
                className="h-8 text-xs border-destructive/30 hover:bg-destructive/10">
                تلاش مجدد
              </Button>
            </div>
          )}

          {/* جدول */}
          <AnimatePresence mode="wait">
            <motion.div
              key={statusFilter + debouncedSearch}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto rounded-xl border border-border/50"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-right font-bold text-xs py-3.5">تاریخ</TableHead>
                    <TableHead className="text-right font-bold text-xs py-3.5">گزارش‌دهنده</TableHead>
                    <TableHead className="text-right font-bold text-xs py-3.5">نوع تخلف</TableHead>
                    <TableHead className="text-right font-bold text-xs py-3.5">هدف</TableHead>
                    <TableHead className="text-right font-bold text-xs py-3.5">وضعیت</TableHead>
                    <TableHead className="text-right hidden sm:table-cell font-bold text-xs py-3.5">توضیحات</TableHead>
                    <TableHead className="text-center font-bold text-xs py-3.5 w-[90px]">عملیات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loadingReports ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 rounded-2xl bg-muted/50">
                            <Flag className="w-8 h-8 opacity-30" />
                          </div>
                          <p className="text-sm font-medium">هیچ گزارشی یافت نشد</p>
                          <p className="text-xs">با تغییر فیلترها دوباره امتحان کنید.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report, i) => {
                      const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
                      const reporterName = report.reporter
                        ? `${report.reporter.firstName || ""} ${report.reporter.lastName || ""}`.trim() || "کاربر"
                        : "مهمان";

                      return (
                        <motion.tr
                          key={report._id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                        >
                          <TableCell className="text-xs font-medium whitespace-nowrap text-muted-foreground py-3">
                            {formatDate(report.createdAt)}
                          </TableCell>

                          <TableCell className="text-sm py-3">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium">{reporterName}</span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <Badge variant="outline" className="text-xs font-normal border-border/80">
                              {REPORT_TYPE_LABELS[report.type] || report.type}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium">
                              {report.targetType === "ad" && <FileText className="w-3.5 h-3.5 text-blue-500" />}
                              {report.targetType === "property" && <Building className="w-3.5 h-3.5 text-emerald-500" />}
                              {report.targetType === "user" && <User className="w-3.5 h-3.5 text-amber-500" />}
                              <span>
                                {report.targetType === "ad" ? "آگهی"
                                  : report.targetType === "property" ? "ملک"
                                  : "کاربر"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <Badge variant="outline" className={cn("text-[11px] font-medium border", statusCfg.className)}>
                              {statusCfg.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-[180px] truncate py-3">
                            {report.description || "—"}
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={() => { setSelectedReport(report); setDetailOpen(true); }}
                                title="مشاهده جزئیات"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {report.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                    onClick={() => handleResolve(report._id)}
                                    title="حل شده"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    onClick={() => handleReject(report._id)}
                                    title="رد گزارش"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* مودال خروجی‌گیری */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              تنظیمات خروجی‌گیری
            </DialogTitle>
            <DialogDescription className="text-xs">
              فرمت و محدوده داده‌های مدنظر را انتخاب کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs font-bold text-muted-foreground">محدوده گزارش:</p>
            {[
              {
                value: "filtered",
                title: "مطابق با فیلترهای فعال",
                desc: "بر اساس فیلتر وضعیت و جستجوی کنونی",
              },
              {
                value: "all",
                title: "کل گزارشات سامانه",
                desc: "خروجی کامل بدون هیچ فیلتری",
              },
              {
                value: "recent",
                title: "گزارشات ۳۰ روز اخیر",
                desc: "فقط موارد ثبت‌شده در یک ماه گذشته",
              },
            ].map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                  exportScope === opt.value ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/30",
                )}
              >
                <input
                  type="radio"
                  name="exportScope"
                  checked={exportScope === opt.value as any}
                  onChange={() => setExportScope(opt.value as any)}
                  className="accent-primary mt-0.5"
                />
                <div>
                  <p className="font-bold text-xs">{opt.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              onClick={handleDownloadExcel}
              disabled={!!downloading}
              variant="outline"
              className="w-full sm:flex-1 gap-2 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-xl h-11"
            >
              {downloading === "excel"
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> در حال ساخت...</>
                : <><Sheet className="w-4 h-4" /> خروجی Excel</>
              }
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={!!downloading}
              className="w-full sm:flex-1 gap-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11"
            >
              {downloading === "pdf"
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> در حال ساخت...</>
                : <><FileDown className="w-4 h-4" /> خروجی PDF</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال جزئیات */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg rounded-2xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <div className="p-2 bg-destructive/10 text-destructive rounded-xl">
                <Flag className="w-5 h-5" />
              </div>
              جزئیات گزارش تخلف
            </DialogTitle>
            <DialogDescription className="text-xs">
              اطلاعات فرستنده، هدف گزارش و توضیحات
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "نوع تخلف", value: REPORT_TYPE_LABELS[selectedReport.type] || selectedReport.type },
                  { label: "هدف گزارش", value: selectedReport.targetType === "ad" ? "آگهی" : selectedReport.targetType === "property" ? "ملک" : "کاربر" },
                  {
                    label: "گزارش‌دهنده",
                    value: selectedReport.reporter
                      ? `${selectedReport.reporter.firstName || ""} ${selectedReport.reporter.lastName || ""}`.trim() || "کاربر"
                      : "مهمان",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/30 p-3 rounded-xl border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="font-bold text-xs">{value}</p>
                  </div>
                ))}

                <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                  <p className="text-xs text-muted-foreground mb-1">وضعیت</p>
                  <Badge variant="outline" className={cn("text-[10px] border", STATUS_CONFIG[selectedReport.status]?.className)}>
                    {STATUS_CONFIG[selectedReport.status]?.label}
                  </Badge>
                </div>
              </div>

              {/* شناسه هدف */}
              <div className="bg-muted/30 p-3 rounded-xl border border-border/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">شناسه هدف (ID):</p>
                  <p className="font-mono text-xs font-bold text-primary truncate" dir="ltr">
                    {selectedReport.targetId}
                  </p>
                </div>
                <a
                  href={getTargetUrl(selectedReport.targetType, selectedReport.targetId)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                >
                  مشاهده
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* نتیجه */}
              {selectedReport.resolution && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-1">اقدام انجام‌شده:</p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">{selectedReport.resolution}</p>
                </div>
              )}

              {/* توضیحات */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-semibold">توضیحات گزارش‌دهنده:</p>
                <div className="bg-muted/30 p-3.5 rounded-xl border border-border/40 text-xs leading-relaxed min-h-[60px]">
                  {selectedReport.description || "توضیحاتی ارائه نشده است."}
                </div>
              </div>

              {/* اقدام سریع */}
              {selectedReport.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => handleResolve(selectedReport._id)}
                    disabled={actionLoading}
                    className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-10"
                  >
                    <CheckCircle className="w-4 h-4" />
                    حل‌شده علامت‌گذاری کن
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedReport._id)}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1 gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl text-xs h-10"
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