"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  Info,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, subDays, subWeeks, subMonths, subYears } from "date-fns";

// ─── Types ──────────────────────────────────────
interface AdvancedAnalyticsProps {
  stats: any;
  markers?: any[];
  loading?: boolean;
}

type TimeFrame = "day" | "week" | "month" | "year";
type DayRange = 7 | 30 | 90;
type WeekRange = 4 | 12 | 26;
type MonthRange = 3 | 6 | 12;

const DAY_RANGES: DayRange[] = [7, 30, 90];
const WEEK_RANGES: WeekRange[] = [4, 12, 26];
const MONTH_RANGES: MonthRange[] = [3, 6, 12];

// ─── Main Component ────────────────────────────
export function AdvancedAnalytics({
  stats,
  markers = [],
  loading = false,
}: AdvancedAnalyticsProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("month");
  const [dayRange, setDayRange] = useState<DayRange>(30);
  const [weekRange, setWeekRange] = useState<WeekRange>(12);
  const [monthRange, setMonthRange] = useState<MonthRange>(6);

  const marketTrends: any[] = stats?.marketTrends || [];
  const priceAnalysis: any[] = stats?.priceAnalysis || [];

  // ─── تولید داده‌های نمودار ─────────────────
  const { chartData, trendColor } = useMemo(() => {
    if (timeFrame === "day" || timeFrame === "week") {
      if (!markers.length) return { chartData: [], trendColor: "#059669" };

      const now = new Date();
      let startDate: Date;
      if (timeFrame === "day") startDate = subDays(now, dayRange);
      else startDate = subWeeks(now, weekRange);

      const filtered = markers.filter((ad) => {
        if (!ad.createdAt) return false;
        return new Date(ad.createdAt) >= startDate;
      });

      const grouped: Record<string, { totalPrice: number; totalArea: number }> =
        {};
      filtered.forEach((ad) => {
        if (!ad.price || !ad.area) return;
        const adDate = new Date(ad.createdAt);
        const key =
          timeFrame === "day"
            ? format(adDate, "yyyy-MM-dd")
            : format(adDate, "yyyy-'W'ww");

        if (!grouped[key]) grouped[key] = { totalPrice: 0, totalArea: 0 };
        grouped[key].totalPrice += ad.price;
        grouped[key].totalArea += ad.area;
      });

      const data = Object.entries(grouped)
        .map(([date, val]) => ({
          date,
          avgPricePerMeter:
            val.totalArea > 0 ? Math.round(val.totalPrice / val.totalArea) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const lastTwo = data.slice(-2);
      const isUp =
        lastTwo.length === 2
          ? lastTwo[1].avgPricePerMeter >= lastTwo[0].avgPricePerMeter
          : true;
      return {
        chartData: data.map((item, idx) => ({
          ...item,
          isUp:
            idx > 0
              ? item.avgPricePerMeter >= data[idx - 1].avgPricePerMeter
              : true,
        })),
        trendColor: isUp ? "#059669" : "#dc2626",
      };
    } else {
      // ماهانه/سالیانه از API
      if (!marketTrends.length) return { chartData: [], trendColor: "#059669" };

      const filtered = marketTrends.slice(-monthRange); // هم برای month هم year
      const movingAvg = filtered.map((_, idx) => {
        const slice = filtered.slice(Math.max(0, idx - 2), idx + 1);
        const sum = slice.reduce((s, d) => s + (d.avgPricePerMeter || 0), 0);
        return slice.length === 3 ? Math.round(sum / 3) : null;
      });

      // 🟢 تبدیل month به date برای یکپارچگی با حالت روزانه/هفتگی
      const data = filtered.map((item, idx) => ({
        date: item.month, // به‌جای month از date استفاده می‌کنیم
        avgPricePerMeter: item.avgPricePerMeter,
        ma: movingAvg[idx],
        isUp:
          idx > 0
            ? item.avgPricePerMeter >= filtered[idx - 1].avgPricePerMeter
            : true,
      }));

      const isUp =
        filtered.length >= 2
          ? filtered[filtered.length - 1].avgPricePerMeter >=
            filtered[filtered.length - 2].avgPricePerMeter
          : true;
      return { chartData: data, trendColor: isUp ? "#059669" : "#dc2626" };
    }
  }, [timeFrame, dayRange, weekRange, monthRange, marketTrends, markers]);

  const upColor = "#059669";
  const downColor = "#dc2626";
  const maColor = "#f59e0b";
  const gridColor = "hsl(var(--border) / 0.4)";
  const textColor = "hsl(var(--foreground))";

  // ─── تحلیل متنی ساده ─────────────────────────
  const textualAnalysis = useMemo(() => {
    if (!stats) return null;
    const growth = stats.growthRate || 0;
    const avgPrice = stats.overallAvgPrice || 0;
    const totalAds = stats.totalAds || 0;
    let status = "متعادل";
    if (growth > 5) status = "داغ 🔥";
    else if (growth > 2) status = "رو به رشد 📈";
    else if (growth < -2) status = "رکود ❄️";

    let topDistrict = "نامشخص";
    if (priceAnalysis.length > 0)
      topDistrict = priceAnalysis[0].district || "نامشخص";

    return (
      <div className="rounded-2xl p-6 border bg-card text-card-foreground shadow-sm">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-base mb-2">خلاصه تحلیل بازار</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {`در این منطقه ${totalAds.toLocaleString("fa-IR")} آگهی فعال وجود دارد.
میانگین قیمت هر متر مربع ${(avgPrice / 1_000_000).toFixed(1)} میلیون تومان است.
بازار در وضعیت "${status}" قرار دارد و نرخ رشد ${growth >= 0 ? "+" : ""}${growth}% می‌باشد.
پرآگهی‌ترین محله "${topDistrict}" است.
${growth > 0 ? "قیمت‌ها روند صعودی دارند که نشان‌دهنده تقاضای بالاست." : "کاهش جزئی قیمت‌ها می‌تواند فرصت خرید مناسبی باشد."}`}
            </p>
          </div>
        </div>
      </div>
    );
  }, [stats, priceAnalysis]);

  if (!stats && !loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">ابتدا یک فیلتر اعمال کنید</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {textualAnalysis}

      {/* کنترل‌های بازه زمانی */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-sm">نوع بازه:</span>
          {(["day", "week", "month", "year"] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                timeFrame === tf
                  ? "bg-orange-500 text-white"
                  : "bg-muted hover:bg-orange-100 dark:hover:bg-gray-700"
              }`}
            >
              {tf === "day"
                ? "روزانه"
                : tf === "week"
                  ? "هفتگی"
                  : tf === "month"
                    ? "ماهانه"
                    : "سالیانه"}
            </button>
          ))}
        </div>

        {/* انتخاب تعداد برای روز/هفته/ماه */}
        <div className="flex items-center gap-2 flex-wrap">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          {timeFrame === "day" && (
            <>
              <span className="text-xs text-muted-foreground">تعداد روز:</span>
              {DAY_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setDayRange(r)}
                  className={`px-2 py-1 text-[10px] rounded-md font-bold transition ${
                    dayRange === r
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  {r} روز
                </button>
              ))}
            </>
          )}
          {timeFrame === "week" && (
            <>
              <span className="text-xs text-muted-foreground">تعداد هفته:</span>
              {WEEK_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setWeekRange(r)}
                  className={`px-2 py-1 text-[10px] rounded-md font-bold transition ${
                    weekRange === r
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  {r} هفته
                </button>
              ))}
            </>
          )}
          {(timeFrame === "month" || timeFrame === "year") && (
            <>
              <span className="text-xs text-muted-foreground">تعداد ماه:</span>
              {MONTH_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setMonthRange(r)}
                  className={`px-2 py-1 text-[10px] rounded-md font-bold transition ${
                    monthRange === r
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  {r} ماه
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── نمودار خطی نوسان قیمت ─── */}
        <Card className="rounded-2xl border-border/30 overflow-hidden bg-card shadow-card">
          <CardHeader className="p-4 pb-2 border-b border-border/20 bg-gradient-to-r from-background to-muted/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                نوسان قیمت هر متر مربع
              </CardTitle>
              {stats?.growthRate !== undefined && (
                <Badge
                  className={
                    stats.growthRate >= 0 ? "text-emerald-600" : "text-rose-600"
                  }
                >
                  {stats.growthRate >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stats.growthRate >= 0 ? "+" : ""}
                  {stats.growthRate}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 h-80 sm:h-96">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData as any} // ✅ رفع خطای TS با as any
                  margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    stroke={gridColor}
                    strokeDasharray="3 3"
                    vertical={false}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="date" // ✅ همیشه از date استفاده می‌کنیم
                    tick={{ fontSize: 10, fill: textColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (timeFrame === "day") return val.slice(5); // MM-DD
                      if (timeFrame === "week") return `W${val.split("-W")[1]}`;
                      return val;
                    }}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: textColor }}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}م`}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    orientation="right"
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0].payload;
                      return (
                        <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl min-w-[200px]">
                          <p className="text-xs font-bold mb-2 text-foreground">
                            {label}
                          </p>
                          <Separator className="my-2" />
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">
                                قیمت هر متر:
                              </span>
                              <span
                                className="text-sm font-mono font-bold"
                                style={{
                                  color: point.isUp ? upColor : downColor,
                                }}
                              >
                                {(
                                  (point.avgPricePerMeter || 0) / 1_000_000
                                ).toFixed(2)}{" "}
                                م.ت
                              </span>
                            </div>
                            {point.ma && (
                              <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">
                                  میانگین متحرک:
                                </span>
                                <span className="text-sm font-mono font-bold text-amber-500">
                                  {(point.ma / 1_000_000).toFixed(2)} م.ت
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }}
                    cursor={{
                      stroke: "hsl(var(--primary) / 0.3)",
                      strokeWidth: 1.5,
                      strokeDasharray: "4 4",
                    }}
                  />

                  {/* خط قیمت (موجی) */}
                  <Line
                    type="monotone"
                    dataKey="avgPricePerMeter"
                    stroke={trendColor}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "hsl(var(--background))",
                      stroke: trendColor,
                      strokeWidth: 2.5,
                    }}
                    animationDuration={1200}
                    name="قیمت هر متر"
                  />

                  {/* میانگین متحرک (فقط ماهانه/سالیانه) */}
                  {(timeFrame === "month" || timeFrame === "year") && (
                    <Line
                      type="monotone"
                      dataKey="ma"
                      stroke={maColor}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                      activeDot={false}
                      animationDuration={1200}
                      name="MA(3)"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                داده‌ای برای این بازه وجود ندارد
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── نمودار میله‌ای برترین محله‌ها ─── */}
        <Card className="rounded-2xl border-border/30 overflow-hidden bg-card shadow-card">
          <CardHeader className="p-4 pb-2 border-b border-border/20 bg-gradient-to-r from-background to-muted/5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              برترین محله‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 h-80 sm:h-96">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : priceAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priceAnalysis.slice(0, 10)}
                  margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    stroke={gridColor}
                    strokeDasharray="3 3"
                    vertical={false}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="district"
                    tick={{ fontSize: 10, fill: textColor }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: textColor }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-3 shadow-2xl text-xs">
                          <p className="font-bold text-foreground">{label}</p>
                          <Separator className="my-1" />
                          <div className="space-y-0.5">
                            <p className="text-muted-foreground">
                              آگهی:{" "}
                              <span className="font-bold text-foreground">
                                {d.totalAds}
                              </span>
                            </p>
                            <p className="text-muted-foreground">
                              میانگین قیمت:{" "}
                              <span className="font-bold text-foreground">
                                {(d.avgTotalPrice / 1_000_000).toFixed(0)}{" "}
                                میلیون
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="totalAds"
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                    name="تعداد آگهی"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                داده‌ای برای محله‌ها وجود ندارد
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
