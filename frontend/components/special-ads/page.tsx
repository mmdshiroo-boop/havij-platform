"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Crown, Zap, Search, RefreshCw, Eye, Clock,
  MapPin, Filter, CheckCircle, XCircle, AlertCircle,
  ImageOff, User, Phone, Sparkles, CalendarDays,
  TrendingUp, Shield, ChevronLeft, ChevronRight,
  MoreHorizontal, Info,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/api/admin.api";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/getImageUrl";

/* ─── تایپ‌ها ─── */
type StatusFilter = "active" | "expired" | "all";
type TabType = "all" | "vip" | "urgent";

interface SpecialAd {
  _id: string;
  title: string;
  price: number;
  city: string;
  district?: string;
  images?: string[];
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    role?: string;
  };
  isVip: boolean;
  vipExpiry?: string | null;
  isUrgent: boolean;
  urgentExpiry?: string | null;
  views: number;
  createdAt: string;
  status: string;
}

interface StatsData {
  vip: { total: number; active: number };
  urgent: { total: number; active: number };
}

/* ─── ثابت‌ها ─── */
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toFa = (n: number | string) =>
  String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);

const formatPrice = (price: number) => {
  if (!price) return "توافقی";
  if (price >= 1_000_000_000) return `${toFa(Math.round(price / 1_000_000_000))} میلیارد`;
  if (price >= 1_000_000) return `${toFa(Math.round(price / 1_000_000))} میلیون`;
  return toFa(price.toLocaleString("fa-IR")) + " تومان";
};

