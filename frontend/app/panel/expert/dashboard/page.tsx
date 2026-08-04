"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
  ArrowUpRight,
  MapPin,
  Timer,
  Activity,
  BarChart3,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  expertApi,
  ExpertStats,
  PendingAd,
  PendingReport,
} from "@/services/api/expert.api";
import { StatCard } from "@/components/ui/stat-card";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";

// ─── helpers ───────────────────────────
const formatPrice = (price: number) => {
  if (!price) return "توافقی";
  if (price >= 1e9) return `${(price / 1e9).toFixed(1)} میلیارد تومان`;
  if (price >= 1e6) return `${(price / 1e6).toFixed(0)} میلیون تومان`;
  return price.toLocaleString() + " تومان";
};

const getTimeAgo = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  if (diffHrs < 1) return "کمتر از ۱ ساعت";
  if (diffHrs < 24) return `${diffHrs} ساعت`;
  return `${Math.floor(diffHrs / 24)} روز`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

// ─── main component ─────────────────────
export default function ExpertDashboardPage() {
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([]);
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalRejected, setTotalRejected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsData, pendingRes, reportsRes, approvedRes, rejectedRes] =
        await Promise.all([
          expertApi.getStats(),
          expertApi.getPendingAds({ limit: 5 }),
          expertApi.getPendingReports({ limit: 5 }),
          expertApi.getApprovedAds({ limit: 5 }),
          expertApi.getRejectedAds({ limit: 5 }),
        ]);

      setStats(statsData);

      const pendingList = Array.isArray(pendingRes.data) ? pendingRes.data : [];
      setPendingAds(pendingList);

      const reportsList = Array.isArray(reportsRes.data) ? reportsRes.data : [];
      setReports(reportsList);

      setTotalApproved(approvedRes.pagination?.total ?? 0);
      setTotalRejected(rejectedRes.pagination?.total ?? 0);

      const approvedList = Array.isArray(approvedRes.data)
        ? approvedRes.data.map((a: any) => ({ ...a, status: "approved" }))
        : [];
      const rejectedList = Array.isArray(rejectedRes.data)
        ? rejectedRes.data.map((a: any) => ({ ...a, status: "rejected" }))
        : [];
      const combined = [...approvedList, ...rejectedList]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);
      setRecentActivity(combined);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("خطا در بارگذاری داده‌ها");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6 px-3 sm:px-6" dir="rtl">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const pendingCount = stats?.pendingAds ?? 0;
  const reviewedToday = stats?.reviewedToday ?? 0;
  const approvedToday = stats?.approvedToday ?? 0;
  const rejectedToday = stats?.rejectedToday ?? 0;
  const reportsPending = stats?.pendingReports ?? reports.length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-5 sm:p-6 border border-primary/20 shadow-md"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                پنل کارشناس
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {`${approvedToday} تأیید، ${rejectedToday} رد امروز`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="gap-1.5 rounded-xl border-border/60 hover:bg-muted self-end sm:self-auto"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            {refreshing ? "در حال بروزرسانی..." : "بروزرسانی"}
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <StatCard
          title="در انتظار تأیید"
          value={pendingCount.toLocaleString()}
          icon={Clock}
          href="/panel/expert/pending"
          colorVariant="amber"
          description="نیاز به بررسی"
        />
        <StatCard
          title="تأیید شده کل"
          value={totalApproved.toLocaleString()}
          icon={CheckCircle}
          href="/panel/expert/approved"
          colorVariant="emerald"
          description="تأییدشده‌ها"
        />
        <StatCard
          title="رد شده کل"
          value={totalRejected.toLocaleString()}
          icon={XCircle}
          href="/panel/expert/rejected"
          colorVariant="red"
          description="ردشده‌ها"
        />
        <StatCard
          title="گزارشات باز"
          value={reportsPending.toLocaleString()}
          icon={AlertTriangle}
          href="/panel/expert/reports"
          colorVariant="orange"
          description="در انتظار رسیدگی"
        />
      </motion.div>

      {/* محتوای اصلی */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* صف بررسی */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm h-full">
            <div className="flex flex-row items-center justify-between p-4 pb-2 border-b border-border/40 bg-muted/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> صف بررسی
              </h3>
              <Link href="/panel/expert/pending">
                <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-primary">
                  همه <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <CardContent className="p-4 space-y-2">
              {pendingAds.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400/40" />
                  همه آگهی‌ها بررسی شده‌اند
                </div>
              ) : (
                pendingAds.slice(0, 5).map((ad) => (
                  <Link
                    key={ad._id}
                    href={`/panel/expert/pending/${ad._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors group border border-border/30"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/30">
                      {ad.images?.[0] ? (
                        <img
                          src={getImageUrl(ad.images[0])}
                          className="w-full h-full object-cover"
                          alt={ad.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/user.webp";
                          }}
                        />
                      ) : (
                        <FileText className="w-5 h-5 m-2.5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                        {ad.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-primary/70" />
                          {ad.city}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Timer className="w-3 h-3 text-primary/70" />
                          {getTimeAgo(ad.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0">
                      {formatPrice(ad.price)}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* گزارشات */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm h-full">
            <div className="flex flex-row items-center justify-between p-4 pb-2 border-b border-border/40 bg-muted/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> گزارشات تخلف
              </h3>
              <Link href="/panel/expert/reports">
                <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-primary">
                  همه <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <CardContent className="p-4 space-y-2">
              {reports.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400/40" />
                  گزارش جدیدی وجود ندارد
                </div>
              ) : (
                reports.slice(0, 5).map((r) => (
                  <Link
                    key={r._id}
                    href={`/panel/expert/reports`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors group border border-border/30"
                  >
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {r.type || "تخلف"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.reporter?.firstName || r.reporter?.phone || "ناشناس"} •{" "}
                        {getTimeAgo(r.createdAt)}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* فعالیت‌های اخیر */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm h-full">
            <div className="p-4 pb-2 border-b border-border/40 bg-muted/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> فعالیت‌های اخیر
              </h3>
            </div>
            <CardContent className="p-4 space-y-1">
              {recentActivity.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  هنوز فعالیتی ثبت نشده
                </div>
              ) : (
                recentActivity.map((act) => (
                  <div
                    key={act._id}
                    className="flex items-center justify-between text-sm py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {act.status === "approved" ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <span className="truncate font-medium">{act.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      {getTimeAgo(act.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* خلاصه وضعیت */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm h-full">
            <div className="p-4 pb-2 border-b border-border/40 bg-muted/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> خلاصه وضعیت
              </h3>
            </div>
            <CardContent className="p-4 space-y-5">
              {[
                {
                  label: "در صف",
                  value: pendingCount,
                  color: "bg-amber-500",
                  textColor: "text-amber-600",
                },
                {
                  label: "تأیید شده",
                  value: totalApproved,
                  color: "bg-emerald-500",
                  textColor: "text-emerald-600",
                },
                {
                  label: "رد شده",
                  value: totalRejected,
                  color: "bg-red-500",
                  textColor: "text-red-600",
                },
                {
                  label: "گزارشات",
                  value: reportsPending,
                  color: "bg-orange-500",
                  textColor: "text-orange-600",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.label}
                    </span>
                    <span className={cn("text-sm font-bold", item.textColor)}>
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", item.color)}
                      style={{
                        width: `${Math.min(100, (item.value / (pendingCount + totalApproved + totalRejected + reportsPending || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}