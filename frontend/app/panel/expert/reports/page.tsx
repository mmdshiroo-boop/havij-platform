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
import { motion } from "framer-motion";
import { toast } from "sonner";
import apiClient from "@/services/api/client";
import * as XLSX from "xlsx";
import { StatCard } from "@/components/ui/stat-card";
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

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: "در انتظار بررسی",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  reviewed: {
    label: "در حال بررسی",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  resolved: {
    label: "بررسی شده",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "رد شده",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

// ─── Helpers ──────────────────────────────────────────────
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
    STATUS_CONFIG[r.status]?.label || r.status,
    r.description || "",
    formatDate(r.createdAt),
  ]);
  const data = [
    [`گزارشات تخلف - ${new Date().toLocaleDateString("fa-IR")}`],
    [],
    header,
    ...rows,
  ];
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
  XLSX.writeFile(
    wb,
    `گزارشات-تخلف-${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.xlsx`,
  );
}

function downloadReportsPDF(reports: Report[]) {
  const rows = reports
    .map(
      (r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${REPORT_TYPES[r.type] || r.type}</td>
        <td>${TARGET_TYPES[r.targetType] || r.targetType}</td>
        <td>${r.reporter?.firstName || ""} ${r.reporter?.lastName || ""}</td>
        <td>${r.reporter?.phone || ""}</td>
        <td>${STATUS_CONFIG[r.status]?.label || r.status}</td>
        <td>${formatDate(r.createdAt)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head><meta charset="UTF-8"><title>گزارشات تخلف</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Vazirmatn',Tahoma,sans-serif;direction:rtl;padding:32px;color:#1e293b;font-size:13px}
  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #ea580c;padding-bottom:20px;margin-bottom:28px}
  .title-block h1{font-size:22px;font-weight:700;color:#ea580c}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#ea580c;color:white;padding:10px 12px;text-align:right;font-weight:600}
  td{padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right}
  .footer{margin-top:32px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px}
</style></head>
<body>
  <div class="header"><div class="title-block"><h1>🚩 گزارشات تخلف</h1></div></div>
  <table><thead><tr><th>#</th><th>نوع تخلف</th><th>هدف</th><th>گزارش‌دهنده</th><th>شماره تماس</th><th>وضعیت</th><th>تاریخ</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="footer">این گزارش به صورت خودکار توسط سیستم مدیریت تهیه شده است</div>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    toast.error("لطفاً پاپ‌آپ مرورگر را فعال کنید");
    return;
  }
  win.document.write(html);
  win.document.close();
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

  const openDetailModal = (report: Report) => {
    setSelectedReport(report);
    setResolution(report.resolution || "");
    setShowDetailModal(true);
  };

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  };

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
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              گزارشات تخلف
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              بررسی و مدیریت گزارشات تخلف کاربران
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReports(true)}
            disabled={refreshing}
            className="gap-1.5 rounded-xl border-border/60 hover:bg-muted"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            {refreshing ? "در حال بروزرسانی..." : "بروزرسانی"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="کل گزارش‌ها" value={stats.total.toLocaleString()} icon={Flag} />
        <StatCard title="در انتظار" value={stats.pending.toLocaleString()} icon={Clock} colorVariant="amber" />
        <StatCard title="بررسی شده" value={stats.resolved.toLocaleString()} icon={CheckCircle} colorVariant="emerald" />
        <StatCard title="رد شده" value={stats.rejected.toLocaleString()} icon={XCircle} colorVariant="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی گزارش..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 rounded-xl h-10 bg-muted/40 border-border/60 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] rounded-xl h-10 bg-muted/40 border-border/60">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="pending">در انتظار بررسی</SelectItem>
              <SelectItem value="resolved">بررسی شده</SelectItem>
              <SelectItem value="rejected">رد شده</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadReportsExcel(reports)}
            className="gap-1.5 rounded-xl border-border/60 hover:bg-muted text-xs"
          >
            <Sheet className="w-4 h-4" /> Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadReportsPDF(reports)}
            className="gap-1.5 rounded-xl border-border/60 hover:bg-muted text-xs"
          >
            <FileDown className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="py-16 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-medium">هیچ گزارشی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
            return (
              <Card
                key={report._id}
                className="border-border/60 shadow-sm hover:shadow-md transition-all rounded-2xl bg-card/80 backdrop-blur-sm group overflow-hidden"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                  <div className="p-2.5 bg-primary/10 rounded-xl shrink-0 h-fit">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm">
                          {REPORT_TYPES[report.type] || report.type}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {report.reporter?.firstName} {report.reporter?.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {report.reporter?.phone || "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px] font-bold border shrink-0", status.className)}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </div>
                    {report.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {report.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 rounded-lg text-xs"
                      onClick={() => openDetailModal(report)}
                    >
                      <Eye className="w-3.5 h-3.5" /> بررسی
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border-border/50" dir="rtl">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  جزئیات گزارش تخلف
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold">{REPORT_TYPES[selectedReport.type] || selectedReport.type}</p>
                  <Badge className={cn("text-[10px] font-bold border", STATUS_CONFIG[selectedReport.status]?.className)}>
                    {STATUS_CONFIG[selectedReport.status]?.label}
                  </Badge>
                </div>

                {selectedReport.description && (
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">توضیحات</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedReport.description}</p>
                  </div>
                )}

                <div className="bg-muted/10 rounded-xl p-4 space-y-2 border border-border/30">
                  <p className="text-sm font-bold">اطلاعات گزارش‌دهنده</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedReport.reporter?.firstName} {selectedReport.reporter?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedReport.reporter?.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(selectedReport.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {selectedReport.status === "pending" && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-bold">نتیجه بررسی</Label>
                    <Textarea
                      placeholder="توضیحات نتیجه بررسی را وارد کنید..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="rounded-xl bg-muted/40 border-border/60 focus:ring-primary resize-none"
                      rows={3}
                    />
                    <div className="flex gap-3">
                      <Button variant="destructive" onClick={handleReject} disabled={actionLoading} className="flex-1 gap-2 rounded-xl">
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        رد گزارش
                      </Button>
                      <Button onClick={handleResolve} disabled={actionLoading} className="flex-1 gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white">
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        تأیید و بستن
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailModal(false)} className="rounded-xl">
                  بستن
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}