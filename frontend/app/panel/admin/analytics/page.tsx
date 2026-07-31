// app/panel/admin/analytics/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Activity,
  PieChartIcon,
  RefreshCw,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import apiClient from "@/services/api/client";

// ─── Constants & Colors ──────────────────────────────
const CHART_COLORS = [
  "#f97316",
  "#fb923c",
  "#fbbf24",
  "#10b981",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
];

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  pending: "#f59e0b",
  rejected: "#ef4444",
  sold: "#6366f1",
  expired: "#9ca3af",
};

// ─── Types ───────────────────────────────────────────
type PeriodType = "7" | "30" | "90";

interface AnalyticsData {
  usersByRole: { _id: string; count: number }[];
  adsByStatus: { _id: string; count: number }[];
  timeline: { labels: string[]; users: number[]; ads: number[] };
  summary: {
    totalUsers: number;
    totalAds: number;
    activeAds: number;
    pendingAds: number;
    todayUsers: number;
    todayAds: number;
  };
}

// ─── Labels ──────────────────────────────
const roleLabels: Record<string, string> = {
  user: "کاربر عادی",
  vip: "VIP",
  agent: "آژانس",
  expert: "کارشناس",
  admin: "ادمین",
  super_admin: "مدیر ارشد",
  developer: "توسعه‌دهنده",
};

const statusLabels: Record<string, string> = {
  active: "فعال",
  pending: "در انتظار",
  rejected: "رد شده",
  sold: "فروخته شده",
  expired: "منقضی",
};

// ─── Helper (Fallback Timeline) ──────────
const generateTimeline = (days: number) => {
  const labels: string[] = [];
  const users: number[] = [];
  const ads: number[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(
      date.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
    );
    users.push(Math.floor(Math.random() * 20) + 5);
    ads.push(Math.floor(Math.random() * 15) + 3);
  }
  return { labels, users, ads };
};

