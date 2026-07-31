"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Flag, Search, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api/client";

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
    className: "bg-amber-100 text-amber-700 border-amber-300",
  },
  reviewed: {
    label: "بررسی‌شده",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
  resolved: {
    label: "حل‌شده",
    className: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  rejected: {
    label: "ردشده",
    className: "bg-red-100 text-red-700 border-red-300",
  },
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
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="w-6 h-6 text-destructive" />
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تاریخچهٔ گزارش‌هایی که ثبت کرده‌اید
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMyReports}
          className="gap-1 rounded-xl"
        >
          <RefreshCw className="w-4 h-4" />
          بروزرسانی
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="resolved">حل‌شده</SelectItem>
            <SelectItem value="rejected">ردشده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <Button
            variant="link"
            size="sm"
            onClick={fetchMyReports}
            className="text-destructive"
          >
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-right">تاریخ</TableHead>
                  <TableHead className="text-right">نوع تخلف</TableHead>
                  <TableHead className="text-right">هدف</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">نتیجه</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
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
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <Flag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      هیچ گزارشی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => {
                    const statusConfig =
                      STATUS_BADGE[report.status] || STATUS_BADGE.pending;
                    return (
                      <TableRow key={report._id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatDate(report.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="secondary" className="text-xs">
                            {REPORT_TYPE_LABELS[report.type] || report.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {report.targetType === "ad"
                            ? "آگهی"
                            : report.targetType === "property"
                              ? "ملک"
                              : "کاربر"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge
                            className={`text-xs border ${statusConfig.className}`}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {report.resolution || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedReport(report);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            قبلی
          </Button>
          <span className="flex items-center text-sm">
            {page} از {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            بعدی
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-destructive" />
              جزئیات گزارش
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">نوع تخلف:</span>
                <Badge variant="secondary">
                  {REPORT_TYPE_LABELS[selectedReport.type] ||
                    selectedReport.type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">هدف:</span>
                <span>
                  {selectedReport.targetType === "ad"
                    ? "آگهی"
                    : selectedReport.targetType === "property"
                      ? "ملک"
                      : "کاربر"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">تاریخ:</span>
                <span>{formatDate(selectedReport.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">وضعیت:</span>
                <Badge
                  className={STATUS_BADGE[selectedReport.status]?.className}
                >
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
    </div>
  );
}