/* ─── کامپوننت StatCard ─── */
function StatCard({
  icon: Icon,
  title,
  value,
  sub,
  color = "text-primary",
  bgColor = "bg-primary/10",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  sub?: string;
  color?: string;
  bgColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-xl sm:text-2xl font-black text-foreground mt-1 tabular-nums">
            {typeof value === "number" ? toFa(value) : value}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={cn("w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0", bgColor)}>
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── کامپوننت AdCard ─── */
function SpecialAdCard({
  ad,
  isExpired,
  targetFeature,
  expiryDate,
  onToggle,
  onExtend,
}: {
  ad: SpecialAd;
  isExpired: boolean;
  targetFeature: "vip" | "urgent";
  expiryDate?: string | null;
  onToggle: () => void;
  onExtend: () => void;
}) {
  const imgSrc = ad.images?.[0] ? getImageUrl(ad.images[0]) : null;
  const timeStr = expiryDate
    ? new Date(expiryDate).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" })
    : "نامحدود";

  const sellerName = `${ad.userId?.firstName || ""} ${ad.userId?.lastName || ""}`.trim() || "کاربر";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300 overflow-hidden group"
    >
      {/* تصویر */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/20 shrink-0">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={ad.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-muted-foreground/25" />
          </div>
        )}

        {/* گرادیان بالا */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />

        {/* Badge های نوع */}
        <div className="absolute top-2.5 right-2.5 z-30 flex flex-col gap-1.5">
          {ad.isVip && (
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
              <Crown className="w-3 h-3" /> VIP
            </span>
          )}
          {ad.isUrgent && (
            <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1">
              <Zap className="w-3 h-3" /> فوری
            </span>
          )}
        </div>

        {/* وضعیت */}
        <div className="absolute bottom-2.5 right-2.5 z-20">
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm flex items-center gap-1",
            isExpired ? "bg-red-500/85 text-white" : "bg-emerald-500/85 text-white",
          )}>
            {isExpired ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
            {isExpired ? "منقضی" : "فعال"}
          </span>
        </div>

        {/* بازدید */}
        <div className="absolute bottom-2.5 left-2.5 z-20">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/50 text-white backdrop-blur-sm flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {toFa(ad.views || 0)}
          </span>
        </div>
      </div>

      {/* محتوا */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* عنوان */}
        <div>
          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-relaxed">
            {ad.title}
          </h3>
          {(ad.city || ad.district) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{[ad.city, ad.district].filter(Boolean).join("، ")}</span>
            </div>
          )}
        </div>

        {/* قیمت */}
        <div className="text-sm font-extrabold text-primary">
          {formatPrice(ad.price)}
        </div>

        {/* اطلاعات کاربر */}
        <div className="space-y-1.5 py-2.5 border-y border-border/40">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-3 h-3 text-primary" />
            </div>
            <span className="truncate font-medium">{sellerName}</span>
            {ad.userId?.role && ad.userId.role !== "user" && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                {ad.userId.role === "vip" ? "VIP" : ad.userId.role === "agent" ? "آژانس" : ad.userId.role}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-3 h-3 text-primary" />
            </div>
            <span className="font-mono" dir="ltr">{ad.userId?.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarDays className="w-3 h-3 text-primary" />
            </div>
            <span>انقضا: {timeStr}</span>
          </div>
        </div>

        {/* دکمه‌های عملیات */}
        <div className="flex items-center gap-2 mt-auto">
          <Link href={`/ad/${ad._id}`} target="_blank" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            size="sm"
            variant={isExpired ? "default" : "destructive"}
            className={cn(
              "flex-1 h-9 text-xs font-bold rounded-xl",
              isExpired
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                : "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/20",
            )}
            onClick={onToggle}
          >
            {isExpired ? (
              <><CheckCircle className="w-3.5 h-3.5 mr-1" /> فعال‌سازی</>
            ) : (
              <><XCircle className="w-3.5 h-3.5 mr-1" /> لغو اشتراک</>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10"
            onClick={onExtend}
          >
            <Clock className="w-3.5 h-3.5 mr-1" /> تمدید
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── کامپوننت اصلی ─── */
export default function SpecialAdsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [ads, setAds] = useState<SpecialAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<StatsData | null>(null);

  const [selectedAd, setSelectedAd] = useState<SpecialAd | null>(null);
  const [dialogAction, setDialogAction] = useState<"toggle" | "extend" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, activeTab]);

  const fetchAds = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = { page, limit: 20, status: statusFilter, search: debouncedSearch || undefined };
      let res: { data: SpecialAd[]; pagination?: { pages: number } };

      if (activeTab === "vip") {
        res = await adminApi.getVipAds(params);
      } else if (activeTab === "urgent") {
        res = await adminApi.getUrgentAds(params);
      } else {
        const [vipRes, urgentRes] = await Promise.all([
          adminApi.getVipAds(params).catch(() => ({ data: [], pagination: { pages: 1 } })),
          adminApi.getUrgentAds(params).catch(() => ({ data: [], pagination: { pages: 1 } })),
        ]);
        const combined = [...(vipRes.data || []), ...(urgentRes.data || [])];
        const uniqueMap = new Map<string, SpecialAd>();
        combined.forEach((ad) => { if (!uniqueMap.has(ad._id)) uniqueMap.set(ad._id, ad); });
        const uniqueAds = Array.from(uniqueMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        res = { data: uniqueAds, pagination: { pages: Math.max(vipRes.pagination?.pages || 1, urgentRes.pagination?.pages || 1) } };
      }

      setAds(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch {
      toast.error("خطا در دریافت آگهی‌ها");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, debouncedSearch, activeTab]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getSpecialStats();
      setStats(res.data);
    } catch {
      setStats({ vip: { total: 0, active: 0 }, urgent: { total: 0, active: 0 } });
    }
  }, []);

  useEffect(() => { fetchAds(); fetchStats(); }, [fetchAds, fetchStats]);

  const getTargetFeature = useCallback((ad: SpecialAd): "vip" | "urgent" => {
    if (activeTab === "vip") return "vip";
    if (activeTab === "urgent") return "urgent";
    const now = new Date();
    if (ad.isVip && (!ad.vipExpiry || new Date(ad.vipExpiry) >= now)) return "vip";
    return "urgent";
  }, [activeTab]);

  const checkIsExpired = useCallback((ad: SpecialAd): boolean => {
    const now = new Date();
    if (activeTab === "vip") return !ad.isVip || (!!ad.vipExpiry && new Date(ad.vipExpiry) < now);
    if (activeTab === "urgent") return !ad.isUrgent || (!!ad.urgentExpiry && new Date(ad.urgentExpiry) < now);
    const isVipActive = ad.isVip && (!ad.vipExpiry || new Date(ad.vipExpiry) >= now);
    const isUrgentActive = ad.isUrgent && (!ad.urgentExpiry || new Date(ad.urgentExpiry) >= now);
    return !isVipActive && !isUrgentActive;
  }, [activeTab]);

  const getExpiryDate = (ad: SpecialAd) => {
    if (activeTab === "vip") return ad.vipExpiry;
    if (activeTab === "urgent") return ad.urgentExpiry;
    return ad.vipExpiry || ad.urgentExpiry;
  };

  const handleToggle = async () => {
    if (!selectedAd) return;
    setActionLoading(true);
    try {
      const isVipTarget = getTargetFeature(selectedAd) === "vip";
      const expired = checkIsExpired(selectedAd);
      const action = expired ? "activate" : "deactivate";
      const toggleFn = isVipTarget ? adminApi.toggleVipStatus : adminApi.toggleUrgentStatus;
      await toggleFn(selectedAd._id, action, isVipTarget ? 30 : 7);
      toast.success(`وضعیت ${isVipTarget ? "VIP" : "فوری"} تغییر کرد`);
      fetchAds(true);
      fetchStats();
      setDialogOpen(false);
    } catch (err: any) { toast.error(err.response?.data?.message || "خطا"); }
    finally { setActionLoading(false); }
  };

  const handleExtend = async () => {
    if (!selectedAd) return;
    setActionLoading(true);
    try {
      const targetFeature = getTargetFeature(selectedAd);
      const extendFn = targetFeature === "vip" ? adminApi.extendVip : adminApi.extendUrgent;
      await extendFn(selectedAd._id, extendDays);
      toast.success(`آگهی ${extendDays} روز تمدید شد`);
      fetchAds(true);
      fetchStats();
      setDialogOpen(false);
    } catch (err: any) { toast.error(err.response?.data?.message || "خطا"); }
    finally { setActionLoading(false); }
  };

  const openToggleDialog = (ad: SpecialAd) => { setSelectedAd(ad); setDialogAction("toggle"); setDialogOpen(true); };
  const openExtendDialog = (ad: SpecialAd) => {
    setSelectedAd(ad);
    setDialogAction("extend");
    setExtendDays(getTargetFeature(ad) === "vip" ? 30 : 7);
    setDialogOpen(true);
  };

  const activeCount = useMemo(() => ads.filter((ad) => !checkIsExpired(ad)).length, [ads, checkIsExpired]);
  const vipCount = useMemo(() => ads.filter((ad) => ad.isVip).length, [ads]);
  const urgentCount = useMemo(() => ads.filter((ad) => ad.isUrgent).length, [ads]);

  return (
    <div className="space-y-5 sm:space-y-6 pb-10" dir="rtl">
      {/* هدر */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-amber-500/5 p-5 sm:p-6 lg:p-8 shadow-sm"
      >
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-amber-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-400/20 to-primary/20 rounded-2xl border border-amber-400/20 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight">
                مدیریت آگهی‌های ویژه
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                مدیریت آگهی‌های VIP و فوری — فعال‌سازی، تمدید و نظارت
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 text-xs gap-1.5">
                  <Crown className="w-3 h-3" />
                  {toFa(stats?.vip?.active || 0)} VIP فعال
                </Badge>
                <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25 text-xs gap-1.5">
                  <Zap className="w-3 h-3" />
                  {toFa(stats?.urgent?.active || 0)} فوری فعال
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline" size="sm"
              onClick={() => { fetchAds(true); fetchStats(); }}
              disabled={refreshing}
              className="gap-2 rounded-xl h-10 px-4 text-xs font-bold bg-background/80 backdrop-blur-sm"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              بروزرسانی
            </Button>
          </div>
        </div>
      </motion.div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Crown}
          title="کل آگهی‌های VIP"
          value={stats?.vip?.total || 0}
          sub={`${toFa(stats?.vip?.active || 0)} فعال`}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          icon={CheckCircle}
          title="VIP فعال"
          value={stats?.vip?.active || 0}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          icon={Zap}
          title="کل آگهی‌های فوری"
          value={stats?.urgent?.total || 0}
          sub={`${toFa(stats?.urgent?.active || 0)} فعال`}
          color="text-red-500"
          bgColor="bg-red-500/10"
        />
        <StatCard
          icon={CheckCircle}
          title="فوری فعال"
          value={stats?.urgent?.active || 0}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
      </div>

      {/* تب‌ها + فیلتر + جستجو */}
      <div className="flex flex-col gap-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-3 rounded-xl bg-muted/40 p-1">
            <TabsTrigger value="all" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> همه
              {ads.length > 0 && (
                <span className="bg-primary/15 text-primary text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                  {toFa(ads.length)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="vip" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-500" /> VIP
              {vipCount > 0 && (
                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                  {toFa(vipCount)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="urgent" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Zap className="w-3.5 h-3.5 text-red-500" /> فوری
              {urgentCount > 0 && (
                <span className="bg-red-500/15 text-red-700 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                  {toFa(urgentCount)}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="جستجو در عنوان، شهر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 rounded-xl h-10 bg-background border-border/60 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-xl h-10 bg-background border-border/60 text-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent dir="rtl" className="rounded-xl">
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="expired">منقضی</SelectItem>
              <SelectItem value="all">همه</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* اطلاعات تعداد نتایج */}
      {!loading && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            نمایش <strong className="text-foreground">{toFa(ads.length)}</strong> آگهی
            {activeCount > 0 && ` — ${toFa(activeCount)} فعال`}
          </span>
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Filter className="w-3 h-3" />
              فیلتر: {statusFilter === "active" ? "فعال" : "منقضی"}
            </Badge>
          )}
        </div>
      )}

      {/* محتوا */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border/40">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : ads.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-dashed border-2 border-border/60 rounded-2xl">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="p-5 rounded-2xl bg-muted/50">
                    <Sparkles className="w-10 h-10 opacity-30" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground">
                      {statusFilter === "active" ? "هیچ آگهی ویژه فعالی یافت نشد" : "هیچ آگهی ویژه‌ای یافت نشد"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      با تغییر فیلتر یا جستجوی متفاوت دوباره امتحان کنید
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab + statusFilter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ads.map((ad, i) => {
                const expired = checkIsExpired(ad);
                const targetFeature = getTargetFeature(ad);
                const expiryDate = getExpiryDate(ad);

                return (
                  <motion.div
                    key={ad._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <SpecialAdCard
                      ad={ad}
                      isExpired={expired}
                      targetFeature={targetFeature}
                      expiryDate={expiryDate}
                      onToggle={() => openToggleDialog(ad)}
                      onExtend={() => openExtendDialog(ad)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline" size="icon" className="h-9 w-9 rounded-xl"
            disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium px-3 py-1.5 bg-muted rounded-xl">
            {toFa(page)} / {toFa(totalPages)}
          </span>
          <Button
            variant="outline" size="icon" className="h-9 w-9 rounded-xl"
            disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* مودال تغییر وضعیت */}
      <Dialog open={dialogOpen && dialogAction === "toggle"} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-[95vw] sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              تایید تغییر وضعیت
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              {selectedAd && (
                <>
                  آیا از{" "}
                  <strong>{checkIsExpired(selectedAd) ? "فعال‌سازی" : "غیرفعال‌سازی"}</strong>
                  {" "}اشتراک ویژه آگهی{" "}
                  <strong>«{selectedAd.title}»</strong>
                  {" "}اطمینان دارید؟
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedAd && (
            <div className="my-2 p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">نوع آگهی</span>
                <Badge variant="outline" className="text-[10px]">
                  {getTargetFeature(selectedAd) === "vip" ? "VIP" : "فوری"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">وضعیت فعلی</span>
                <span className={cn("font-bold", checkIsExpired(selectedAd) ? "text-red-600" : "text-emerald-600")}>
                  {checkIsExpired(selectedAd) ? "منقضی" : "فعال"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}
              disabled={actionLoading} className="rounded-xl text-xs flex-1">
              انصراف
            </Button>
            <Button
              variant={selectedAd && checkIsExpired(selectedAd) ? "default" : "destructive"}
              onClick={handleToggle}
              disabled={actionLoading}
              className={cn(
                "rounded-xl text-xs flex-1 gap-1.5",
                selectedAd && checkIsExpired(selectedAd)
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "",
              )}
            >
              {actionLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>{selectedAd && checkIsExpired(selectedAd) ? "فعال‌سازی" : "غیرفعال‌سازی"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال تمدید */}
      <Dialog open={dialogOpen && dialogAction === "extend"} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-[95vw] sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Clock className="w-5 h-5 text-primary" />
              تمدید آگهی ویژه
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              تعداد روزهای مورد نظر برای تمدید این آگهی را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          {selectedAd && (
            <div className="my-2 p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs">
              <p className="text-muted-foreground mb-0.5">آگهی:</p>
              <p className="font-bold text-foreground line-clamp-1">{selectedAd.title}</p>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-xs font-bold">تعداد روز تمدید</Label>
            <Input
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(Number(e.target.value))}
              className="rounded-xl h-11 text-sm"
              min={1}
              max={365}
            />

            {/* پیشنهادهای سریع */}
            <div className="flex gap-2 flex-wrap">
              {[7, 15, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setExtendDays(d)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                    extendDays === d
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground",
                  )}
                >
                  {toFa(d)} روز
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}
              disabled={actionLoading} className="rounded-xl text-xs flex-1">
              انصراف
            </Button>
            <Button onClick={handleExtend} disabled={actionLoading}
              className="rounded-xl text-xs flex-1 gap-1.5">
              {actionLoading
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <><Clock className="w-3.5 h-3.5" /> تمدید {toFa(extendDays)} روزه</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}