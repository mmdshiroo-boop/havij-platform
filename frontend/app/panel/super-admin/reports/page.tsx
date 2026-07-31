"use client";

import { useEffect, useState, useCallback } from "react";
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
  Search,
  RotateCcw,
  RefreshCw,
  Filter,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api/client";

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
  pending: { label: "در انتظار", className: "bg-amber-100 text-amber-700" },
  reviewed: { label: "بررسی‌شده", className: "bg-blue-100 text-blue-700" },
  resolved: { label: "حل‌شده", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "ردشده", className: "bg-red-100 text-red-700" },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await apiClient.get("/reports", { params });
      if (data.success) {
        setReports(data.data);
      } else {
        throw new Error(data.message || "خطا در دریافت گزارشات");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "خطای شبکه");
      toast.error("دریافت گزارشات با خطا مواجه شد");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (id: string) => {
    try {
      await apiClient.patch(`/reports/${id}/resolve`, {
        resolution: "بررسی و تأیید شد",
      });
      toast.success("گزارش با موفقیت حل شد");
      fetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در بررسی گزارش");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.patch(`/reports/${id}/reject`, {
        reason: "گزارش رد شد",
      });
      toast.success("گزارش رد شد");
      fetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در رد گزارش");
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString("fa-IR");

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Flag className="w-6 h-6 text-destructive" />
            مدیریت گزارشات تخلف
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            بررسی و رسیدگی به گزارشات ثبت‌شده توسط کاربران
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            className="gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            به‌روزرسانی
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-xl shadow-card border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">فیلترها</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              جستجو
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="نوع تخلف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              وضعیت
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="همه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="reviewed">بررسی‌شده</SelectItem>
                <SelectItem value="resolved">حل‌شده</SelectItem>
                <SelectItem value="rejected">ردشده</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchReports} className="w-full gap-1">
              <Search className="w-4 h-4" />
              اعمال فیلترها
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <Button
            variant="link"
            onClick={fetchReports}
            className="text-destructive"
          >
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-right">تاریخ</TableHead>
                <TableHead className="text-right">گزارش‌دهنده</TableHead>
                <TableHead className="text-right">نوع تخلف</TableHead>
                <TableHead className="text-right">هدف</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">توضیحات</TableHead>
                <TableHead className="text-right">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
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
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Flag className="w-8 h-8 opacity-50" />
                      <p>هیچ گزارشی یافت نشد</p>
                    </div>
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
                        {report.reporter
                          ? `${report.reporter.firstName || ""} ${report.reporter.lastName || ""}`
                          : "—"}
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
                        <Badge className={`text-xs ${statusConfig.className}`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {report.description || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex gap-1">
                          {report.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleResolve(report._id)}
                                title="حل گزارش"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleReject(report._id)}
                                title="رد گزارش"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {report.status !== "pending" && (
                            <span className="text-xs text-muted-foreground">
                              {report.resolution || "—"}
                            </span>
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
      </div>
    </div>
  );
}
