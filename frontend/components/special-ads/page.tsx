// app/panel/admin/special-ads/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Crown,
  Zap,
  Search,
  RefreshCw,
  Eye,
  Clock,
  MapPin,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  User,
  Phone,
  Sparkles,
  CalendarDays,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/api/admin.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoCardStatic } from "@/components/ui/info-card";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

type StatusFilter = "active" | "expired" | "all";

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

type TabType = "all" | "vip" | "urgent";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toFa = (n: number | string) =>
  String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);

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

  // Dialog state
  const [selectedAd, setSelectedAd] = useState<SpecialAd | null>(null);
  const [dialogAction, setDialogAction] = useState<"toggle" | "extend" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, activeTab]);

  // ========== Fetch Ads ==========
  const fetchAds = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = {
          page,
          limit: 20,
          status: statusFilter,
          search: debouncedSearch || undefined,
        };

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
          const uniqueMap = new Map();
          combined.forEach((ad) => {
            if (!uniqueMap.has(ad._id)) {
              uniqueMap.set(ad._id, ad);
            }
          });

          const uniqueAds = Array.from(uniqueMap.values());
          uniqueAds.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

          res = {
            data: uniqueAds,
            pagination: {
              pages: Math.max(
                vipRes.pagination?.pages || 1,
                urgentRes.pagination?.pages || 1,
              ),
            },
          };
        }

        setAds(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("خطا در دریافت آگهی‌ها");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, statusFilter, debouncedSearch, activeTab],
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getSpecialStats();
      setStats(res.data);
    } catch (error) {
      console.error("Stats error:", error);
      setStats({
        vip: { total: 0, active: 0 },
        urgent: { total: 0, active: 0 },
      });
    }
  }, []);

  useEffect(() => {
    fetchAds();
    fetchStats();
  }, [fetchAds, fetchStats]);

  // ========== Helpers ==========
  const getTargetFeature = useCallback(
    (ad: SpecialAd) => {
      if (activeTab === "vip") return "vip";
      if (activeTab === "urgent") return "urgent";
      if (ad.isVip && ad.vipExpiry && new Date(ad.vipExpiry) > new Date())
        return "vip";
      if (
        ad.isUrgent &&
        ad.urgentExpiry &&
        new Date(ad.urgentExpiry) > new Date()
      )
        return "urgent";
      return ad.isVip ? "vip" : "urgent";
    },
    [activeTab],
  );

  const isExpired = useCallback(
    (ad: SpecialAd) => {
      const now = new Date();

      if (activeTab === "vip") {
        if (!ad.isVip) return true;
        if (!ad.vipExpiry) return false;
        return new Date(ad.vipExpiry) < now;
      }

      if (activeTab === "urgent") {
        if (!ad.isUrgent) return true;
        if (!ad.urgentExpiry) return false;
        return new Date(ad.urgentExpiry) < now;
      }

      const isVipActive =
        ad.isVip && (!ad.vipExpiry || new Date(ad.vipExpiry) >= now);
      const isUrgentActive =
        ad.isUrgent && (!ad.urgentExpiry || new Date(ad.urgentExpiry) >= now);
      return !isVipActive && !isUrgentActive;
    },
    [activeTab],
  );

  const getExpiryDate = (ad: SpecialAd) => {
    if (activeTab === "vip") return ad.vipExpiry;
    if (activeTab === "urgent") return ad.urgentExpiry;
    return ad.vipExpiry || ad.urgentExpiry;
  };

  const formatPrice = (price: number) => {
    if (!price) return "توافقی";
    return toFa(price.toLocaleString("fa-IR")) + " تومان";
  };

