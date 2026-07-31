"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoCardStatic, InfoCard } from "@/components/ui/info-card";
import {
  Building,
  Users,
  TrendingUp,
  Eye,
  PlusCircle,
  Calendar,
  MapPin,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  FileText,
  Home,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { adsApi, Ad } from "@/services/api/ads.api";
import { agentApi, Agent } from "@/services/api/agent.api";

// ==================== Types ====================
interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  pendingProperties: number;
  soldProperties: number;
  totalAgents: number;
  totalViews: number;
  totalDeals: number;
  monthlyGrowth: number;
  totalRevenue: number;
  conversionRate: number;
}

// ==================== Utilities ====================
const formatPrice = (price: number): string => {
  if (!price || price === 0) return "توافقی";
  if (price >= 1_000_000_000) {
    return (price / 1_000_000_000).toFixed(1) + " میلیارد تومان";
  }
  return price.toLocaleString("fa-IR") + " تومان";
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: {
      label: "فعال",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    },
    pending: {
      label: "در انتظار",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    },
    sold: {
      label: "فروخته شده",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    },
    rejected: {
      label: "رد شده",
      className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    },
    expired: {
      label: "منقضی",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
    },
  };

  const config = statusConfig[status] || {
    label: status,
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
};

// ==================== Main Component ====================
export default function AgentDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeProperties: 0,
    pendingProperties: 0,
    soldProperties: 0,
    totalAgents: 0,
    totalViews: 0,
    totalDeals: 0,
    monthlyGrowth: 0,
    totalRevenue: 0,
    conversionRate: 0,
  });

  const [recentAds, setRecentAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== Fetch Data ====================
  const fetchDashboardData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const adsResponse = await adsApi.getMyAds({ limit: 100 });
        const ads: Ad[] = adsResponse.data || [];

        let agents: Agent[] = [];
        try {
          agents = await agentApi.getAgents();
        } catch (agentError) {
          console.warn("Could not fetch agents:", agentError);
        }

        let statsData: any = {};
        try {
          const statsResponse = await agentApi.getStats();
          statsData = statsResponse || {};
        } catch (statsError) {
          console.warn("Could not fetch stats:", statsError);
        }

        const activeAds = ads.filter((ad) => ad.status === "active").length;
        const pendingAds = ads.filter((ad) => ad.status === "pending").length;
        const soldAds = ads.filter((ad) => ad.status === "sold").length;
        const totalViews = ads.reduce((sum, ad) => sum + (ad.views || 0), 0);
        const totalRevenue = ads
          .filter((ad) => ad.status === "sold")
          .reduce((sum, ad) => sum + (ad.price || 0), 0);
        const conversionRate =
          ads.length > 0 ? Math.round((soldAds / ads.length) * 100) : 0;

        setStats({
          totalProperties: ads.length,
          activeProperties: activeAds,
          pendingProperties: pendingAds,
          soldProperties: soldAds,
          totalAgents: agents.length,
          totalViews: totalViews,
          totalDeals: soldAds,
          monthlyGrowth: statsData.monthlyGrowth || 0,
          totalRevenue: totalRevenue,
          conversionRate: conversionRate,
        });

        const sortedAds = [...ads]
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 5);

        setRecentAds(sortedAds);
      } catch (error: any) {
        console.error("❌ Error fetching dashboard data:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "خطا در دریافت اطلاعات داشبورد";

        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ==================== Handle Refresh ====================
  const handleRefresh = () => {
    fetchDashboardData(true);
    toast.success("اطلاعات داشبورد بروزرسانی شد");
  };

  // ==================== Memoized Stats ====================
  const formattedStats = useMemo(() => {
    return {
      totalProperties: stats.totalProperties.toLocaleString("fa-IR"),
      activeProperties: stats.activeProperties.toLocaleString("fa-IR"),
      pendingProperties: stats.pendingProperties.toLocaleString("fa-IR"),
      soldProperties: stats.soldProperties.toLocaleString("fa-IR"),
      totalAgents: stats.totalAgents.toLocaleString("fa-IR"),
      totalViews: stats.totalViews.toLocaleString("fa-IR"),
      totalDeals: stats.totalDeals.toLocaleString("fa-IR"),
      totalRevenue: formatPrice(stats.totalRevenue),
      conversionRate: `${stats.conversionRate}%`,
    };
  }, [stats]);

  // ==================== Loading State ====================
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  // ==================== Error State ====================
  if (error && stats.totalProperties === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] p-8"
        dir="rtl"
      >
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">خطا در بارگذاری اطلاعات</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {error}
        </p>
        <Button onClick={handleRefresh} className="gap-2 rounded-xl">
          <RefreshCw className="w-4 h-4" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  // ==================== Main Render ====================
  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* ===== Header ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <Building className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                داشبورد آژانس
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مدیریت آگهی‌ها و مشاوران خود را از اینجا پیگیری کنید
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/5 rounded-xl"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "در حال بروزرسانی..." : "بروزرسانی"}
          </Button>
        </div>
      </div>

      {/* ===== Main Stats (4 cards) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<Building className="w-5 h-5" />}
            title="کل آگهی‌ها"
            value={formattedStats.totalProperties}
            subtitle={`${formattedStats.activeProperties} فعال`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<Users className="w-5 h-5" />}
            title="مشاوران"
            value={formattedStats.totalAgents}
            subtitle="اعضای آژانس"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<Eye className="w-5 h-5" />}
            title="کل بازدیدها"
            value={formattedStats.totalViews}
            subtitle="بازدید آگهی‌ها"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<TrendingUp className="w-5 h-5" />}
            title="معاملات موفق"
            value={formattedStats.totalDeals}
            subtitle={`نرخ تبدیل ${formattedStats.conversionRate}`}
          />
        </motion.div>
      </div>

      {/* ===== Secondary Stats (3 cards) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<Home className="w-5 h-5" />}
            title="آگهی‌های فعال"
            value={formattedStats.activeProperties}
            subtitle={`${formattedStats.pendingProperties} در انتظار تأیید`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<DollarSign className="w-5 h-5" />}
            title="درآمد کل"
            value={formattedStats.totalRevenue}
            subtitle={`از ${formattedStats.totalDeals} معامله`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<Activity className="w-5 h-5" />}
            title="نرخ تبدیل"
            value={formattedStats.conversionRate}
            subtitle="بازدید به معامله"
          />
        </motion.div>
      </div>

      {/* ===== Quick Actions ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/panel/agent/ads/create" className="block">
          <InfoCard
            icon={<PlusCircle className="w-5 h-5" />}
            title="ثبت آگهی جدید"
            description="ملک جدیدی به فهرست خود اضافه کنید"
          />
        </Link>
        <Link href="/panel/agent/my-ads" className="block">
          <InfoCard
            icon={<FileText className="w-5 h-5" />}
            title="مدیریت آگهی‌ها"
            description="مشاهده و ویرایش آگهی‌های ثبت‌شده"
          />
        </Link>
      </div>

      {/* ===== Recent Ads ===== */}
      <Card className="transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent shadow-sm hover:shadow-md border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            آخرین آگهی‌های ثبت شده
          </CardTitle>
          <Link href="/panel/agent/my-ads">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-primary rounded-xl text-xs"
            >
              مشاهده همه
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentAds.length > 0 ? (
            <div className="space-y-3">
              {recentAds.map((ad, index) => (
                <motion.div
                  key={ad._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors border border-border/30 gap-3 cursor-pointer group"
                  onClick={() => window.open(`/ads/${ad._id}`, "_blank")}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {ad.images && ad.images.length > 0 && (
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border/30">
                        <img
                          src={ad.images[0]}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {ad.title}
                        </p>
                        {ad.status && getStatusBadge(ad.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ad.city || "نامشخص"}
                        </span>
                        {ad.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(ad.createdAt)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {ad.views || 0} بازدید
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center w-full sm:w-auto justify-between sm:justify-end">
                    <p className="font-bold text-primary text-sm whitespace-nowrap">
                      {formatPrice(ad.price)}
                    </p>
                    <Link
                      href={`/panel/agent/ads/${ad._id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-semibold mb-2">
                هنوز آگهی ثبت نکرده‌اید
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                اولین آگهی خود را ثبت کنید تا در معرض دید مشتریان قرار بگیرد
              </p>
              <Link href="/panel/agent/ads/create">
                <Button className="gap-2 rounded-xl" size="lg">
                  <PlusCircle className="w-5 h-5" />
                  ثبت آگهی جدید
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
