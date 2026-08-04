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
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import apiClient from "@/services/api/client";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface AdItem {
  _id: string;
  title: string;
  views: number;
  bookmarks: number;
  status: string;
  isVip: boolean;
  createdAt: string;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toFa = (n: number) => String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const statusMap: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  active: {
    label: "فعال",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  pending: {
    label: "در انتظار",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <Clock className="w-3 h-3" />,
  },
  sold: {
    label: "فروخته شده",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  expired: {
    label: "منقضی",
    color: "bg-muted text-muted-foreground border-border",
    icon: <XCircle className="w-3 h-3" />,
  },
  rejected: {
    label: "رد شده",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function VipAnalyticsPage() {
  const { user } = useAuth();

  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdId, setSelectedAdId] = useState<string>("all");
  const [activePeriod, setActivePeriod] = useState<"7" | "30">("7");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"views" | "bookmarks">("views");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [adsRes, planRes] = await Promise.all([
        apiClient.get("/ads/user/me"),
        apiClient.get("/vip/current-plan").catch(() => null),
      ]);
      setAds(adsRes.data.data || []);
      if (planRes?.data?.data?.endDate) {
        setSubscriptionEnd(planRes.data.data.endDate);
      }
    } catch (err) {
      console.error("Error fetching VIP analytics:", err);
      toast.error("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // آمار کلی
  const stats = useMemo(() => {
    const totalAds = ads.length;
    const totalViews = ads.reduce((sum, ad) => sum + (ad.views || 0), 0);
    const totalBookmarks = ads.reduce((sum, ad) => sum + (ad.bookmarks || 0), 0);
    const vipAdsCount = ads.filter((ad) => ad.isVip).length;
    const activeAds = ads.filter((ad) => ad.status === "active").length;
    const pendingAds = ads.filter((ad) => ad.status === "pending").length;
    const soldAds = ads.filter((ad) => ad.status === "sold").length;
    const rejectedAds = ads.filter((ad) => ad.status === "rejected").length;
    const averageViews = totalAds > 0 ? Math.round(totalViews / totalAds) : 0;

    return {
      totalAds,
      totalViews,
      totalBookmarks,
      vipAdsCount,
      activeAds,
      pendingAds,
      soldAds,
      rejectedAds,
      averageViews,
    };
  }, [ads]);

  // داده‌های نمودار (۷ یا ۳۰ روز اخیر بر اساس تاریخ ایجاد آگهی)
  const chartData = useMemo(() => {
    const days = activePeriod === "7" ? 7 : 30;
    const result: { name: string; بازدید: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = d.toLocaleDateString("fa-IR", { weekday: "long" });
      const dayViews = ads
        .filter((ad) => {
          const adDate = new Date(ad.createdAt);
          return (
            adDate.getDate() === d.getDate() &&
            adDate.getMonth() === d.getMonth() &&
            adDate.getFullYear() === d.getFullYear()
          );
        })
        .reduce((sum, ad) => sum + (ad.views || 0), 0);
      result.push({ name: dayName, بازدید: dayViews });
    }
    return result;
  }, [ads, activePeriod]);

  // فیلتر و مرتب‌سازی آگهی‌ها
  const filteredAds = useMemo(() => {
    let list = ads;
    if (selectedAdId !== "all") {
      list = list.filter((ad) => ad._id === selectedAdId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((ad) => ad.title.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [ads, selectedAdId, searchQuery, sortBy]);

  const daysLeft = (endDate: string | null): string => {
    if (!endDate) return "نامشخص";
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "پایان یافته";
    return `${diff} روز`;
  };

  if (loading) {
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 space-y-6 w-full max-w-7xl mx-auto pb-8"
      dir="rtl"
    >
      {/* هدر */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 fill-current" />
            تحلیل VIP
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
            onClick={fetchData}
            disabled={loading}
            className="h-10 w-10 rounded-xl shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <div className="flex bg-muted/50 p-1 rounded-xl text-xs font-medium border border-border/50 shadow-sm">
            {[
              { label: "۷ روز", value: "7" },
              { label: "۳۰ روز", value: "30" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActivePeriod(opt.value as "7" | "30")}
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
      </motion.div>

      {/* کارت‌های KPI */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="آگهی‌های من" value={toFa(stats.totalAds)} icon={FileText} description="کل آگهی‌های ثبت‌شده" />
        <StatCard title="بازدیدها" value={toFa(stats.totalViews)} icon={Eye} description={`در ${activePeriod} روز گذشته`} />
        <StatCard title="ذخیره شده‌ها" value={toFa(stats.totalBookmarks)} icon={Bookmark} description="علاقه‌مندی کاربران" />
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
      </motion.div>

      {/* فیلتر آگهی */}
      <motion.div variants={itemVariants} className="bg-card border border-border/60 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </div>
        <Select value={selectedAdId} onValueChange={setSelectedAdId}>
          <SelectTrigger className="flex-1 h-10 rounded-xl text-sm bg-muted/40 border-border/60 focus:ring-primary">
            <SelectValue placeholder="همه آگهی‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">مجموع عملکرد تمام آگهی‌ها</SelectItem>
            {ads.map((ad) => (
              <SelectItem key={ad._id} value={ad._id}>
                {ad.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span>{toFa(stats.totalAds)} آگهی</span>
        </div>
      </motion.div>

      {/* نمودار + وضعیت آگهی‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                روند بازدید {activePeriod === "7" ? "هفتگی" : "ماهانه"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 h-[320px]">
              {chartData.every((d) => d.بازدید === 0) ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mx-auto opacity-20" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                        <stop stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
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
                    <Area type="monotone" dataKey="بازدید" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gradViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                وضعیت آگهی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: "فعال", value: stats.activeAds, color: "bg-emerald-500" },
                { label: "در انتظار", value: stats.pendingAds, color: "bg-amber-500" },
                { label: "فروخته شده", value: stats.soldAds, color: "bg-blue-500" },
                { label: "رد شده", value: stats.rejectedAds, color: "bg-rose-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-bold text-primary">{toFa(item.value)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${stats.totalAds > 0 ? (item.value / stats.totalAds) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 space-y-2 border-t border-border/40">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">میانگین بازدید</span>
                  <span className="font-bold">{toFa(stats.averageViews)} بازدید</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">آگهی‌های ویژه</span>
                  <span className="font-bold text-amber-600">{toFa(stats.vipAdsCount)} آگهی</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* جدول آگهی‌ها */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/40 bg-muted/10">
            <div>
              <CardTitle className="text-sm font-bold">عملکرد به تفکیک آگهی</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">مقایسه آمار دقیق هر آگهی</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="جستجوی عنوان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full sm:w-52 text-xs rounded-xl bg-muted/40 border-border/60 focus:ring-primary"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy(sortBy === "views" ? "bookmarks" : "views")}
                className="h-10 text-xs rounded-xl gap-2 border-border/60 hover:bg-muted"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
                {sortBy === "views" ? "مرتب بر اساس بازدید" : "مرتب بر اساس ذخیره"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 px-5 pb-5">
            <div className="space-y-2">
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
              ) : filteredAds.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground flex flex-col items-center gap-3">
                  <FileText className="w-10 h-10 opacity-20" />
                  <p>هیچ آگهی ثبت‌شده‌ای یافت نشد.</p>
                </div>
              ) : (
                filteredAds.map((ad) => {
                  const s = statusMap[ad.status] || statusMap.pending;
                  return (
                    <div
                      key={ad._id}
                      onClick={() => setSelectedAdId(ad._id === selectedAdId ? "all" : ad._id)}
                      className={cn(
                        "p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer border transition-all group shadow-sm hover:shadow-md",
                        selectedAdId === ad._id
                          ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                          : "bg-background hover:bg-muted/50 border-border/60",
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{ad.title}</p>
                          <Badge className={cn("text-[10px] font-bold px-2 py-0 mt-1 gap-1 border", s.color)}>
                            {s.icon} {s.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground mb-0.5">بازدید</p>
                          <p className="text-sm font-black text-foreground flex items-center gap-1">
                            <Eye className="w-3 h-3 text-primary" /> {toFa(ad.views || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground mb-0.5">ذخیره</p>
                          <p className="text-sm font-black text-foreground flex items-center gap-1">
                            <Bookmark className="w-3 h-3 text-primary" /> {toFa(ad.bookmarks || 0)}
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
      </motion.div>
    </motion.div>
  );
}