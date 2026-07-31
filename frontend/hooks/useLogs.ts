// frontend/hooks/useLogs.ts
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  logService,
  SystemLog,
  GetLogsParams,
} from "@/services/api/logService"; // ✅ اصلاح نام‌ها

// ✅ تایپ دلخواه برای فیلترهای اضافی (در UI)
interface ExtendedFilters extends GetLogsParams {
  search?: string;
  status?: string;
}

export const useLogs = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]); // ✅ SystemLog به‌جای Log
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // فیلترهای پیشرفته (شامل فیلدهای API + فیلدهای UI)
  const [filters, setFilters] = useState<ExtendedFilters>({
    search: "",
    status: "all",
    page: 1,
    limit: 20,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // فقط پارامترهای مجاز را به API ارسال کن
      const apiParams: GetLogsParams = {
        page: filters.page,
        limit: filters.limit,
        level: filters.status === "all" ? undefined : filters.status,
      };
      const response = await logService.getLogs(apiParams);
      const data: SystemLog[] = response.data || [];
      // اگر نیاز به فیلتر search داری، اینجا انجام بده
      const filtered = filters.search
        ? data.filter(
            (log) =>
              log.message.includes(filters.search!) ||
              (log.source && log.source.includes(filters.search!)),
          )
        : data;
      setLogs(filtered);
      setTotalCount(filtered.length);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      toast.error("خطا در دریافت لاگ‌ها", {
        description: error.response?.data?.message || "مجددا تلاش کنید",
      });
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSearch = (search: string) => {
    setFilters((prev: any) => ({ ...prev, search, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev: any) => ({
      ...prev,
      status: status === "all" ? undefined : status,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev: any) => ({ ...prev, page }));
  };

  const handleClearLogs = async () => {
    try {
      await logService.clearLogs();
      toast.success("لاگ‌ها با موفقیت پاک شدند");
      fetchLogs();
    } catch (error: any) {
      toast.error("خطا در پاک کردن لاگ‌ها", {
        description:
          error.response?.data?.message || "دسترسی ندارید یا خطایی رخ داده",
      });
    }
  };

  // ⚠️ تابع exportLogs در logService موجود نیست – موقتاً غیرفعال می‌کنیم
  const handleExportLogs = async () => {
    toast.info("قابلیت خروجی گرفتن به زودی اضافه می‌شود");
    // در صورت نیاز می‌توانی بعداً پیاده‌سازی کنی
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    totalCount,
    currentPage: filters.page || 1,
    filters,
    handleSearch,
    handleStatusFilter,
    handlePageChange,
    handleClearLogs,
    handleExportLogs,
    refetch: fetchLogs,
  };
};
