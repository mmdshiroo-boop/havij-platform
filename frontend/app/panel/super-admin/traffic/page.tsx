"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/services/api/admin.api";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  RotateCcw,
  RefreshCw,
  Filter,
  Globe,
} from "lucide-react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { toast } from "sonner";

interface PageViewEntry {
  _id: string;
  ip: string;
  path: string;
  referrer?: string;
  user?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  sessionId?: string;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TrafficLogsPage() {
  const [views, setViews] = useState<PageViewEntry[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterIp, setFilterIp] = useState("");
  const [filterPath, setFilterPath] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [startDateObj, setStartDateObj] = useState<DateObject | null>(null);
  const [endDateObj, setEndDateObj] = useState<DateObject | null>(null);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchViews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getPageViews({
        page,
        limit: meta.limit,
        ip: filterIp.trim() || undefined,
        path: filterPath.trim() || undefined,
        sessionId: filterSession.trim() || undefined,
        userId: filterUserId.trim() || undefined,
        startDate: startDateObj?.toDate().toISOString() || undefined,
        endDate: endDateObj?.toDate().toISOString() || undefined,
        sortBy: "createdAt",
        sortOrder,
      });

      if (!data.success)
        throw new Error(data.message || "خطا در دریافت لاگ ترافیک");
      setViews(data.data);
      setMeta(data.meta);
    } catch (err: any) {
      setError(err.message || "خطای شبکه");
      toast.error("دریافت ترافیک با خطا مواجه شد");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    filterIp,
    filterPath,
    filterSession,
    filterUserId,
    startDateObj,
    endDateObj,
    sortOrder,
    meta.limit,
  ]);

  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  const resetFilters = () => {
    setFilterIp("");
    setFilterPath("");
    setFilterSession("");
    setFilterUserId("");
    setStartDateObj(null);
    setEndDateObj(null);
    setSortOrder("desc");
    setPage(1);
  };

  const handleApplyFilters = () => {
    setPage(1);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            ترافیک سایت
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            بازدیدهای کاربران (شامل مهمان) به تفکیک IP، مسیر و نشست.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            پاک‌کردن فیلترها
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchViews}
            className="gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            به‌روزرسانی
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-xl shadow-card border border-border p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">فیلترهای پیشرفته</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* IP */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              IP
            </label>
            <Input
              placeholder="مثلاً 127.0.0.1"
              value={filterIp}
              onChange={(e) => setFilterIp(e.target.value)}
              className="dir-ltr text-left"
            />
          </div>

          {/* Path */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              مسیر
            </label>
            <Input
              placeholder="مثلاً /search"
              value={filterPath}
              onChange={(e) => setFilterPath(e.target.value)}
              className="dir-ltr text-left"
            />
          </div>

          {/* Session ID */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              شناسه نشست (Session)
            </label>
            <Input
              placeholder="Session ID"
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="dir-ltr text-left"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              شناسه کاربر
            </label>
            <Input
              placeholder="User ID"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            />
          </div>

          {/* Date from */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              از تاریخ
            </label>
            <DatePicker
              value={startDateObj}
              onChange={(date: DateObject | null) => setStartDateObj(date)}
              calendar={persian}
              locale={persian_fa}
              format="YYYY/MM/DD"
              placeholder="انتخاب تاریخ"
              className="w-full border border-input rounded-lg p-2 text-sm bg-background"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              تا تاریخ
            </label>
            <DatePicker
              value={endDateObj}
              onChange={(date: DateObject | null) => setEndDateObj(date)}
              calendar={persian}
              locale={persian_fa}
              format="YYYY/MM/DD"
              placeholder="انتخاب تاریخ"
              className="w-full border border-input rounded-lg p-2 text-sm bg-background"
            />
          </div>

          {/* Sort order */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              مرتب‌سازی
            </label>
            <Select
              value={sortOrder}
              onValueChange={(v) => setSortOrder(v as "asc" | "desc")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">جدیدترین</SelectItem>
                <SelectItem value="asc">قدیمی‌ترین</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apply button */}
          <div className="flex items-end">
            <Button onClick={handleApplyFilters} className="w-full gap-1">
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
          <Button variant="link" onClick={fetchViews} className="text-destructive">
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
                <TableHead className="text-right">زمان</TableHead>
                <TableHead className="text-right">IP</TableHead>
                <TableHead className="text-right">مسیر</TableHead>
                <TableHead className="text-right">Referrer</TableHead>
                <TableHead className="text-right">کاربر</TableHead>
                <TableHead className="text-right">Session</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : views.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Globe className="w-8 h-8 opacity-50" />
                      <p>هیچ بازدیدی یافت نشد</p>
                      <p className="text-sm">
                        چند صفحه از سایت را باز کنید یا با فیلترهای دیگر جستجو کنید.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                views.map((v) => (
                  <TableRow key={v._id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleString("fa-IR")}
                    </TableCell>
                    <TableCell className="text-sm dir-ltr text-left">
                      {v.ip}
                    </TableCell>
                    <TableCell className="text-sm dir-ltr text-left">
                      {v.path}
                    </TableCell>
                    <TableCell className="text-sm dir-ltr text-left max-w-[200px] truncate" title={v.referrer || ""}>
                      {v.referrer || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {v.user
                        ? `${v.user.firstName || ""} ${v.user.lastName || ""}`
                        : "مهمان"}
                    </TableCell>
                    <TableCell className="text-sm dir-ltr text-left">
                      {v.sessionId?.substring(0, 8)}…
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-between items-center bg-card rounded-xl shadow-card border border-border p-4">
          <span className="text-sm text-muted-foreground">
            صفحه {meta.page} از {meta.totalPages} | کل: {meta.total} بازدید
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              قبلی
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}