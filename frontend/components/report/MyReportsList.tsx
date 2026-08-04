// components/panel/MyReportsList.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flag, Search, RefreshCw, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api/client";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Report {
  _id: string;
  targetType: "ad" | "property" | "user";
  targetId: string;
  type: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "rejected";
  resolution?: string;
  reviewedBy?: { firstName: string; lastName: string };
  createdAt: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  spam: "اسپم",
  fraud: "کلاهبرداری",
  fake: "جعلی",
  offensive: "نامناسب",
  illegal: "غیرقانونی",
  duplicate: "تکراری",
  wrong_category: "دسته‌بندی اشتباه",
  other: "سایر",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "در انتظار",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  reviewed: {
    label: "بررسی‌شده",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  resolved: {
    label: "حل‌شده",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  rejected: {
    label: "ردشده",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

// تابع کمکی برای ساخت لینک بر اساس نوع هدف
const getTargetLink = (report: Report): string => {
  switch (report.targetType) {
    case "ad":
      return `/ad/${report.targetId}`;
    case "property":
      return `/property/${report.targetId}`;
    case "user":
      return `/profile/${report.targetId}`;
    default:
      return "#";
  }
};

const getTargetLabel = (targetType: string): string => {
  switch (targetType) {
    case "ad": return "آگهی";
    case "property": return "ملک";
    case "user": return "کاربر";
    default: return targetType;
  }
};

interface MyReportsListProps {
  title?: string;
}

export function MyReportsList({ title = "گزارش‌های من" }: MyReportsListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMyReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;

      const { data } = await apiClient.get("/reports/my", { params });
      if (data.success) {
        setReports(data.data);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "خطا در دریافت گزارشات");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  const formatDate = (date: string) => new Date(date).toLocaleString("fa-IR");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-destructive/10 rounded-xl text-destructive">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              تاریخچهٔ گزارش‌هایی که ثبت کرده‌اید
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMyReports}
          className="gap-2 rounded-xl border-border/60 hover:bg-muted"
        >
          <RefreshCw className="w-4 h-4" />
          بروزرسانی
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-xl h-10 bg-muted/40 border-border/60 focus:ring-primary">
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="resolved">حل‌شده</SelectItem>
            <SelectItem value="rejected">ردشده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm flex justify-between items-center border border-destructive/20">
          <span>{error}</span>
          <Button
            variant="link"
            size="sm"
            onClick={fetchMyReports}
            className="text-destructive font-bold"
          >
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* Table (Desktop) & Card List (Mobile) */}
      <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="text-right text-xs font-bold text-muted-foreground p-4">تاریخ</th>
                <th className="text-right text-xs font-bold text-muted-foreground p-4">نوع تخلف</th>
                <th className="text-right text-xs font-bold text-muted-foreground p-4">هدف</th>
                <th className="text-right text-xs font-bold text-muted-foreground p-4">وضعیت</th>
                <th className="text-right text-xs font-bold text-muted-foreground p-4">نتیجه</th>
                <th className="text-right text-xs font-bold text-muted-foreground p-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Flag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">هیچ گزارشی یافت نشد</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const statusConfig = STATUS_BADGE[report.status] || STATUS_BADGE.pending;
                  const targetLink = getTargetLink(report);
                  const targetLabel = getTargetLabel(report.targetType);

                  return (
                    <tr key={report._id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                      <td className="text-sm whitespace-nowrap p-4">{formatDate(report.createdAt)}</td>
                      <td className="text-sm p-4">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {REPORT_TYPE_LABELS[report.type] || report.type}
                        </Badge>
                      </td>
                      <td className="text-sm p-4">
                        <Link href={targetLink} className="text-primary hover:underline font-medium">
                          {targetLabel}
                        </Link>
                      </td>
                      <td className="text-sm p-4">
                        <Badge className={cn("text-xs border font-bold rounded-md", statusConfig.className)}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="text-sm p-4 max-w-[200px] truncate">
                        {report.resolution || "—"}
                      </td>
                      <td className="text-sm p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setSelectedReport(report);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Link href={targetLink} target="_blank">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-border/40">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))
          ) : reports.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Flag className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-sm">هیچ گزارشی یافت نشد</p>
            </div>
          ) : (
            reports.map((report) => {
              const statusConfig = STATUS_BADGE[report.status] || STATUS_BADGE.pending;
              const targetLink = getTargetLink(report);
              const targetLabel = getTargetLabel(report.targetType);

              return (
                <div key={report._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="secondary" className="text-xs font-medium mb-1">
                        {REPORT_TYPE_LABELS[report.type] || report.type}
                      </Badge>
                      <p className="text-sm font-bold">
                        <Link href={targetLink} className="text-primary hover:underline">
                          {targetLabel}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</p>
                    </div>
                    <Badge className={cn("text-xs border font-bold rounded-md shrink-0", statusConfig.className)}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg h-8"
                      onClick={() => {
                        setSelectedReport(report);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      جزئیات
                    </Button>
                    <Link href={targetLink} target="_blank">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg h-8"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        مشاهده
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl h-9 gap-1"
          >
            قبلی
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
            بعدی
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-border/50" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-destructive" />
              جزئیات گزارش
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-3 text-sm mt-2">
              <div className="flex justify-between">
                <span className="font-medium">نوع تخلف:</span>
                <Badge variant="secondary">
                  {REPORT_TYPE_LABELS[selectedReport.type] || selectedReport.type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">هدف:</span>
                <Link
                  href={getTargetLink(selectedReport)}
                  target="_blank"
                  className="text-primary hover:underline font-medium"
                >
                  {getTargetLabel(selectedReport.targetType)}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">تاریخ:</span>
                <span>{formatDate(selectedReport.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">وضعیت:</span>
                <Badge className={STATUS_BADGE[selectedReport.status]?.className}>
                  {STATUS_BADGE[selectedReport.status]?.label}
                </Badge>
              </div>
              {selectedReport.resolution && (
                <div>
                  <span className="font-medium block mb-1">نتیجه بررسی:</span>
                  <p className="text-muted-foreground bg-muted/20 p-2 rounded-lg">
                    {selectedReport.resolution}
                  </p>
                </div>
              )}
              {selectedReport.description && (
                <div>
                  <span className="font-medium block mb-1">توضیحات:</span>
                  <p className="text-muted-foreground bg-muted/20 p-2 rounded-lg">
                    {selectedReport.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}