const getImageUrl = (path?: string): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http") && !path.includes("localhost:5001")) return path;
  const backendBase = (
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001"
  );
  if (path.startsWith("http://localhost:5001")) {
    return path.replace("http://localhost:5001", backendBase);
  }
  if (path.startsWith("/uploads")) {
    return backendBase + path;
  }
  return path;
};

  const statsData = useMemo(() => {
    const total = ads.length;
    const active = ads.filter((ad) => !isExpired(ad)).length;
    return { total, active };
  }, [ads, isExpired]);

  // ========== Actions ==========
  const handleToggle = async () => {
    if (!selectedAd) return;
    setActionLoading(true);
    try {
      const targetFeature = getTargetFeature(selectedAd);
      const isVipTarget = targetFeature === "vip";
      const expired = isExpired(selectedAd);
      const action = expired ? "activate" : "deactivate";

      const toggleFn = isVipTarget
        ? adminApi.toggleVipStatus
        : adminApi.toggleUrgentStatus;
      await toggleFn(selectedAd._id, action, isVipTarget ? 30 : 7);

      toast.success(
        `وضعیت ${isVipTarget ? "VIP" : "فوری"} با موفقیت تغییر کرد`,
      );
      fetchAds(true);
      fetchStats();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در تغییر وضعیت");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!selectedAd) return;
    setActionLoading(true);
    try {
      const targetFeature = getTargetFeature(selectedAd);
      const extendFn =
        targetFeature === "vip" ? adminApi.extendVip : adminApi.extendUrgent;

      await extendFn(selectedAd._id, extendDays);
      toast.success(`تمدید با موفقیت انجام شد`);
      fetchAds(true);
      fetchStats();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در تمدید");
    } finally {
      setActionLoading(false);
    }
  };

  const openToggleDialog = (ad: SpecialAd) => {
    setSelectedAd(ad);
    setDialogAction("toggle");
    setDialogOpen(true);
  };

  const openExtendDialog = (ad: SpecialAd) => {
    setSelectedAd(ad);
    setDialogAction("extend");
    const targetFeature = getTargetFeature(ad);
    setExtendDays(targetFeature === "vip" ? 30 : 7);
    setDialogOpen(true);
  };

  // ========== Render ==========
  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                مدیریت آگهی‌های ویژه
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مدیریت جامع آگهی‌های VIP و فوری – فعال‌سازی، تمدید و نظارت
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              {toFa(statsData.active)} فعال
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAds(true);
                fetchStats();
              }}
              disabled={refreshing}
              className="gap-1.5 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              بروزرسانی
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InfoCardStatic
          icon={<Crown className="w-5 h-5" />}
          title="کل VIP"
          value={toFa(stats?.vip?.total || 0)}
        />
        <InfoCardStatic
          icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
          title="VIP فعال"
          value={toFa(stats?.vip?.active || 0)}
        />
        <InfoCardStatic
          icon={<Zap className="w-5 h-5" />}
          title="کل فوری"
          value={toFa(stats?.urgent?.total || 0)}
        />
        <InfoCardStatic
          icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
          title="فوری فعال"
          value={toFa(stats?.urgent?.active || 0)}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabType)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3 rounded-xl bg-muted/30 p-1">
          <TabsTrigger
            value="all"
            className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Sparkles className="w-4 h-4" /> همه
          </TabsTrigger>
          <TabsTrigger
            value="vip"
            className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Crown className="w-4 h-4" /> VIP
          </TabsTrigger>
          <TabsTrigger
            value="urgent"
            className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Zap className="w-4 h-4" /> فوری
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در عنوان، شهر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 rounded-xl h-11 bg-background border-border/60 focus:border-primary/40 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-full sm:w-[160px] rounded-xl h-11 bg-background border-border/60 focus:border-primary/40 focus:ring-primary/30">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="expired">منقضی</SelectItem>
              <SelectItem value="all">همه</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ads Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-dashed border-border/60 rounded-2xl bg-muted/5">
          <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-base">
              {statusFilter === "active"
                ? "هیچ آگهی ویژه فعالی یافت نشد"
                : "هیچ آگهی ویژه‌ای یافت نشد"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ads.map((ad) => {
            const expired = isExpired(ad);
            const targetFeature = getTargetFeature(ad);
            const expiryDate = getExpiryDate(ad);
            const timeStr = expiryDate
              ? new Date(expiryDate).toLocaleDateString("fa-IR")
              : "نامحدود";

            return (
              <div
                key={ad._id}
                className="flex flex-col h-full rounded-2xl border border-border/50 bg-card
                           shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden
                           max-sm:flex-row-reverse max-sm:h-[150px] max-sm:rounded-xl max-sm:border-b max-sm:border-border/40 
                           max-sm:shadow-none max-sm:bg-transparent max-sm:p-2 max-sm:gap-3"
              >
                {/* Image */}
                <div
                  className="relative aspect-[4/3] overflow-hidden bg-muted/15 shrink-0 group/slider
                                max-sm:w-[120px] max-sm:h-full max-sm:aspect-auto max-sm:rounded-xl"
                >
                  {ad.images && ad.images.length > 0 ? (
                    <img
                      src={getImageUrl(ad.images[0])}
                      alt={ad.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/slider:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
                      <ImageOff className="w-7 h-7 text-muted-foreground/25" />
                    </div>
                  )}

                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10 max-sm:hidden" />

                  {/* Badges */}
                  <div className="absolute top-2.5 right-2.5 z-30 flex flex-col gap-1.5 max-sm:top-1.5 max-sm:right-1.5">
                    {ad.isVip && (
                      <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                        <Crown className="w-3 h-3" /> VIP
                      </span>
                    )}
                    {ad.isUrgent && (
                      <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-md">
                        فوری
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute bottom-2.5 right-2.5 z-20 max-sm:bottom-1.5 max-sm:right-1.5">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1",
                        expired
                          ? "bg-red-500/80 text-white"
                          : "bg-emerald-500/80 text-white",
                      )}
                    >
                      {expired ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {expired ? "منقضی" : "فعال"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-2 max-sm:p-0 max-sm:gap-1 max-sm:py-0.5 max-sm:justify-between">
                  <div>
                    <h3 className="font-bold text-[13px] md:text-sm text-foreground leading-relaxed line-clamp-2">
                      {ad.title}
                    </h3>
                  </div>

                  {/* Info Rows */}
                  <div className="space-y-1.5 mt-auto mb-2">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <User className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {ad.userId?.firstName} {ad.userId?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="font-mono">
                        {toFa(ad.userId?.phone)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarDays className="w-3 h-3 shrink-0" />
                      <span>انقضا: {timeStr}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-border/30 max-sm:pt-1">
                    <Link href={`/ad/${ad._id}`} target="_blank">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>

                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant={expired ? "default" : "destructive"}
                        className="h-7 text-[10px] px-2 font-medium"
                        onClick={() => openToggleDialog(ad)}
                      >
                        {expired ? "فعال‌سازی" : "لغو اشتراک"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] px-2 font-medium border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => openExtendDialog(ad)}
                      >
                        تمدید
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            قبلی
          </Button>
          <span className="flex items-center text-sm">
            صفحه {page} از {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            بعدی
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <Dialog
        open={dialogOpen && dialogAction === "toggle"}
        onOpenChange={setDialogOpen}
      >
        <DialogContent dir="rtl" className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              تایید تغییر وضعیت
            </DialogTitle>
            <DialogDescription className="pt-3 text-sm leading-relaxed">
              آیا از{" "}
              {selectedAd && isExpired(selectedAd)
                ? "فعال‌سازی"
                : "غیرفعال‌سازی"}{" "}
              اشتراک ویژه این آگهی اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-start mt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionLoading}
              className="rounded-xl"
            >
              انصراف
            </Button>
            <Button
              variant={
                selectedAd && isExpired(selectedAd) ? "default" : "destructive"
              }
              onClick={handleToggle}
              disabled={actionLoading}
              className="rounded-xl min-w-[100px]"
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "تایید عملیات"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpen && dialogAction === "extend"}
        onOpenChange={setDialogOpen}
      >
        <DialogContent dir="rtl" className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5 text-primary" />
              تمدید آگهی ویژه
            </DialogTitle>
            <DialogDescription className="pt-2">
              تعداد روزهای مورد نظر برای تمدید این آگهی را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">تعداد روز</Label>
            <Input
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(Number(e.target.value))}
              className="rounded-xl h-11"
              min={1}
              max={365}
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionLoading}
              className="rounded-xl"
            >
              انصراف
            </Button>
            <Button
              onClick={handleExtend}
              disabled={actionLoading}
              className="rounded-xl min-w-[100px]"
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "اعمال تمدید"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}