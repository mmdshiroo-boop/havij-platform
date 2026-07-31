// app/panel/developer/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  Activity,
  Key,
  Zap,
  AlertTriangle,
  Server,
  Database,
  ArrowUpRight,
  Terminal,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  BookOpen,
  KeyRound,
  Webhook,
  RefreshCw,
  AlertCircle,
  Shield,
  Code2,
} from "lucide-react";
import { developerApi, DashboardStats } from "@/services/api/developer.api";
import { Skeleton } from "@/components/ui/skeleton";

// ---------- types ----------
interface RawLogEntry {
  _id: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  ip?: string;
  timestamp: string;
}

interface ApiLog {
  method: string;
  endpoint: string;
  status: number;
  time: string;
}

interface ServiceStatus {
  name: string;
  status: string;
  ok: boolean;
}

// ---------- helpers ----------
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num?.toString() || "0";
}

function formatUptime(seconds: string): string {
  const s = parseInt(seconds) || 0;
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days} روز ${hours} ساعت`;
  if (hours > 0) return `${hours} ساعت ${minutes} دقیقه`;
  return `${minutes} دقیقه`;
}

const getServiceIcon = (name: string) => {
  switch (name) {
    case "MongoDB Primary":
      return Database;
    case "Redis Cache":
      return Zap;
    case "Socket.io Server":
      return Wifi;
    default:
      return Server;
  }
};

// ---------- animations ----------
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const quickActions = [
  {
    title: "مستندات Swagger",
    desc: "مشاهده و تست مستقیم APIها",
    icon: BookOpen,
    href: "/panel/developer/docs",
  },
  {
    title: "ایجاد کلید جدید",
    desc: "تولید API Key با دسترسی محدود",
    icon: KeyRound,
    href: "/panel/developer/api-key",
  },
  {
    title: "تنظیمات Webhook",
    desc: "مدیریت رویدادهای ارسالی",
    icon: Webhook,
    href: "/panel/developer/webhooks",
  },
];

export default function DeveloperDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([]);

  // ---------- data fetching ----------
  const fetchDashboardData = useCallback(async () => {
    try {
      const { data } = await developerApi.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      if (err?.response?.status === 401) {
        setError("لطفاً دوباره وارد شوید. توکن منقضی شده است.");
      } else if (err?.response?.status === 403) {
        setError(
          "شما دسترسی توسعه‌دهنده ندارید. نقش شما باید developer یا admin باشد.",
        );
      } else {
        setError(
          err?.response?.data?.error || err.message || "خطا در دریافت اطلاعات",
        );
      }
    }
  }, []);

  const fetchRecentLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { data } = await developerApi.getLogs({ limit: 5 });
      const logs: RawLogEntry[] = data.logs || [];
      setRecentLogs(
        logs.map((l) => ({
          method: l.method,
          endpoint: l.endpoint,
          status: l.statusCode,
          time: `${l.responseTime}ms`,
        })),
      );
    } catch {
      setRecentLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchServicesStatus = useCallback(async () => {
    try {
      const { data } = await developerApi.getServicesStatus();
      setServices(data.services || []);
    } catch {
      setServices([
        { name: "MongoDB Primary", status: "Unknown", ok: false },
        { name: "Redis Cache", status: "Unknown", ok: false },
        { name: "Socket.io Server", status: "Unknown", ok: false },
      ]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchRecentLogs(),
        fetchServicesStatus(),
      ]);
      setLoading(false);
    };
    load();
  }, [fetchDashboardData, fetchRecentLogs, fetchServicesStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchRecentLogs(),
      fetchServicesStatus(),
    ]);
    setRefreshing(false);
  };

  // ---------- render states ----------
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center p-4"
        dir="rtl"
      >
        <Card className="max-w-md w-full border-destructive/20 shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">خطا در بارگذاری</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              onClick={handleRefresh}
              className="gap-2 rounded-xl bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = {
    totalRequests: stats?.totalRequests ?? 0,
    activeKeys: stats?.activeKeys ?? 0,
    webhooks: stats?.webhooks ?? 0,
    successRate: stats?.successRate ?? 0,
    cpuUsage: stats?.cpuUsage ?? 0,
    memoryUsage: stats?.memoryUsage ?? 0,
    serverUptime: stats?.serverUptime ?? "0",
    databaseSize: stats?.databaseSize ?? "نامشخص",
    totalUsers: stats?.totalUsers ?? 0,
    totalAds: stats?.totalAds ?? 0,
    totalViews: stats?.totalViews ?? 0,
    pendingAds: stats?.pendingAds ?? 0,
  };

  const isAdmin = s.totalUsers > 0;

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
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                داشبورد توسعه‌دهندگان
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مانیتورینگ لحظه‌ای API و وضعیت سرورها
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold gap-1.5 shadow-sm shadow-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
              </span>
              API: فعال
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
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

      {/* ===== Error Banner ===== */}
      {error && stats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        </motion.div>
      )}

      {/* ===== Stat Cards ===== */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants} className="h-full">
          <StatCard
            title="کل درخواست‌ها"
            value={formatNumber(s.totalRequests)}
            icon={Activity}
            trend={
              s.totalRequests > 0
                ? { value: "+۱۲٪", isPositive: true }
                : undefined
            }
            href="/panel/developer/stats"
            colorVariant="orange"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <StatCard
            title="کلیدهای فعال"
            value={s.activeKeys.toString()}
            icon={Key}
            href="/panel/developer/api-key"
            colorVariant="orange"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <StatCard
            title="نرخ موفقیت"
            value={`${s.successRate}%`}
            icon={Zap}
            description="درصد پاسخ‌های موفق"
            href="/panel/developer/stats"
            colorVariant="orange"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <StatCard
            title="وب‌هوک‌ها"
            value={s.webhooks.toString()}
            icon={Webhook}
            description="وب‌هوک فعال"
            href="/panel/developer/webhooks"
            colorVariant="orange"
          />
        </motion.div>
      </motion.div>

      {/* ===== Admin Extra Stats ===== */}
      {isAdmin && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={itemVariants} className="h-full">
            <StatCard
              title="کل کاربران"
              value={formatNumber(s.totalUsers)}
              icon={Activity}
              href="/panel/admin/users"
              colorVariant="orange"
            />
          </motion.div>
          <motion.div variants={itemVariants} className="h-full">
            <StatCard
              title="کل آگهی‌ها"
              value={formatNumber(s.totalAds)}
              icon={Key}
              href="/panel/admin/ads"
              colorVariant="orange"
            />
          </motion.div>
          <motion.div variants={itemVariants} className="h-full">
            <StatCard
              title="بازدید کل"
              value={formatNumber(s.totalViews)}
              icon={Zap}
              href="/panel/admin/stats"
              colorVariant="orange"
            />
          </motion.div>
          <motion.div variants={itemVariants} className="h-full">
            <StatCard
              title="آگهی‌های در انتظار"
              value={s.pendingAds.toString()}
              icon={AlertTriangle}
              description="نیاز به بررسی"
              href="/panel/admin/ads?status=pending"
              colorVariant="orange"
            />
          </motion.div>
        </motion.div>
      )}

      {/* ===== Logs + Infrastructure Row ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent API requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/20 bg-muted/5">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                  <Terminal className="w-4 h-4" />
                </div>
                آخرین درخواست‌های API
              </CardTitle>
              <Link href="/panel/developer/logs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                >
                  مشاهده همه
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <div className="grid grid-cols-5 gap-2 p-4 bg-muted/20 text-xs font-bold text-muted-foreground border-b border-border/20">
                    <span className="col-span-1">متد</span>
                    <span className="col-span-2">مسیر</span>
                    <span className="col-span-1 text-center">وضعیت</span>
                    <span className="col-span-1 text-left">زمان</span>
                  </div>
                  {logsLoading ? (
                    <div className="p-8 text-center">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : recentLogs.length > 0 ? (
                    recentLogs.map((log, i) => (
                      <Link
                        key={i}
                        href="/panel/developer/logs"
                        className="grid grid-cols-5 gap-2 p-4 border-b border-border/10 text-sm items-center hover:bg-primary/5 transition-colors font-mono group"
                      >
                        <span className="col-span-1 font-bold text-foreground/80 text-xs">
                          {log.method}
                        </span>
                        <span className="col-span-2 text-muted-foreground text-xs truncate">
                          {log.endpoint}
                        </span>
                        <span className="col-span-1 flex justify-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 rounded-md font-mono ${
                              log.status >= 200 && log.status < 300
                                ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10"
                                : log.status >= 400
                                  ? "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-500/10"
                                  : "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10"
                            }`}
                          >
                            {log.status}
                          </Badge>
                        </span>
                        <span
                          className={`col-span-1 text-left text-xs ${parseInt(log.time) > 500 ? "text-red-500 font-bold" : "text-muted-foreground"}`}
                        >
                          {log.time}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="p-12 text-center text-muted-foreground">
                      <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">
                        هنوز لاگی ثبت نشده است
                      </p>
                      <p className="text-xs">
                        درخواست‌های API در اینجا نمایش داده می‌شوند
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Infrastructure status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="h-full"
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all rounded-2xl h-full bg-card">
            <CardHeader className="pb-2 border-b border-border/20 bg-muted/5">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                  <Server className="w-4 h-4" />
                </div>
                وضعیت زیرساخت
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Uptime & Database */}
              <div className="grid grid-cols-2 gap-3">
                {s.serverUptime !== "0" && (
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      آپتایم
                    </p>
                    <p className="text-sm font-bold mt-0.5">
                      {formatUptime(s.serverUptime)}
                    </p>
                  </div>
                )}
                {s.databaseSize !== "نامشخص" && (
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-primary" />
                      دیتابیس
                    </p>
                    <p className="text-sm font-bold mt-0.5">{s.databaseSize}</p>
                  </div>
                )}
              </div>

              {/* CPU Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    CPU
                  </span>
                  <span className="font-bold text-sm">{s.cpuUsage}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      s.cpuUsage > 80
                        ? "bg-gradient-to-r from-red-400 to-red-500"
                        : "bg-gradient-to-r from-primary/70 to-primary"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(s.cpuUsage, 100)}%` }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                </div>
              </div>

              {/* RAM Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-primary" />
                    RAM
                  </span>
                  <span className="font-bold text-sm">{s.memoryUsage} MB</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      s.memoryUsage > 2000
                        ? "bg-gradient-to-r from-red-400 to-red-500"
                        : "bg-gradient-to-r from-amber-400 to-primary"
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((s.memoryUsage / 4096) * 100, 100)}%`,
                    }}
                    transition={{ duration: 1, delay: 1 }}
                  />
                </div>
              </div>

              {/* Services */}
              <div className="border-t border-border/30 pt-4 space-y-2.5">
                <p className="text-xs font-bold text-muted-foreground">
                  سرویس‌ها
                </p>
                {services.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    در حال دریافت وضعیت...
                  </div>
                ) : (
                  services.map((svc, i) => {
                    const IconComp = getServiceIcon(svc.name);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-muted/10 border border-border/30"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <IconComp className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            {svc.name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2.5 py-0 rounded-md ${
                            svc.ok
                              ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10"
                              : "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10"
                          }`}
                        >
                          {svc.status}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== Quick Actions ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {quickActions.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
          >
            <Link href={a.href} className="block h-full">
              <Button
                variant="outline"
                className="w-full h-full min-h-[110px] py-4 flex flex-col items-center justify-center gap-2.5 text-center border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group rounded-2xl"
              >
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <a.icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div>
                  <span className="font-bold text-sm block text-foreground">
                    {a.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {a.desc}
                  </span>
                </div>
              </Button>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