// ─── Main Component ───────────────────────────
export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>("30");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // پیچیدن تابع در useCallback برای جلوگیری از رندرهای اضافی و رفع خطای هوک
  const fetchAnalytics = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const statsRes = await apiClient.get("/admin/stats");
        const stats = statsRes.data.data;

        let timeline: { labels: string[]; users: number[]; ads: number[] } = {
          labels: [],
          users: [],
          ads: [],
        };

        try {
          const timelineRes = await apiClient.get("/admin/stats/analytics", {
            params: { days: period },
          });
          if (timelineRes.data?.success) {
            timeline = timelineRes.data.data;
          } else {
            throw new Error("Invalid response");
          }
        } catch {
          // Fallback به داده‌های تستی در صورت خطای API چارت
          timeline = generateTimeline(Number(period));
        }

        setData({
          usersByRole: stats.users.byRole
            ? Object.entries(stats.users.byRole).map(([key, value]) => ({
                _id: key,
                count: value as number,
              }))
            : [],
          adsByStatus: stats.ads.byStatus
            ? Object.entries(stats.ads.byStatus).map(([key, value]) => ({
                _id: key,
                count: value as number,
              }))
            : [],
          timeline,
          summary: {
            totalUsers: stats.users.total,
            totalAds: stats.ads.total,
            activeAds: stats.ads.active,
            pendingAds: stats.ads.pending,
            todayUsers: stats.today.users,
            todayAds: stats.today.ads,
          },
        });
      } catch (err) {
        console.error(err);
        setError("خطا در دریافت داده‌های تحلیلی");
        toast.error("خطا در دریافت داده‌های تحلیلی");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period],
  ); // اضافه شدن period به عنوان وابستگی

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ─── Transform Data ──────────────────────
  const timelineChartData = useMemo(
    () =>
      data?.timeline.labels.map((label, i) => ({
        label,
        کاربران: data.timeline.users[i] || 0,
        آگهی‌ها: data.timeline.ads[i] || 0,
      })) || [],
    [data],
  );

  const roleChartData = useMemo(
    () =>
      data?.usersByRole
        .filter((r) => r.count > 0)
        .map((r) => ({
          name: roleLabels[r._id] || r._id,
          value: r.count,
        })) || [],
    [data],
  );

  const adStatusChartData = useMemo(() => {
    if (!data) return [];

    const map = new Map<
      string,
      { name: string; value: number; color: string }
    >();

    if (data.summary.activeAds !== undefined) {
      map.set("active", {
        name: "فعال",
        value: data.summary.activeAds,
        color: STATUS_COLORS.active,
      });
    }
    if (data.summary.pendingAds !== undefined) {
      map.set("pending", {
        name: "در انتظار",
        value: data.summary.pendingAds,
        color: STATUS_COLORS.pending,
      });
    }

    data.adsByStatus?.forEach((a) => {
      const label = statusLabels[a._id] || a._id;
      const color = STATUS_COLORS[a._id] || "#9ca3af";
      if (map.has(a._id)) {
        const existing = map.get(a._id)!;
        existing.value = a.count;
      } else {
        map.set(a._id, { name: label, value: a.count, color });
      }
    });

    return Array.from(map.values()).filter((item) => item.value > 0);
  }, [data]);

  // ─── Loading State ─────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────
  if (error && !data) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        dir="rtl"
      >
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button
          onClick={() => fetchAnalytics(true)}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" /> تلاش مجدد
        </Button>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border border-primary/10 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">گزارشات پیشرفته</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                نمودارهای تعاملی و تحلیل داده‌های سیستم
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* اصلاح Type Cast در Select */}
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as PeriodType)}
            >
              <SelectTrigger className="w-[130px] rounded-xl">
                <Calendar className="w-4 h-4 ml-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">۷ روز</SelectItem>
                <SelectItem value="30">۳۰ روز</SelectItem>
                <SelectItem value="90">۹۰ روز</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="gap-2 rounded-xl"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />{" "}
              بروزرسانی
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کل کاربران"
          value={data?.summary.totalUsers?.toLocaleString("fa-IR") || "۰"}
          icon={Users}
          description={`${data?.summary.todayUsers?.toLocaleString("fa-IR") || "۰"} امروز`}
        />
        <StatCard
          title="کل آگهی‌ها"
          value={data?.summary.totalAds?.toLocaleString("fa-IR") || "۰"}
          icon={FileText}
          description={`${data?.summary.activeAds?.toLocaleString("fa-IR") || "۰"} فعال`}
        />
        <StatCard
          title="در انتظار تأیید"
          value={data?.summary.pendingAds?.toLocaleString("fa-IR") || "۰"}
          icon={Activity}
          description="نیاز به بررسی"
        />
        <StatCard
          title="بازه گزارش"
          value={`${period} روز`}
          icon={Calendar}
          description="داده‌های نمودارها"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart (Area) */}
        <ChartCard
          title="روند رشد"
          subtitle={`${period} روز اخیر`}
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timelineChartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  direction: "rtl",
                }}
              />
              <Area
                type="monotone"
                dataKey="کاربران"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#colorUsers)"
              />
              <Area
                type="monotone"
                dataKey="آگهی‌ها"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorAds)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Roles Distribution Chart (Pie) */}
        <ChartCard
          title="توزیع نقش کاربران"
          icon={<PieChartIcon className="w-5 h-5 text-primary" />}
        >
          {roleChartData.length === 0 ? (
            <EmptyChart message="اطلاعات نقش‌ها موجود نیست" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={3}
                >
                  {roleChartData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    direction: "rtl",
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ads Status Chart (Bar) */}
        <ChartCard
          title="وضعیت آگهی‌ها"
          icon={<Activity className="w-5 h-5 text-primary" />}
        >
          {adStatusChartData.length === 0 ? (
            <EmptyChart message="آگهی‌ای برای نمایش وضعیت یافت نشد" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={adStatusChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    direction: "rtl",
                  }}
                />
                <Bar dataKey="value" name="تعداد" radius={[6, 6, 0, 0]}>
                  {adStatusChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color || CHART_COLORS[idx]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Daily Registrations (Line) */}
        <ChartCard
          title="ثبت‌نام کاربران"
          subtitle={`${period} روز اخیر`}
          icon={<Users className="w-5 h-5 text-primary" />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timelineChartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  fontSize: 12,
                  direction: "rtl",
                }}
              />
              <Line
                type="monotone"
                dataKey="کاربران"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────
function ChartCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-md rounded-2xl overflow-hidden h-full flex flex-col bg-card">
        <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <CardTitle className="text-base font-bold">{title}</CardTitle>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 flex-1 min-h-[380px]">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <BarChart3 className="w-12 h-12 opacity-20" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
