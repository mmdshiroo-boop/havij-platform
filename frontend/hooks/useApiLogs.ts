import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  developerApi,
  LogEntry,
  LogPagination,
  LogAnalytics,
} from "@/services/api/developer.api";

export function useApiLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<LogPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    page: number;
    limit: number;
    method?: string;
    status?: string;
    search?: string;
  }>({
    page: 1,
    limit: 20,
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await developerApi.getLogs(filters);
      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch {
      toast.error("خطا در دریافت لاگ‌ها");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const setFilter = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, page: 1, [key]: value || undefined }));
  };

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return {
    logs,
    pagination,
    loading,
    filters,
    setFilter,
    setPage,
    refetch: fetchLogs,
  };
}

export function useLogAnalytics(days: number = 7) {
  const [analytics, setAnalytics] = useState<LogAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDays, setActiveDays] = useState(days);

  const fetchAnalytics = useCallback(async (d: number) => {
    try {
      setLoading(true);
      const { data } = await developerApi.getLogAnalytics(d);
      setAnalytics(data);
    } catch {
      toast.error("خطا در دریافت آنالیتیکس");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(activeDays);
  }, [activeDays, fetchAnalytics]);

  const changeDays = (d: number) => {
    setActiveDays(d);
  };

  const clearOldLogs = async (beforeDays: number = 30) => {
    try {
      const { data } = await developerApi.clearLogs(beforeDays);
      toast.success(data.message);
      fetchAnalytics(activeDays);
      return data;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "خطا در پاک کردن لاگ‌ها");
      throw e;
    }
  };

  return {
    analytics,
    loading,
    activeDays,
    changeDays,
    clearOldLogs,
    refetch: () => fetchAnalytics(activeDays),
  };
}
