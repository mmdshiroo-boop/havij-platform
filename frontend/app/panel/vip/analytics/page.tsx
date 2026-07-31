"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Zap,
  AlertCircle,
  RefreshCw,
  Crown,
  FileText,
  TrendingUp,
  Bookmark,
  LayoutGrid,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi, AdItem, ChartTimeline } from "@/services/api/analytics";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import apiClient from "@/services/api/client"; // ← اضافه شده

const kpiCardClass =
  "backdrop-blur-md bg-card/60 border border-border/40 shadow-md transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent";

const statusMap: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  active: {
    label: "فعال",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  pending: {
    label: "در انتظار",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  sold: {
    label: "فروخته شد",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  expired: {
    label: "منقضی",
    color: "text-muted-foreground bg-muted border-border",
    icon: <XCircle className="w-3 h-3" />,
  },
  rejected: {
    label: "رد شده",
    color: "text-destructive bg-destructive/10 border-destructive/20",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function VipAnalyticsPage() {
  const { user } = useAuth();

  const [selectedAdId, setSelectedAdId] = useState<string>("all");
  const [activePeriod, setActivePeriod] = useState<string>("7");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"views" | "bookmarks">("views");

  const [ads, setAds] = useState<any[]>([]); // ← واقعی از API
  const [adsList, setAdsList] = useState<AdItem[]>([]);
  const [chartData, setChartData] = useState<ChartTimeline[]>([]);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [myAdsCount, setMyAdsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    title: string;
    startDate?: string | null;
    endDate?: string | null;
  } | null>(null);

  // دریافت آگهی‌های واقعی کاربر
  const fetchUserAds = useCallback(async () => {
    try {
      const res = await apiClient.get("/ads/user/me");
      setAds(res.data.data || []);
    } catch (err) {
      console.error("Error fetching user ads:", err);
    }
  }, []);

  const fetchLiveAnalytics = useCallback(
    async (adId: string, period: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await analyticsApi.getUserOverview(adId, period);
        setTotalViews(data.totalViews || 0);
        setMyAdsCount(data.myAdsCount || 0);
        setAdsList(data.adsList || []);
        setChartData(data.chartTimeline?.length ? data.chartTimeline : []);

        if (data.subscriptionDetails) {
          setSubscriptionDetails({
            title: data.subscriptionDetails.title || "اشتراک VIP",
            startDate: (data.subscriptionDetails as any).startDate || null,
            endDate: data.subscriptionDetails.endDate || null,
          });
        } else {
          setSubscriptionDetails(null);
        }
      } catch (err: any) {
        const msg =
          err.response?.data?.message || "خطا در برقراری ارتباط با سرور";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchUserAds();
    fetchLiveAnalytics(selectedAdId, activePeriod);
  }, [selectedAdId, activePeriod, fetchLiveAnalytics, fetchUserAds]);

  // آمار کاملاً واقعی از ads
  const stats = useMemo(() => {
    const totalAds = ads.length;
    const totalViewsCalc = ads.reduce((sum, ad) => sum + (ad.views || 0), 0);
    const vipAdsCount = ads.filter((ad) => ad.isVip).length;
    const activeAds = ads.filter((ad) => ad.status === "active").length;
    const pendingAds = ads.filter((ad) => ad.status === "pending").length;
    const soldAds = ads.filter((ad) => ad.status === "sold").length;
    const rejectedAds = ads.filter((ad) => ad.status === "rejected").length;
    const totalBookmarksCalc = ads.reduce(
      (sum, ad) => sum + (ad.bookmarks || 0),
      0,
    );

    return {
      totalAds,
      totalViews: totalViewsCalc,
      vipAdsCount,
      activeAds,
      pendingAds,
      soldAds,
      rejectedAds,
      totalBookmarks: totalBookmarksCalc,
      averageViewsPerAd:
        totalAds > 0 ? Math.round(totalViewsCalc / totalAds) : 0,
    };
  }, [ads]);

  const filteredAds = adsList
    .filter((ad) => ad.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const daysLeft = (endDate: string | null | undefined): string => {
    if (!endDate) return "نامشخص";
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "پایان یافته";
    return `${diffDays} روز`;
  };

  if (isLoading && adsList.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-6 w-32 rounded-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (error && adsList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">خطا در دریافت اطلاعات</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowRight className="w-4 h-4" /> بازگشت
            </Button>
            <Button
              onClick={() => fetchLiveAnalytics(selectedAdId, activePeriod)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> تلاش مجدد
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const subscriptionEnd = subscriptionDetails?.endDate || null;

  return (
    <div
      className="p-4 md:p-6 space-y-6 w-full bg-background min-h-screen"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
            اتصال پایدار به سرور
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            تحلیل و آنالیز حساب VIP
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            گزارش بازدید و بازدهی آگهی‌های فعال شما
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fetchUserAds();
              fetchLiveAnalytics(selectedAdId, activePeriod);
            }}
            disabled={isLoading}
            className="h-10 w-10 rounded-xl shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <div className="flex bg-muted/50 p-1 rounded-xl text-xs font-medium border border-border/50 shadow-sm">
            {[
              { label: "۷ روز", value: "7" },
              { label: "۳۰ روز", value: "30" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActivePeriod(opt.value)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all",
                  activePeriod === opt.value
                    ? "bg-background text-foreground shadow-sm font-bold border border-border/50"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="آگهی‌های من"
          value={stats.totalAds.toLocaleString()}
          icon={FileText}
          href="/panel/vip/my-ads"
          description="کل آگهی‌های ثبت‌شده"
        />
        <StatCard
          title="بازدیدها"
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          description={`در ${activePeriod} روز گذشته`}
        />
        <StatCard
          title="ذخیره شده‌ها"
          value={stats.totalBookmarks.toLocaleString()}
          icon={Bookmark}
          description="علاقه‌مندی کاربران"
        />
        <StatCard
          title="اعتبار اشتراک"
          value={daysLeft(subscriptionEnd)}
          icon={Crown}
          description={
            subscriptionEnd
              ? `تا ${new Date(subscriptionEnd).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })}`
              : "اطلاعات در دسترس نیست"
          }
        />
      </div>

      {/* Filter */}
      <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center gap-3 transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </div>
        <Select value={selectedAdId} onValueChange={setSelectedAdId}>
          <SelectTrigger className="flex-1 h-10 rounded-xl text-sm">
            <SelectValue placeholder="همه آگهی‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">مجموع عملکرد تمام آگهی‌ها</SelectItem>
            {adsList.map((ad) => (
              <SelectItem key={ad.id} value={ad.id}>
                {ad.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span>{stats.totalAds} آگهی موجود</span>
        </div>
      </div>

      {/* Ad Status + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={kpiCardClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              وضعیت آگهی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: "فعال",
                value: stats.activeAds,
                color: "bg-emerald-500",
              },
              {
                label: "در انتظار",
                value: stats.pendingAds,
                color: "bg-amber-500",
              },
              {
                label: "فروخته شده",
                value: stats.soldAds,
                color: "bg-slate-500",
              },
              {
                label: "رد شده",
                value: stats.rejectedAds,
                color: "bg-red-500",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium text-primary">
                    {item.value} آگهی
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{
                      width: `${stats.totalAds > 0 ? (item.value / stats.totalAds) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={kpiCardClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              خلاصه عملکرد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                میانگین بازدید هر آگهی
              </span>
              <span className="font-bold text-primary">
                {stats.averageViewsPerAd.toLocaleString()} بازدید
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                آگهی‌های ویژه (VIP شده)
              </span>
              <span className="font-bold text-amber-600">
                {stats.vipAdsCount} آگهی
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="shadow-md border-border/50 bg-card transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent">
        <CardHeader className="border-b border-border/30 bg-muted/20 pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            روند بازدید
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 h-[350px] min-h-[300px]">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-xl" />
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                داده‌ای برای نمودار یافت نشد
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="2 2"
                  className="stroke-muted/30"
                  vertical={true}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 500,
                  }}
                  tickLine={true}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  dx={-5}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    backdropFilter: "blur(8px)",
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    direction: "rtl",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="بازدید"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gradViews)"
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-md border-border/50 bg-card transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent">
        <CardHeader className="border-b border-border/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-sm font-bold">
              عملکرد به تفکیک آگهی
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              مقایسه آمار دقیق هر ملک
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="جستجوی عنوان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full sm:w-52 text-xs rounded-xl"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortBy(sortBy === "views" ? "bookmarks" : "views")
              }
              className="h-10 text-xs rounded-xl gap-2"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              {sortBy === "views"
                ? "مرتب بر اساس بازدید"
                : "مرتب بر اساس ذخیره"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))
            ) : filteredAds.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground flex flex-col items-center gap-3">
                <FileText className="w-10 h-10 opacity-20" />
                <p>هیچ آگهی ثبت‌شده‌ای یافت نشد.</p>
              </div>
            ) : (
              filteredAds.map((ad) => {
                const s = statusMap[ad.status || ""] || null;
                return (
                  <div
                    key={ad.id}
                    onClick={() => {
                      setSelectedAdId(ad.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={cn(
                      "p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer border transition-all group shadow-sm hover:shadow-md",
                      selectedAdId === ad.id
                        ? "bg-primary/[0.03] border-primary/30 ring-1 ring-primary/20"
                        : "bg-background hover:bg-muted/50 border-border",
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {ad.title}
                        </p>
                        {s && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0 mt-1 gap-1",
                              s.color,
                            )}
                          >
                            {s.icon} {s.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          بازدید
                        </p>
                        <p className="text-sm font-black text-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3 text-primary" />{" "}
                          {ad.views.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          ذخیره
                        </p>
                        <p className="text-sm font-black text-foreground flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-primary" />{" "}
                          {(ad.bookmarks || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
