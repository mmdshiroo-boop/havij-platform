"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  Eye,
  Clock,
  UserCheck,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  RefreshCw,
  TrendingUp,
  MapPin,
  ImageIcon,
  CheckCircle,
  XCircle,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  adminPanelApi,
  AdminDashboardStats,
} from "@/services/api/admin-panel.api";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/getImageUrl";


const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<any> }
> = {
  active: {
    label: "منتشرشده",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle,
  },
  pending: {
    label: "در انتظار",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  rejected: {
    label: "رد شده",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: XCircle,
  },
  expired: {
    label: "منقضی",
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: Clock,
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  href?: string;
  trend?: number;
  color?: string;
}

function DashboardStatCard({
  title,
  value,
  icon: Icon,
  description,
  href,
  trend,
  color = "text-primary",
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 sm:p-5",
        "shadow-sm hover:shadow-md transition-all duration-300",
        "group",
        href && "cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {title}
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground mt-1 tabular-nums">
            {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
          </p>
          {description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5">
              {description}
            </p>
          )}
          {trend !== undefined && trend !== 0 && (
            <div
              className={cn(
                "flex items-center gap-1 mt-2 text-[10px] sm:text-xs font-bold",
                trend > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500",
              )}
            >
              <TrendingUp
                className={cn(
                  "w-3 h-3",
                  trend < 0 && "rotate-180",
                )}
              />
              {Math.abs(trend)}% نسبت به ماه قبل
            </div>
          )}
        </div>

        <div
          className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
            "bg-primary/10 group-hover:bg-primary/15 transition-colors",
          )}
        >
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
        </div>
      </div>

      {href && (
        <div className="absolute bottom-2 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      <Skeleton className="h-28 sm:h-32 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 sm:h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalAds: 0,
    totalViews: 0,
    pendingAds: 0,
    activeUsers: 0,
    publishedAds: 0,
    userGrowth: 0,
    adGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentAds, setRecentAds] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const dashboardStats = await adminPanelApi.getDashboardStats();
      setStats(dashboardStats);

      const adsRes = await adminPanelApi.getAllAds({ limit: 6 });
      setRecentAds(adsRes.data || []);
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      if (err.response?.status === 403) {
        setError("شما دسترسی ادمین ندارید.");
      } else {
        setError("خطا در دریافت اطلاعات.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData(true);
    toast.success("داشبورد به‌روزرسانی شد");
  };

  if (loading) return <DashboardSkeleton />;

  if (error && stats.totalUsers === 0 && stats.totalAds === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4"
        dir="rtl"
      >
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button
          onClick={() => fetchData(true)}
          variant="outline"
          className="gap-2 rounded-xl"
        >
          <RefreshCw className="w-4 h-4" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8 pb-8" dir="rtl">
      {/* ═══ هدر ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-primary/5 dark:from-primary/5 dark:via-background dark:to-primary/3 p-5 sm:p-6 lg:p-8"
      >
        <div className="absolute -top-20 -left-20 w-52 h-52 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground">
                داشبورد مدیریت
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              {new Date().toLocaleDateString("fa-IR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex -space-x-1.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">
                  {stats.activeUsers.toLocaleString("fa-IR")}
                </span>{" "}
                کاربر فعال
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 rounded-xl self-start sm:self-auto text-xs font-bold"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", refreshing && "animate-spin")}
            />
            بروزرسانی
          </Button>
        </div>
      </motion.div>

      {/* ═══ کارت‌های آماری ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <DashboardStatCard
            title="کل کاربران"
            value={stats.totalUsers}
            icon={Users}
            href="/panel/admin/users"
            description={`${stats.activeUsers.toLocaleString("fa-IR")} فعال`}
            trend={stats.userGrowth}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <DashboardStatCard
            title="کل آگهی‌ها"
            value={stats.totalAds}
            icon={FileText}
            href="/panel/admin/ads"
            description={`${stats.publishedAds.toLocaleString("fa-IR")} منتشرشده`}
            trend={stats.adGrowth}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DashboardStatCard
            title="بازدید کل"
            value={stats.totalViews}
            icon={Eye}
            description="مجموع بازدید آگهی‌ها"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
        >
          <DashboardStatCard
            title="در انتظار تأیید"
            value={stats.pendingAds}
            icon={Clock}
            href="/panel/admin/ads?status=pending"
            description="نیاز به بررسی"
            color="text-amber-500"
          />
        </motion.div>
      </div>

      {/* ═══ آخرین آگهی‌ها ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <Card className="border border-border/60 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 lg:p-6 flex flex-row items-center justify-between border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-sm sm:text-base font-extrabold">
                آخرین آگهی‌ها
              </CardTitle>
            </div>
            <Link href="/panel/admin/ads">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
              >
                مشاهده همه
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 lg:p-5">
            {recentAds.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">هیچ آگهی یافت نشد</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-2.5">
                <AnimatePresence>
                  {recentAds.map((ad, i) => {
                    const firstImage = ad.images?.[0];
                    const imgSrc = firstImage
                      ? getImageUrl(firstImage)
                      : null;
                    const statusInfo =
                      STATUS_MAP[ad.status] || STATUS_MAP.pending;
                    const StatusIcon = statusInfo.icon;

                    return (
                      <motion.div
                        key={ad._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link
                          href={`/ad/${ad._id}`}
                          className="block"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border/40 bg-background hover:bg-muted/30 hover:border-primary/20 transition-all group">
                            {/* تصویر آگهی */}
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden bg-muted/30 shrink-0">
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={ad.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                                </div>
                              )}

                              {ad.isUrgent && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                  فوری
                                </span>
                              )}
                            </div>

                            {/* اطلاعات آگهی */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                  {ad.title}
                                </h4>

                                {/* وضعیت */}
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] sm:text-[10px] font-bold shrink-0 gap-1 px-1.5 py-0.5 rounded-lg",
                                    statusInfo.color,
                                  )}
                                >
                                  <StatusIcon className="w-2.5 h-2.5" />
                                  {statusInfo.label}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                                {ad.city && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {ad.city}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {(ad.views || 0).toLocaleString("fa-IR")}
                                </span>
                              </div>
                            </div>

                            {/* قیمت */}
                            <div className="text-left shrink-0 hidden sm:block">
                              <p className="text-xs sm:text-sm font-black text-foreground">
                                {ad.price
                                  ? `${ad.price.toLocaleString("fa-IR")} تومان`
                                  : "توافقی"}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}