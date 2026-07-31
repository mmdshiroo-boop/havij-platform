"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  adminPanelApi,
  AdminDashboardStats,
} from "@/services/api/admin-panel.api";

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
      // دریافت آمار
      const dashboardStats = await adminPanelApi.getDashboardStats();
      setStats(dashboardStats);

      // دریافت آخرین آگهی‌ها
      const adsRes = await adminPanelApi.getAllAds({ limit: 5 });
      setRecentAds(adsRes.data || []);
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      if (err.response?.status === 403) {
        setError("شما دسترسی ادمین ندارید. لطفاً با مدیر سیستم تماس بگیرید.");
      } else {
        setError("خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.");
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

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6" dir="rtl">
        <Skeleton className="h-20 sm:h-24 rounded-xl sm:rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-28 sm:h-32 rounded-xl sm:rounded-2xl"
            />
          ))}
        </div>
        <Skeleton className="h-80 sm:h-96 rounded-xl sm:rounded-2xl" />
      </div>
    );
  }

  if (error && stats.totalUsers === 0 && stats.totalAds === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        dir="rtl"
      >
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-muted-foreground font-medium">{error}</p>
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
    <div className="space-y-4 sm:space-y-6 md:space-y-8" dir="rtl">
      {/* هدر خوش‌آمدگویی */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 sm:p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-primary/20 rounded-full blur-2xl sm:blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              داشبورد مدیریت
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              خوش آمدید. امروز{" "}
              {new Date().toLocaleDateString("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="flex items-center gap-2 mt-3 sm:mt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center"
                  >
                    <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  </div>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="font-bold text-foreground">
                  {stats.activeUsers}
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
            className="gap-2 rounded-xl self-end sm:self-auto"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            بروزرسانی
          </Button>
        </div>
      </motion.div>

      {/* کارت‌های آماری با StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="کل کاربران"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            href="/admin/users"
            description={`${stats.activeUsers} کاربر فعال`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="کل آگهی‌ها"
            value={stats.totalAds.toLocaleString()}
            icon={FileText}
            href="/admin/ads"
            description={`${stats.publishedAds} آگهی منتشر شده`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            title="کل بازدیدها"
            value={stats.totalViews.toLocaleString()}
            icon={Eye}
            description="بازدید کل آگهی‌ها"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCard
            title="در انتظار تأیید"
            value={stats.pendingAds.toLocaleString()}
            icon={Clock}
            href="/admin/ads?status=pending"
            description="نیاز به بررسی"
          />
        </motion.div>
      </div>

      {/* آخرین آگهی‌ها */}
      <Card className="border-0 shadow-md">
        <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg">
            آخرین آگهی‌های ثبت شده
          </CardTitle>
          <Link href="/admin/ads">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs sm:text-sm"
            >
              مشاهده همه
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-2 sm:space-y-3">
            {recentAds.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-sm sm:text-base">هیچ آگهی یافت نشد</p>
              </div>
            ) : (
              recentAds.map((ad, i) => (
                <motion.div
                  key={ad._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {ad.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {ad.views || 0} بازدید
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right sm:text-left shrink-0">
                    <p className="font-bold text-primary text-sm sm:text-base">
                      {ad.price?.toLocaleString()} تومان
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {ad.city}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
