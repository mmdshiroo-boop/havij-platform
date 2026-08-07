"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  locationApi, UserLocation, LocationStats, LocationFilterParams,
} from "@/services/api/locationMap.api";
import * as XLSX from "xlsx";
import {
  RefreshCw, Download, Search, Users, UserCheck,
  Clock, MapPin, Phone, Globe, Activity, User,
  Info, Wifi, Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getImageUrl } from "@/lib/getImageUrl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

/* ─── ثابت‌ها ─── */
const ROLE_CONFIG: Record<string, { label: string; className: string; icon?: string }> = {
  guest: { label: "مهمان", className: "bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
  user: { label: "کاربر عادی", className: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200 dark:border-slate-700" },
  vip: { label: "VIP", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30", icon: "★" },
  agent: { label: "آژانس", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" },
  expert: { label: "کارشناس", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30" },
  developer: { label: "توسعه‌دهنده", className: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30" },
  admin: { label: "ادمین", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200 dark:border-rose-500/30" },
  super_admin: { label: "مدیر ارشد", className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-200 dark:border-red-500/30" },
};

/* ─── helper: استخراج IP ─── */
function extractIp(item: any): string {
  return item?.ip || "";
}

/* ─── dynamic import نقشه ─── */
const MapComponent = dynamic(
  () => import("./MapComponent").then((m) => m.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-xl">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium">در حال بارگذاری نقشه...</span>
        </div>
      </div>
    ),
  },
);

/* ─── StatCard ─── */
function StatCard({
  icon: Icon,
  title,
  value,
  loading = false,
  color = "text-primary",
  bgColor = "bg-primary/10",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  loading?: boolean;
  color?: string;
  bgColor?: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border/60 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <h3 className={cn("text-xl sm:text-2xl font-black mt-1 tabular-nums", color)}>
          {loading ? "..." : typeof value === "number" ? value.toLocaleString("fa-IR") : value}
        </h3>
      </div>
      <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0", bgColor)}>
        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
      </div>
    </div>
  );
}

/* ─── RoleBadge ─── */
function RoleBadge({ role }: { role?: string }) {
  const cfg = ROLE_CONFIG[role || "guest"] || ROLE_CONFIG.guest;
  return (
    <span className={cn(
      "text-[9px] font-black px-1.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap",
      cfg.className,
    )}>
      {cfg.icon && <span className="mr-0.5">{cfg.icon}</span>}
      {cfg.label}
    </span>
  );
}

/* ─── کامپوننت اصلی ─── */
export default function LocationMapPage() {
  const [locations, setLocations] = useState<(UserLocation & { ip?: string })[]>([]);
  const [stats, setStats] = useState<LocationStats>({
    total: 0, totalWithLocation: 0, onlineNow: 0,
    online5m: 0, online1h: 0, onlineLast5min: 0,
    onlineLastHour: 0, onlineToday: 0, topCities: [],
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">("all");
  const [timeframeFilter, setTimeframeFilter] = useState<"all" | "5m" | "1h" | "24h">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<(UserLocation & { ip?: string }) | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  const mainMapRef = useRef<any>(null);
  const fullscreenMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 600);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ─── Socket.IO ─── */
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5001";
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    socketRef.current = io(wsUrl, { transports: ["websocket", "polling"], auth: { token } });

    socketRef.current.on("location-updated", (data: any) => {
      if (!data) return;
      const rawUserId = data.userId;
      const userIdStr = typeof rawUserId === "object" ? rawUserId?._id : rawUserId;

      const ipValue = data.ip || data.ipAddress || data.userIp || data.clientIp || "";

      setLocations((prev) => {
        const index = prev.findIndex((l) => {
          const existingId = typeof l.userId === "object" ? (l.userId as any)?._id : l.userId;
          return existingId === userIdStr;
        });

        const newEntry: UserLocation & { ip?: string } = {
          _id: data._id || `temp_${userIdStr || Date.now()}`,
          ip: ipValue,
          userId: typeof rawUserId === "object" ? rawUserId : {
            _id: userIdStr || "",
            firstName: data.firstName || "کاربر",
            lastName: data.lastName || "",
            phone: data.phone || "",
            role: data.role || "user",
            isActive: true,
            isBanned: false,
          },
          location: { type: "Point", coordinates: [data.lng || 0, data.lat || 0] },
          lat: data.lat ?? data.location?.coordinates?.[1] ?? 0,
          lng: data.lng ?? data.location?.coordinates?.[0] ?? 0,
          city: data.city || "",
          province: data.province || "",
          district: data.district || "",
          isOnline: data.isOnline !== undefined ? data.isOnline : true,
          lastSeenAt: data.lastSeenAt || new Date().toISOString(),
          accuracy: data.accuracy || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (index >= 0) {
          const newArr = [...prev];
          newArr[index] = { ...newArr[index], ...newEntry };
          return newArr;
        }
        setLiveCount((c) => c + 1);
        return [newEntry, ...prev];
      });
    });

    socketRef.current.on("user-offline", (data: any) => {
      if (!data?.userId) return;
      const idStr = typeof data.userId === "object" ? data.userId._id : data.userId;
      setLocations((prev) => prev.map((l) => {
        const lid = typeof l.userId === "object" ? (l.userId as any)?._id : l.userId;
        return lid === idStr ? { ...l, isOnline: false } : l;
      }));
    });

    return () => { socketRef.current?.disconnect(); };
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await locationApi.getLocationStats();
      if (data) {
        setStats({
          ...data,
          totalWithLocation: data.total || data.totalWithLocation || 0,
          online5m: data.onlineLast5min || data.online5m || 0,
          online1h: data.onlineLastHour || data.online1h || 0,
        });
      }
    } catch (err) { console.error("آمار:", err); }
    finally { setStatsLoading(false); }
  }, []);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params: LocationFilterParams = {};
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter !== "all") params.online = statusFilter === "true";
      if (timeframeFilter !== "all") params.timeframe = timeframeFilter;
      if (roleFilter !== "all") (params as any).role = roleFilter;

      const response = await locationApi.getUsersLocations(params);
      const rawData = response?.data || [];
      const processedData = rawData.map((item: any) => ({
        ...item,
        ip: extractIp(item),
      }));
      setLocations(processedData);
      setLiveCount(0);
    } catch (err) { console.error("لیست:", err); setLocations([]); }
    finally { setLoading(false); }
  }, [debouncedSearch, statusFilter, timeframeFilter, roleFilter]);

  useEffect(() => {
    fetchStats();
    fetchLocations();
  }, [fetchStats, fetchLocations]);

  const handleSelectUser = useCallback((
    item: UserLocation & { ip?: string },
    openModal = false,
  ) => {
    setSelectedUser(item);
    setSelectedUserId(item._id);
    if (openModal) setIsUserModalOpen(true);

    const lat = (item as any).lat ?? item.location?.coordinates?.[1];
    const lng = (item as any).lng ?? item.location?.coordinates?.[0];

    if (mainMapRef.current && lat && lng) {
      mainMapRef.current.flyTo([lat, lng], 14, { duration: 1.4 });
      setTimeout(() => {
        const marker = markersRef.current[item._id];
        if (marker) marker.openPopup();
      }, 1500);
    }
  }, []);

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await locationApi.downloadLocationsExcel({});
    } catch {
      if (!locations.length) { alert("داده‌ای وجود ندارد."); return; }
      const data = locations.map((item, i) => {
        const u = item.userId as any;
        return {
          ردیف: i + 1,
          "نام و نام خانوادگی": `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "ناشناس",
          "شماره تلفن": u?.phone || "-",
          نقش: ROLE_CONFIG[u?.role || "guest"]?.label || "-",
          "آدرس IP": extractIp(item) || "-",
          استان: item.province || "-",
          شهر: item.city || "-",
          محله: item.district || "-",
          "عرض جغرافیایی": (item as any).lat ?? "-",
          "طول جغرافیایی": (item as any).lng ?? "-",
          وضعیت: item.isOnline ? "آنلاین" : "آفلاین",
          "آخرین فعالیت": item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString("fa-IR") : "-",
        };
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "موقعیت_کاربران");
      XLSX.writeFile(wb, `گزارش_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally { setExportingExcel(false); }
  };

  const filteredLocations = useMemo(() => {
    if (roleFilter === "all") return locations;
    return locations.filter((l) => {
      const r = (l.userId as any)?.role || "guest";
      return roleFilter === "guest" ? (!r || r === "guest") : r === roleFilter;
    });
  }, [locations, roleFilter]);

  const localStats = useMemo(() => ({
    online: filteredLocations.filter((l) => l.isOnline).length,
    offline: filteredLocations.filter((l) => !l.isOnline).length,
    vip: locations.filter((l) => (l.userId as any)?.role === "vip").length,
  }), [locations, filteredLocations]);

  const topCities = useMemo(() => {
    const cityMap: Record<string, number> = {};
    filteredLocations.forEach((l) => { if (l.city) cityMap[l.city] = (cityMap[l.city] || 0) + 1; });
    return Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([city, count]) => ({ city, count }));
  }, [filteredLocations]);

  return (
    <div className="space-y-5 sm:space-y-6 pb-10" dir="rtl">
      {/* هدر */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-emerald-500/5 p-5 sm:p-6 lg:p-8 shadow-sm"
      >
        <div className="absolute -top-20 -left-20 w-52 h-52 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight">
                نقشه رصد کاربران آنلاین
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                رصد لحظه‌ای موقعیت جغرافیایی — محدوده ایران
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 text-xs gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  {localStats.online.toLocaleString("fa-IR")} آنلاین
                </Badge>
                {liveCount > 0 && (
                  <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25 text-xs gap-1.5 animate-pulse">
                    <Activity className="w-3 h-3" />
                    {liveCount.toLocaleString("fa-IR")} آپدیت زنده
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <button
              type="button"
              onClick={() => { fetchStats(); fetchLocations(); }}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/60 bg-background/80 hover:bg-muted text-sm font-bold transition"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              بروزرسانی
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              {exportingExcel ? "در حال..." : "خروجی Excel"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} title="کل دارای موقعیت" value={stats.totalWithLocation ?? stats.total ?? 0} loading={statsLoading} />
        <StatCard icon={UserCheck} title="آنلاین هم‌اکنون" value={stats.onlineNow ?? 0} loading={statsLoading} color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-500/10" />
        <StatCard icon={Clock} title="آنلاین ۵ دقیقه اخیر" value={stats.online5m ?? 0} loading={statsLoading} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-500/10" />
        <StatCard icon={Globe} title="فعال ۱ ساعت اخیر" value={stats.online1h ?? 0} loading={statsLoading} color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-500/10" />
      </div>

      {/* فیلترها */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/60">
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو: نام، تلفن، IP، شهر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-background border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-border/60 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition min-w-[140px]">
              <option value="all">همه نقش‌ها</option>
              <option value="guest">مهمان</option>
              <option value="user">کاربر عادی</option>
              <option value="vip">کاربر ویژه (VIP)</option>
              <option value="agent">آژانس / مشاور</option>
              <option value="expert">کارشناس</option>
              <option value="developer">توسعه‌دهنده</option>
              <option value="admin">ادمین</option>
              <option value="super_admin">مدیر ارشد</option>
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-background border border-border/60 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition">
              <option value="all">همه وضعیت‌ها</option>
              <option value="true">فقط آنلاین</option>
              <option value="false">فقط آفلاین</option>
            </select>

            <select value={timeframeFilter} onChange={(e) => setTimeframeFilter(e.target.value as any)}
              className="px-3 py-2 bg-background border border-border/60 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition">
              <option value="all">همه زمان‌ها</option>
              <option value="5m">۵ دقیقه اخیر</option>
              <option value="1h">۱ ساعت اخیر</option>
              <option value="24h">۲۴ ساعت اخیر</option>
            </select>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-auto">
              <span className="font-bold text-foreground">{filteredLocations.length.toLocaleString("fa-IR")}</span>
              کاربر
              <span className="text-emerald-600 font-bold">({localStats.online.toLocaleString("fa-IR")} آنلاین)</span>
              {roleFilter !== "all" && (
                <Badge variant="outline" className={cn("text-[10px] gap-1 cursor-pointer", ROLE_CONFIG[roleFilter]?.className)}
                  onClick={() => setRoleFilter("all")}>
                  {ROLE_CONFIG[roleFilter]?.label} ✕
                </Badge>
              )}
            </div>
          </div>

          {/* نوار سریع نقش‌ها */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
              const count = locations.filter((l) => {
                const r = (l.userId as any)?.role || "guest";
                return role === "guest" ? (!r || r === "guest") : r === role;
              }).length;
              if (count === 0) return null;
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
                  className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-lg border transition-all",
                    roleFilter === role
                      ? cn(cfg.className, "ring-2 ring-primary/30 scale-105")
                      : cn(cfg.className, "opacity-70 hover:opacity-100"),
                  )}
                >
                  {cfg.label}: {count.toLocaleString("fa-IR")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* محتوای اصلی */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* لیست کاربران */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card rounded-2xl shadow-sm border border-border/60 flex flex-col h-[600px] lg:h-[680px]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                کاربران
                <Badge variant="secondary" className="text-[11px] font-bold">
                  {filteredLocations.length.toLocaleString("fa-IR")}
                </Badge>
              </h2>
              <span className="text-[11px] text-muted-foreground">کلیک = زوم نقشه</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
              <AnimatePresence>
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    <RefreshCw className="w-7 h-7 animate-spin text-primary" />
                    <span className="text-sm">در حال دریافت...</span>
                  </div>
                ) : filteredLocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    <MapPin className="w-8 h-8 opacity-20" />
                    <span className="text-sm">کاربری یافت نشد</span>
                    {roleFilter !== "all" && (
                      <button onClick={() => setRoleFilter("all")} className="text-xs text-primary hover:underline">
                        حذف فیلتر
                      </button>
                    )}
                  </div>
                ) : (
                  filteredLocations.map((item, i) => {
                    const isSelected = selectedUser?._id === item._id;
                    const u = item.userId as any;
                    const fullName = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || "کاربر ناشناس" : "کاربر ناشناس";
                    const isOnline = item.isOnline ?? false;
                    const role = u?.role || "guest";
                    const avatarSrc = u?.avatar
                      ? getImageUrl(u.avatar)
                      : "/images/user.webp";

                    const ip = extractIp(item);

                    let borderColor = isOnline ? "#10B981" : "#94A3B8";
                    if (isSelected) borderColor = "#EA580C";
                    if (role === "vip") borderColor = "#8B5CF6";
                    if (role === "admin" || role === "super_admin") borderColor = "#EF4444";

                    return (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.5) }}
                        onClick={() => handleSelectUser(item)}
                        className={cn(
                          "p-3 rounded-xl border transition cursor-pointer flex items-center gap-3",
                          isSelected
                            ? "bg-primary/8 border-primary/50 shadow-sm"
                            : "bg-background border-border/40 hover:border-primary/20 hover:bg-muted/20",
                        )}
                      >
                        {/* ★ آواتار اصلاح‌شده (بدون children در AvatarFallback) */}
                        <div className="relative shrink-0">
                          <Avatar className="w-10 h-10 border-2 shadow-sm" style={{ borderColor }}>
                            <AvatarImage
                              src={avatarSrc}
                              alt={fullName}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold" />
                          </Avatar>
                          <span className={cn(
                            "absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-card",
                            isOnline ? "bg-emerald-500" : "bg-gray-400",
                          )} />
                        </div>

                        {/* اطلاعات */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-foreground truncate max-w-[90px]">{fullName}</span>
                            <RoleBadge role={role} />
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 shrink-0" />
                            {u?.phone || "بدون شماره"}
                          </p>
                          <p className="text-[10px] font-mono mt-0.5 flex items-center gap-1">
                            <Wifi className="w-2.5 h-2.5 text-orange-500 shrink-0" />
                            <span className={ip ? "text-orange-600 dark:text-orange-400 font-bold" : "text-muted-foreground/50 italic"}>
                              {ip || "IP ثبت نشده"}
                            </span>
                          </p>
                          {item.city && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              {item.province ? `${item.province} / ` : ""}
                              {item.city}
                              {item.district ? ` — ${item.district}` : ""}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSelectUser(item, true); }}
                          className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition shrink-0"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* شهرهای برتر */}
          {topCities.length > 0 && (
            <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-4">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-primary" />
                شهرهای پرکاربر
              </h3>
              <div className="space-y-2">
                {topCities.map(({ city, count }) => (
                  <div key={city} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{city}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(count / topCities[0].count) * 100}%` }} />
                      </div>
                      <span className="font-bold text-foreground w-8 text-left">{count.toLocaleString("fa-IR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* نقشه */}
        <div className="lg:col-span-8 bg-card rounded-2xl shadow-sm border border-border/60 p-2 h-[500px] lg:h-[680px] relative overflow-hidden">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#E5E3DF]">
            <MapComponent
              locations={filteredLocations}
              selectedUserId={selectedUserId}
              onSelectUser={handleSelectUser}
              onMapReady={(map) => { mainMapRef.current = map; }}
              markersRef={markersRef}
              onToggleFullscreen={() => setIsMapFullscreen(true)}
            />
            <div className="absolute bottom-5 right-4 z-[500] bg-background/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-border text-xs flex flex-wrap items-center gap-2.5">
              {[
                { color: "bg-emerald-500", label: "آنلاین" },
                { color: "bg-slate-400", label: "آفلاین" },
                { color: "bg-purple-500", label: "VIP" },
                { color: "bg-red-500", label: "ادمین" },
                { color: "bg-orange-500", label: "انتخاب‌شده" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={cn("w-2.5 h-2.5 rounded-full inline-block", color)} />
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-4 right-4 z-[500] bg-background/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-border text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span className="font-bold">{localStats.online.toLocaleString("fa-IR")} آنلاین</span>
              <span className="text-muted-foreground">از {filteredLocations.length.toLocaleString("fa-IR")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* مودال تمام صفحه */}
      <Dialog open={isMapFullscreen} onOpenChange={setIsMapFullscreen}>
        <DialogContent className="max-w-[94vw] w-[94vw] h-[90vh] p-0 overflow-hidden flex flex-col rounded-2xl border-border">
          <DialogHeader className="px-5 py-3.5 bg-card border-b border-border/60 shrink-0">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              نمای کامل نقشه
              <Badge variant="secondary" className="text-[11px] gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                {localStats.online.toLocaleString("fa-IR")} آنلاین
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 w-full overflow-hidden bg-[#E5E3DF]">
            <MapComponent
              locations={filteredLocations}
              selectedUserId={selectedUserId}
              onSelectUser={handleSelectUser}
              onMapReady={(map) => { fullscreenMapRef.current = map; }}
              markersRef={markersRef}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ★ مودال جزئیات اصلاح‌شده (بدون children در AvatarFallback) */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl p-6 z-[9999]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              مشخصات کامل کاربر
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (() => {
            const u = selectedUser.userId as any;
            const fullName = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "کاربر ناشناس";
            const avatarSrc = u?.avatar
              ? getImageUrl(u.avatar)
              : "/images/user.webp";
            const isOnline = selectedUser.isOnline ?? false;
            const role = u?.role || "guest";
            const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.guest;
            const ip = extractIp(selectedUser);

            return (
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-md">
                    <AvatarImage
                      src={avatarSrc}
                      alt={fullName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg" />
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base">{fullName}</h3>
                      <RoleBadge role={role} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn("w-2.5 h-2.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-gray-400")} />
                      <span className="text-xs text-muted-foreground">{isOnline ? "آنلاین" : "آفلاین"}</span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{u?.phone || "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "نقش کاربر", value: roleCfg.label },
                    {
                      label: "آدرس IP",
                      value: ip || "ثبت نشده",
                      mono: true,
                      highlight: !!ip,
                    },
                    { label: "استان", value: selectedUser.province || "—" },
                    { label: "شهر", value: selectedUser.city || "—" },
                    { label: "محله", value: selectedUser.district || "نامشخص" },
                    { label: "وضعیت", value: isOnline ? "آنلاین" : "آفلاین" },
                    {
                      label: "مختصات",
                      value: (selectedUser as any).lat
                        ? `${Number((selectedUser as any).lat).toFixed(5)}, ${Number((selectedUser as any).lng).toFixed(5)}`
                        : "نامشخص",
                      mono: true, span: true,
                    },
                    {
                      label: "آخرین فعالیت",
                      value: selectedUser.lastSeenAt
                        ? new Date(selectedUser.lastSeenAt).toLocaleString("fa-IR")
                        : "—",
                      span: true,
                    },
                  ].map(({ label, value, mono, span, highlight }: any) => (
                    <div key={label} className={cn("p-3 rounded-xl bg-card border border-border/50 space-y-1", span && "col-span-2")}>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className={cn(
                        "font-bold text-xs",
                        mono && "font-mono",
                        highlight ? "text-orange-600 dark:text-orange-400" : "text-foreground",
                      )}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <a
                  href={`/panel/admin/users/${u?._id}`}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-bold shadow-sm transition"
                >
                  <User className="w-4 h-4" />
                  مشاهده پرونده کامل کاربر
                </a>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}