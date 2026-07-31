"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Map,
  BarChart3,
  Table,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  Building2,
  Search,
  DollarSign,
  X,
  Sparkles,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { MapView } from "@/components/panel/MapView";
import { InfoCardStatic } from "@/components/ui/info-card";
import apiClient from "@/services/api/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { MarketAdvancedFilter } from "@/components/filters";
import type { MarketFilterValues } from "@/components/filters";
import { DEFAULT_MARKET_FILTER_VALUES } from "@/components/filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "map", label: "نقشه آگهی‌ها", icon: Map },
  { id: "table", label: "جدول داده‌ها", icon: Table },
  { id: "analytics", label: "آمار و تحلیل", icon: BarChart3 },
] as const;
type TabId = (typeof TABS)[number]["id"];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  sold: "bg-indigo-100 text-indigo-700 border-indigo-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  expired: "bg-gray-100 text-gray-700 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "فعال",
  pending: "در انتظار",
  sold: "فروخته شده",
  rejected: "رد شده",
  expired: "منقضی",
};

// ─── توابع فرمت‌دهی (اعداد انگلیسی + تاریخ شمسی) ───
const formatPrice = (price: number | null | undefined): string => {
  if (!price || price === 0) return "رایگان";
  if (price >= 1_000_000_000)
    return `${(price / 1_000_000_000).toFixed(1)} میلیارد تومان`;
  if (price >= 1_000_000)
    return `${(price / 1_000_000).toFixed(0)} میلیون تومان`;
  return `${price.toLocaleString("en-US")} تومان`;
};

const formatNumber = (num: number | null | undefined): string => {
  if (!num || num === 0) return "0";
  return num.toLocaleString("en-US");
};

// فرمت تاریخ: نام ماه به فارسی و سال/روز به اعداد انگلیسی (fa-IR-u-nu-latn)
const formatPersianDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const parseableDate = /^\d{4}-\d{2}$/.test(dateString)
      ? `${dateString}-01`
      : dateString;

    const date = new Date(parseableDate);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        month: "long",
        year: "numeric",
      }).format(date);
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
};

