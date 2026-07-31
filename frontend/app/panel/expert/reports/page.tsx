// app/panel/expert/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  User,
  Calendar,
  Mail,
  Phone,
  Loader2,
  FileDown,
  Sheet,
  Filter,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import apiClient from "@/services/api/client";
import * as XLSX from "xlsx";
import { InfoCardStatic } from "@/components/ui/info-card";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
interface Report {
  _id: string;
  reporter: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  targetType: "ad" | "property" | "user";
  targetId: string;
  type: string;
  description?: string;
  evidence?: string[];
  status: "pending" | "reviewed" | "resolved" | "rejected";
  resolution?: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────
const REPORT_TYPES: Record<string, string> = {
  spam: "هرزنامه",
  fraud: "کلاهبرداری",
  fake: "آگهی جعلی",
  offensive: "محتوای نامناسب",
  illegal: "محتوای غیرقانونی",
  duplicate: "آگهی تکراری",
  wrong_category: "دسته‌بندی اشتباه",
  other: "سایر",
};

const TARGET_TYPES: Record<string, string> = {
  ad: "آگهی",
  property: "ملک",
  user: "کاربر",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  reviewed: "در حال بررسی",
  resolved: "بررسی شده",
  rejected: "رد شده",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string; icon: React.ReactNode }
> = {
  pending: {
    label: "در انتظار بررسی",
    bgClass:
      "bg-amber-100/80 dark:bg-amber-500/20 border-amber-200 dark:border-amber-800",
    textClass: "text-amber-700 dark:text-amber-300",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  reviewed: {
    label: "در حال بررسی",
    bgClass:
      "bg-blue-100/80 dark:bg-blue-500/20 border-blue-200 dark:border-blue-800",
    textClass: "text-blue-700 dark:text-blue-300",
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  resolved: {
    label: "بررسی شده",
    bgClass:
      "bg-emerald-100/80 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800",
    textClass: "text-emerald-700 dark:text-emerald-300",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "رد شده",
    bgClass:
      "bg-red-100/80 dark:bg-red-500/20 border-red-200 dark:border-red-800",
    textClass: "text-red-700 dark:text-red-300",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

// ─── Helpers ──────────────────────────────────────────────
const getPersianDate = () =>
  new Date().toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Download Functions ──────────────────────────────────
function downloadReportsExcel(reports: Report[]) {
  const persianDate = getPersianDate();
  const header = [
    "ردیف",
    "نوع تخلف",
    "هدف",
    "گزارش‌دهنده",
    "شماره تماس",
    "وضعیت",
    "توضیحات",
    "تاریخ",
  ];
  const rows = reports.map((r, i) => [
    i + 1,
    REPORT_TYPES[r.type] || r.type,
    TARGET_TYPES[r.targetType] || r.targetType,
    `${r.reporter?.firstName || ""} ${r.reporter?.lastName || ""}`.trim(),
    r.reporter?.phone || "",
    STATUS_LABELS[r.status] || r.status,
    r.description || "",
    formatDate(r.createdAt),
  ]);
  const data = [[`گزارشات تخلف - تاریخ: ${persianDate}`], [], header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 10 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 30 },
    { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "گزارشات تخلف");
  const fileName = `گزارشات-تخلف-${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function downloadReportsPDF(reports: Report[]) {
  const persianDate = getPersianDate();
  const rows = reports
    .map(
      (r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${REPORT_TYPES[r.type] || r.type}</td>
        <td>${TARGET_TYPES[r.targetType] || r.targetType}</td>
        <td>${r.reporter?.firstName || ""} ${r.reporter?.lastName || ""}</td>
        <td>${r.reporter?.phone || ""}</td>
        <td><span class="badge badge-${r.status}">${STATUS_LABELS[r.status] || r.status}</span></td>
        <td>${formatDate(r.createdAt)}</td>
      </tr>`,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>گزارشات تخلف</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Vazirmatn', Tahoma, sans-serif;
          direction: rtl;
          padding: 32px;
          color: #1e293b;
          font-size: 13px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #ea580c;
          padding-bottom: 20px;
          margin-bottom: 28px;
        }
        .title-block h1 {
          font-size: 22px;
          font-weight: 700;
          color: #ea580c;
        }
        .title-block p { font-size: 12px; color: #64748b; margin-top: 4px; }
        .meta { text-align: left; font-size: 12px; color: #64748b; }
        .summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 16px;
          text-align: center;
        }
        .summary-card .num {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }
        .summary-card .lbl { font-size: 11px; color: #64748b; margin-top: 2px; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th {
          background: #ea580c;
          color: white;
          padding: 10px 12px;
          text-align: right;
          font-weight: 600;
        }
        td {
          padding: 9px 12px;
          border-bottom: 1px solid #e2e8f0;
          text-align: right;
        }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-pending { background: #fef3c7; color: #d97706; }
        .badge-resolved { background: #dcfce7; color: #15803d; }
        .badge-rejected { background: #fee2e2; color: #b91c1c; }
        .badge-reviewed { background: #dbeafe; color: #1d4ed8; }
        .footer {
          margin-top: 32px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
        }
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title-block">
          <h1>🚩 گزارشات تخلف</h1>
          <p>پنل کارشناس - سیستم مدیریت</p>
        </div>
        <div class="meta">
          <div>تاریخ: ${persianDate}</div>
          <div>تعداد کل: ${reports.length} گزارش</div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-card">
          <div class="num">${reports.length}</div>
          <div class="lbl">کل گزارش‌ها</div>
        </div>
        <div class="summary-card">
          <div class="num" style="color:#d97706">${reports.filter((r) => r.status === "pending").length}</div>
          <div class="lbl">در انتظار بررسی</div>
        </div>
        <div class="summary-card">
          <div class="num" style="color:#15803d">${reports.filter((r) => r.status === "resolved").length}</div>
          <div class="lbl">بررسی شده</div>
        </div>
        <div class="summary-card">
          <div class="num" style="color:#b91c1c">${reports.filter((r) => r.status === "rejected").length}</div>
          <div class="lbl">رد شده</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>نوع تخلف</th>
            <th>هدف</th>
            <th>گزارش‌دهنده</th>
            <th>شماره تماس</th>
            <th>وضعیت</th>
            <th>تاریخ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="footer">
        این گزارش به صورت خودکار توسط سیستم مدیریت تهیه شده است | ${persianDate}
      </div>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (!win) {
    alert("لطفاً پاپ‌آپ مرورگر را برای این سایت فعال کنید");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () =>
    setTimeout(() => {
      win.print();
      win.close();
    }, 800);
}

// ─── Main Component ──────────────────────────────────────
export default function ExpertReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolution, setResolution] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const fetchReports = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const endpoint =
        statusFilter === "pending"
          ? "/reports/pending"
          : `/reports?status=${statusFilter}`;
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      const response = await apiClient.get(endpoint, { params });
      setReports(response.data.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("خطا در دریافت گزارشات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, searchTerm]);

  const handleResolve = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/reports/${selectedReport._id}/resolve`, {
        resolution,
      });
      toast.success("گزارش تخلف با موفقیت بررسی شد");
      fetchReports(true);
      setShowDetailModal(false);
      setSelectedReport(null);
      setResolution("");
    } catch (error) {
      toast.error("خطا در بررسی گزارش");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/reports/${selectedReport._id}/reject`, {
        reason: resolution,
      });
      toast.success("گزارش تخلف رد شد");
      fetchReports(true);
      setShowDetailModal(false);
      setSelectedReport(null);
      setResolution("");
    } catch (error) {
      toast.error("خطا در رد گزارش");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (reports.length === 0) {
      toast.error("گزارشی برای دانلود وجود ندارد");
      return;
    }
    setDownloadingPDF(true);
    try {
      downloadReportsPDF(reports);
    } catch {
      toast.error("خطا در تهیه PDF");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadExcel = () => {
    if (reports.length === 0) {
      toast.error("گزارشی برای دانلود وجود ندارد");
      return;
    }
    setDownloadingExcel(true);
    try {
      downloadReportsExcel(reports);
      toast.success("فایل Excel دانلود شد");
    } catch {
      toast.error("خطا در تهیه Excel");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const openDetailModal = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* ===== Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <Flag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                گزارشات تخلف
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                بررسی و مدیریت گزارشات تخلف کاربران
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              {stats.total} گزارش
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchReports(true)}
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

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<Flag className="w-5 h-5" />}
            title="کل گزارش‌ها"
            value={stats.total}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<Clock className="w-5 h-5" />}
            title="در انتظار بررسی"
            value={stats.pending}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<CheckCircle className="w-5 h-5" />}
            title="بررسی شده"
            value={stats.resolved}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<XCircle className="w-5 h-5" />}
            title="رد شده"
            value={stats.rejected}
          />
        </motion.div>
      </div>

      {/* ===== Search & Filter ===== */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی گزارش..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 rounded-xl h-11 bg-background border-border/60 focus:border-primary/40 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl h-11 bg-background border-border/60 focus:border-primary/40 focus:ring-primary/30">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="pending">در انتظار بررسی</SelectItem>
              <SelectItem value="resolved">بررسی شده</SelectItem>
              <SelectItem value="rejected">رد شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ===== Reports List ===== */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-dashed border-border/60 rounded-2xl bg-muted/5">
          <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-base">
              {statusFilter === "pending"
                ? "هیچ گزارش تخلف جدیدی وجود ندارد"
                : `هیچ گزارشی با وضعیت ${STATUS_LABELS[statusFilter] || statusFilter} وجود ندارد`}
            </p>
            <p className="text-xs max-w-xs">
              {statusFilter === "pending"
                ? "همه گزارش‌های تخلف بررسی شده‌اند"
                : "با تغییر فیلتر ممکن است نتیجه‌ای پیدا شود"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Download Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">
              {reports.length} گزارش یافت شد
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                className="gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all text-xs"
              >
                <Sheet className="w-4 h-4" />
                {downloadingExcel ? "..." : "Excel"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all text-xs"
              >
                <FileDown className="w-4 h-4" />
                {downloadingPDF ? "..." : "PDF"}
              </Button>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {reports.map((report, index) => {
              const status =
                STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
              return (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden rounded-2xl group">
                    <CardContent className="p-4 md:p-5">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 text-primary" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-sm text-foreground">
                                  {REPORT_TYPES[report.type] || report.type}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-2 py-0 rounded-md border-border/50 text-muted-foreground"
                                >
                                  {TARGET_TYPES[report.targetType] ||
                                    report.targetType}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {report.reporter?.firstName || ""}{" "}
                                  {report.reporter?.lastName || ""}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {report.reporter?.phone || "—"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(report.createdAt)}
                                </span>
                              </div>
                            </div>
                            <Badge
                              className={cn(
                                "text-[10px] px-2.5 py-0.5 rounded-md gap-1 border shrink-0",
                                status.bgClass,
                                status.textClass,
                              )}
                            >
                              {status.icon}
                              {status.label}
                            </Badge>
                          </div>

                          {report.description && (
                            <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2">
                              {report.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex md:flex-col gap-2 justify-end shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                            onClick={() => openDetailModal(report)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">جزئیات</span>
                          </Button>
                          {report.status === "pending" && (
                            <Button
                              size="sm"
                              className="gap-1 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                              onClick={() => openDetailModal(report)}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">بررسی</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* ===== Detail Modal ===== */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/50 p-0">
          {selectedReport && (
            <>
              <DialogHeader className="p-5 border-b border-border/20 bg-muted/5">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  جزئیات گزارش تخلف
                </DialogTitle>
              </DialogHeader>

              <div className="p-5 space-y-5">
                {/* Status & Type */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">نوع تخلف</p>
                    <p className="font-bold text-base">
                      {REPORT_TYPES[selectedReport.type] || selectedReport.type}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[11px] px-3 py-1 rounded-md gap-1 border",
                      STATUS_CONFIG[selectedReport.status]?.bgClass,
                      STATUS_CONFIG[selectedReport.status]?.textClass,
                    )}
                  >
                    {STATUS_CONFIG[selectedReport.status]?.icon}
                    {STATUS_CONFIG[selectedReport.status]?.label}
                  </Badge>
                </div>

                {/* Target */}
                <div>
                  <p className="text-xs text-muted-foreground">هدف گزارش</p>
                  <p className="font-medium text-sm">
                    {TARGET_TYPES[selectedReport.targetType] ||
                      selectedReport.targetType}{" "}
                    <span className="text-muted-foreground text-xs">
                      (شناسه: {selectedReport.targetId})
                    </span>
                  </p>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">توضیحات</p>
                    <div className="text-sm mt-1 bg-muted/30 p-3 rounded-lg border border-border/30 whitespace-pre-wrap">
                      {selectedReport.description}
                    </div>
                  </div>
                )}

                {/* Evidence */}
                {selectedReport.evidence &&
                  selectedReport.evidence.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">مدارک</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedReport.evidence.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`مدرک ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-border/50"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Reporter Info */}
                <div className="bg-muted/10 rounded-xl p-4 space-y-2 border border-border/30">
                  <p className="text-sm font-bold flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary" />
                    اطلاعات گزارش‌دهنده
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {selectedReport.reporter?.firstName || ""}{" "}
                        {selectedReport.reporter?.lastName || ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedReport.reporter?.phone || "—"}</span>
                    </div>
                    {selectedReport.reporter?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedReport.reporter?.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(selectedReport.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Resolution Section */}
                {selectedReport.status === "pending" ? (
                  <div className="border-t border-border/30 pt-4 space-y-3">
                    <div>
                      <Label className="text-xs font-bold">نتیجه بررسی</Label>
                      <Textarea
                        placeholder="توضیحات نتیجه بررسی را وارد کنید..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="mt-1.5 rounded-xl resize-none border-border/60 focus:border-primary/40 focus:ring-primary/30"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={actionLoading}
                        className="flex-1 gap-2 rounded-xl"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        رد گزارش
                      </Button>
                      <Button
                        onClick={handleResolve}
                        disabled={actionLoading}
                        className="flex-1 gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        تایید و بستن
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border/30 pt-4">
                    <p className="text-xs text-muted-foreground">نتیجه بررسی</p>
                    <p className="text-sm mt-1 bg-muted/10 p-3 rounded-lg border border-border/30">
                      {selectedReport.resolution || "توضیحی ثبت نشده است"}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="p-4 border-t border-border/20 bg-muted/5">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-xl"
                >
                  بستن
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