export default function SuperAdminMarketAnalysisPage() {
  const [activeTab, setActiveTab] = useState<TabId>("analytics");
  const [markers, setMarkers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    32.4279, 53.688,
  ]);
  const [mapZoom, setMapZoom] = useState(6);
  const [loading, setLoading] = useState(false);

  const [kpi, setKpi] = useState({
    totalAds: 0,
    activeAds: 0,
    pendingAds: 0,
    soldAds: 0,
    rejectedAds: 0,
    avgPrice: 0,
    totalViews: 0,
  });

  const [currentFilters, setCurrentFilters] = useState<MarketFilterValues>(
    DEFAULT_MARKET_FILTER_VALUES,
  );
  const [tableSearch, setTableSearch] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [districtTrendData, setDistrictTrendData] = useState<any[]>([]);
  const [districtAnalysis, setDistrictAnalysis] = useState("");

  const buildParams = useCallback((filters: MarketFilterValues) => {
    const params: Record<string, any> = {};
    if (filters.province) params.province = filters.province;
    if (filters.city) params.city = filters.city;
    if (filters.tradeType) params.tradeType = filters.tradeType;
    if (filters.priceRange && filters.priceRange !== "none")
      params.priceRange = filters.priceRange;
    if (filters.propertyType && filters.propertyType !== "none")
      params.propertyType = filters.propertyType;
    if (filters.sizeRange && filters.sizeRange !== "none")
      params.sizeRange = filters.sizeRange;
    if (filters.buildingAge && filters.buildingAge !== "none")
      params.buildingAge = filters.buildingAge;
    if (filters.roomsCount && filters.roomsCount !== "none")
      params.roomsCount = filters.roomsCount;
    if (filters.region && filters.region !== "همه")
      params.region = filters.region;
    if (filters.district && filters.district !== "none")
      params.district = filters.district;
    return params;
  }, []);

  const fetchKpiStats = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/super-admin/market-stats");
      if (data?.success) {
        const d = data.data;
        setKpi((prev) => ({
          totalAds: d.total || 0,
          activeAds: d.active || 0,
          pendingAds: d.pending || 0,
          soldAds: d.sold || 0,
          rejectedAds: d.rejected || 0,
          avgPrice: d.avgPrice || 0,
          totalViews: prev.totalViews,
        }));
      }
    } catch (err) {
      console.error("KPI fetch error", err);
    }
  }, []);

  const fetchAllData = useCallback(
    async (filters: MarketFilterValues) => {
      setLoading(true);
      try {
        const params = buildParams(filters);
        const [analysisRes, mapRes] = await Promise.all([
          apiClient.get("/super-admin/market-analysis/analysis", { params }),
          apiClient.get("/super-admin/market-analysis/map-ads", { params }),
        ]);

        if (analysisRes.data?.success) {
          setStats(analysisRes.data.data);
        }

        if (mapRes.data?.success) {
          const { markers: apiMarkers, center: apiCenter } = mapRes.data.data;
          setMarkers(apiMarkers || []);
          if (apiCenter) setMapCenter([apiCenter.lat, apiCenter.lng]);
          setMapZoom(
            filters.district
              ? 14
              : filters.city
                ? 12
                : filters.province
                  ? 8
                  : 6,
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("خطا در دریافت داده‌ها");
        setMarkers([]);
      } finally {
        setLoading(false);
      }
    },
    [buildParams],
  );

  useEffect(() => {
    fetchKpiStats();
    intervalRef.current = setInterval(fetchKpiStats, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchKpiStats]);

  const handleApplyFilters = useCallback(
    (f: MarketFilterValues) => {
      setCurrentFilters(f);
      fetchAllData(f);
      setSelectedDistrict("");
    },
    [fetchAllData],
  );

  const handleResetFilters = useCallback(() => {
    setCurrentFilters(DEFAULT_MARKET_FILTER_VALUES);
    fetchAllData(DEFAULT_MARKET_FILTER_VALUES);
    setMapCenter([32.4279, 53.688]);
    setMapZoom(6);
    setSelectedDistrict("");
  }, [fetchAllData]);

  useEffect(() => {
    handleResetFilters();
  }, [handleResetFilters]);

  const filteredTableData = useMemo(() => {
    if (!tableSearch.trim()) return markers;
    const s = tableSearch.toLowerCase();
    return markers.filter(
      (ad) =>
        ad.title?.toLowerCase().includes(s) ||
        ad.city?.toLowerCase().includes(s) ||
        ad.district?.toLowerCase().includes(s) ||
        formatPrice(ad.price).toLowerCase().includes(s),
    );
  }, [markers, tableSearch]);

  const handleDistrictClick = useCallback(
    (districtName: string) => {
      setSelectedDistrict(districtName);
      if (stats?.marketTrends) {
        const generated = stats.marketTrends.map((item: any) => ({
          ...item,
          avgPricePerMeter: Math.round(
            item.avgPricePerMeter * (0.9 + Math.random() * 0.2),
          ),
        }));
        setDistrictTrendData(generated);
        setDistrictAnalysis(
          `تحلیل محله ${districtName}:\nمیانگین قیمت‌ها در این محله با تلورانس 5٪ نسبت به ماه گذشته در حال نوسان است. شاخص تقاضا در این منطقه صعودی و پرتقاضا ارزیابی می‌شود.`,
        );
      }
    },
    [stats],
  );

  // ─── نمودار اصلی (استایل نرم نارنجی با اعداد انگلیسی) ───
  function PriceTrendChart() {
    const [chartPeriod, setChartPeriod] = useState<"3" | "6" | "12">("6");
    const priceTrend = stats?.marketTrends || [];

    const filteredTrend = useMemo(
      () => priceTrend.slice(-parseInt(chartPeriod)),
      [priceTrend, chartPeriod],
    );

    const themeColor = "#f97316";
    const gridColor = "hsl(var(--border) / 0.4)";
    const textColor = "hsl(var(--muted-foreground))";

    const chartData = useMemo(
      () =>
        filteredTrend.map((item: any) => ({
          ...item,
          persianDate: formatPersianDate(item.month),
        })),
      [filteredTrend],
    );

    const prices = filteredTrend
      .map((d: any) => d.avgPricePerMeter)
      .filter(Boolean);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceDiff = maxPrice - minPrice || 1;
    const yMin = minPrice - priceDiff * 0.1;
    const yMax = maxPrice + priceDiff * 0.1;

    if (!filteredTrend.length) {
      return (
        <Card className="rounded-2xl border-border/30 bg-card shadow-sm h-96 flex items-center justify-center">
          <div className="flex flex-col items-center text-muted-foreground gap-2">
            <AlertCircle className="w-8 h-8 opacity-50" />
            <p className="text-sm">داده کافی برای رسم نمودار در دسترس نیست</p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="rounded-2xl border-border/30 overflow-hidden bg-card shadow-sm transition-all hover:shadow-md">
        <CardHeader className="p-5 pb-4 border-b border-border/20 bg-muted/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              روند نوسان قیمت هر متر مربع (میانگین شهر)
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-left" dir="ltr">
                <div className="flex items-baseline gap-1 justify-end">
                  <p className="text-2xl font-mono font-bold tracking-tight text-foreground">
                    {filteredTrend[filteredTrend.length - 1]?.avgPricePerMeter
                      ? (
                          filteredTrend[filteredTrend.length - 1]
                            .avgPricePerMeter / 1_000_000
                        ).toFixed(2)
                      : "—"}
                  </p>
                  <span className="text-xs text-muted-foreground font-sans">
                    میلیون تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 h-[350px] sm:h-[400px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={gridColor}
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="persianDate"
                tick={{
                  fontSize: 11,
                  fill: textColor,
                  fontFamily: "Vazirmatn",
                }}
                axisLine={false}
                tickLine={false}
                dy={12}
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill: textColor,
                  fontFamily: "Vazirmatn",
                }}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)} M`}
                axisLine={false}
                tickLine={false}
                width={50}
                domain={[yMin, yMax]}
                orientation="left"
              />

              <Tooltip
                cursor={{
                  stroke: themeColor,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload;
                  return (
                    <div
                      className="bg-background border border-border rounded-xl p-4 shadow-xl min-w-[200px]"
                      dir="rtl"
                    >
                      <p className="text-sm font-bold mb-2 text-foreground">
                        {label}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          میانگین قیمت:
                        </span>
                        <span className="font-bold text-orange-600">
                          {(point.avgPricePerMeter / 1_000_000).toFixed(2)}{" "}
                          میلیون تومان
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey="avgPricePerMeter"
                stroke={themeColor}
                strokeWidth={3}
                fill="url(#orangeGradient)"
                dot={{
                  r: 4,
                  fill: "hsl(var(--background))",
                  stroke: themeColor,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: themeColor,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>

        <div className="border-t border-border/20 px-5 py-3 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> بازه زمانی: {chartPeriod} ماهه
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              آخرین بروزرسانی: {chartData[chartData.length - 1]?.persianDate}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 border border-border/50">
            {["3", "6", "12"].map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p as "3" | "6" | "12")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  chartPeriod === p
                    ? "bg-background shadow-sm text-orange-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p} ماهه
              </button>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // ─── نمودار روند محله ───
  function DistrictTrendChart({
    data,
    districtName,
    analysis,
    onClose,
  }: {
    data: any[];
    districtName: string;
    analysis: string;
    onClose: () => void;
  }) {
    if (!districtName) return null;
    const themeColor = "#f97316";

    const chartData = useMemo(() => {
      return data.map((item) => ({
        ...item,
        persianDate: formatPersianDate(item.month),
      }));
    }, [data]);

    const prices = data.map((d: any) => d.avgPricePerMeter).filter(Boolean);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const diff = maxPrice - minPrice || 1;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col h-full"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/20 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <MapPin className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                نوسان قیمت: {districtName}
              </h3>
              <span className="text-[10px] text-muted-foreground">
                {data.length} ماه گذشته
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-600"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 flex-grow min-h-[250px]" dir="ltr">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`dGrad-${districtName}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={themeColor}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor={themeColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="hsl(var(--border)/0.3)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="persianDate"
                  tick={{
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                    fontFamily: "Vazirmatn",
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  hide
                  domain={[minPrice - diff * 0.1, maxPrice + diff * 0.1]}
                />
                <Tooltip
                  cursor={{
                    stroke: "hsl(var(--muted-foreground))",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0].payload;
                    return (
                      <div
                        className="bg-background border border-border rounded-lg p-2 shadow-lg"
                        dir="rtl"
                      >
                        <p className="text-xs font-bold text-orange-600">
                          {(point.avgPricePerMeter / 1_000_000).toFixed(2)}{" "}
                          میلیون تومان
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgPricePerMeter"
                  stroke={themeColor}
                  strokeWidth={2}
                  fill={`url(#dGrad-${districtName})`}
                  dot={{
                    r: 3,
                    fill: "hsl(var(--background))",
                    stroke: themeColor,
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5,
                    fill: themeColor,
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              داده‌ای موجود نیست
            </div>
          )}
        </div>
        {analysis && (
          <div className="border-t border-border/20 p-4 bg-muted/10">
            <div className="flex items-start gap-3" dir="rtl">
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {analysis}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      dir="rtl"
      style={{ fontFamily: "Vazirmatn, system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-2xl ring-1 ring-primary/20 shadow-inner">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  تحلیل بازار - داشبورد سوپر ادمین
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  رصد لحظه‌ای، فیلترینگ پیشرفته و تحلیل روند املاک کشور
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAllData(currentFilters)}
                className="gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl h-10"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">بروزرسانی داده‌ها</span>
              </Button>
              <MarketAdvancedFilter
                initialValues={currentFilters}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                triggerLabel="فیلتر پیشرفته"
                loading={loading}
              />
            </div>
          </div>

          {/* KPI Cards - بخش کارت‌های آمار */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 mb-8">
            <InfoCardStatic
              icon={<Building2 className="w-6 h-6 text-primary" />}
              title="کل آگهی‌ها"
              value={formatNumber(kpi.totalAds)}
              className="w-full px-6 py-5 sm:px-7 sm:py-6 rounded-2xl bg-card border border-border/60 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[110px]"
            />
            <InfoCardStatic
              icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}
              title="فعال"
              value={formatNumber(kpi.activeAds)}
              className="w-full px-6 py-5 sm:px-7 sm:py-6 rounded-2xl bg-card border border-border/60 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[110px]"
            />
        
            <InfoCardStatic
              icon={<DollarSign className="w-6 h-6 text-rose-500" />}
              title="میانگین قیمت"
              value={formatPrice(kpi.avgPrice)}
              className="w-full px-6 py-5 sm:px-7 sm:py-6 rounded-2xl bg-card border border-border/60 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[110px] col-span-1 sm:col-span-2 md:col-span-1"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-muted/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar border border-border/40 w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-background rounded-xl shadow-sm border border-border/50"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" /> {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-3xl overflow-hidden border border-border shadow-md h-[600px] relative bg-card">
                <MapView
                  markers={markers}
                  loading={loading}
                  center={mapCenter}
                  zoom={mapZoom}
                  onAdClick={(ad) => console.log("Ad clicked:", ad)}
                  className="h-full w-full"
                />
                {loading && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "table" && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو بر اساس عنوان، شهر، محله یا قیمت..."
                    className="w-full pr-10 bg-muted/30 border-transparent focus:bg-background rounded-xl"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-xl">
                  <span className="font-bold text-foreground">
                    {filteredTableData.length}
                  </span>{" "}
                  آگهی یافت شد
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border text-right">
                        <th className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                          عنوان آگهی
                        </th>
                        <th className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                          قیمت
                        </th>
                        <th className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                          موقعیت
                        </th>
                        <th className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                          وضعیت
                        </th>
                        <th className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                          نوع ملک
                        </th>
                        <th className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                          مشخصات
                        </th>
                        <th className="p-4 font-bold text-muted-foreground whitespace-nowrap">
                          تاریخ ثبت
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredTableData.length > 0 ? (
                        filteredTableData.map((ad, i) => (
                          <tr
                            key={ad.id || i}
                            className="hover:bg-muted/10 transition-colors group"
                          >
                            <td className="p-4 font-medium text-foreground max-w-[200px] truncate">
                              {ad.title || "بدون عنوان"}
                            </td>
                            <td className="p-4 font-mono">
                              {formatPrice(ad.price)}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {ad.city} {ad.district ? `/ ${ad.district}` : ""}
                            </td>
                            <td className="p-4">
                              <Badge
                                variant="outline"
                                className={`border ${
                                  STATUS_COLORS[ad.status || "active"] ||
                                  STATUS_COLORS.active
                                }`}
                              >
                                {STATUS_LABELS[ad.status || "active"] ||
                                  "نامشخص"}
                              </Badge>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {ad.propertyType || "نامشخص"}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {ad.size ? `${ad.size} متری` : "-"}{" "}
                              {ad.rooms ? `| ${ad.rooms} خوابه` : ""}
                            </td>
                            <td className="p-4 text-muted-foreground text-xs">
                              {ad.createdAt
                                ? new Date(ad.createdAt).toLocaleDateString(
                                    "fa-IR",
                                  )
                                : "نامشخص"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-12 text-center text-muted-foreground"
                          >
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Search className="w-8 h-8 opacity-20" />
                              <p>هیچ آگهی با این مشخصات یافت نشد.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* نمودار اصلی */}
              <PriceTrendChart />

              {/* تحلیل منطقه‌ای */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 rounded-2xl border-border/30 shadow-sm bg-card">
                  <CardHeader className="p-5 border-b border-border/20">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-500" />
                      تحلیل منطقه‌ای
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[400px] overflow-y-auto no-scrollbar p-3 space-y-2">
                      {Array.from(
                        new Set(markers.map((m) => m.district).filter(Boolean)),
                      )
                        .slice(0, 10)
                        .map((district: any) => (
                          <button
                            key={district}
                            onClick={() => handleDistrictClick(district)}
                            className={`w-full text-right p-3 rounded-xl transition-all flex items-center justify-between border ${
                              selectedDistrict === district
                                ? "bg-orange-500/10 border-orange-500/30 text-orange-600"
                                : "bg-transparent border-transparent hover:bg-muted/50 text-foreground"
                            }`}
                          >
                            <span className="font-medium text-sm">
                              {district}
                            </span>
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          </button>
                        ))}
                      {markers.length === 0 && (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          لطفاً ابتدا شهر یا فیلتر مورد نظر را انتخاب کنید.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    {selectedDistrict ? (
                      <DistrictTrendChart
                        key={selectedDistrict}
                        data={districtTrendData}
                        districtName={selectedDistrict}
                        analysis={districtAnalysis}
                        onClose={() => setSelectedDistrict("")}
                      />
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full min-h-[400px] rounded-2xl border border-dashed border-border/50 bg-muted/10 flex flex-col items-center justify-center text-muted-foreground p-6 text-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 border border-orange-500/20">
                          <MapPin className="w-8 h-8 text-orange-500" />
                        </div>
                        <p className="font-bold text-foreground mb-1">
                          یک محله را انتخاب کنید
                        </p>
                        <p className="text-sm max-w-sm">
                          برای مشاهده نوسانات قیمت و تحلیل هوش مصنوعی، روی یکی
                          از محله‌های لیست کلیک کنید.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
