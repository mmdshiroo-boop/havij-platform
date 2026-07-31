"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  locationApi,
  UserLocation,
  LocationStats,
  LocationFilterParams,
} from "@/services/api/locationMap.api";
import * as XLSX from "xlsx";
import {
  RefreshCw,
  Download,
  Search,
  Users,
  UserCheck,
  Clock,
  MapPin,
  Phone,
  Globe,
  Activity,
  User,
  Info,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MapComponent } from "./MapComponent";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LocationMapPage() {
  const [locations, setLocations] = useState<(UserLocation & { ip?: string })[]>([]);
  const [stats, setStats] = useState<LocationStats>({
    total: 0,
    totalWithLocation: 0,
    onlineNow: 0,
    online5m: 0,
    online1h: 0,
    onlineLast5min: 0,
    onlineLastHour: 0,
    onlineToday: 0,
    topCities: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  // اصلاح نوع statusFilter و timeframeFilter
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">("all");
  const [timeframeFilter, setTimeframeFilter] = useState<"all" | "5m" | "1h" | "24h">("all");

  const [selectedUser, setSelectedUser] = useState<(UserLocation & { ip?: string }) | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);

  const mainMapRef = useRef<any>(null);
  const fullscreenMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const socketRef = useRef<Socket | null>(null);

  const getActiveMap = useCallback(() => {
    if (isMapFullscreen && fullscreenMapRef.current) {
      return fullscreenMapRef.current;
    }
    return mainMapRef.current;
  }, [isMapFullscreen]);

  // اتصال WebSocket
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5001";
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    socketRef.current = io(wsUrl, {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socketRef.current.on("location-updated", (data: any) => {
      if (!data) return;

      const rawUserId = data.userId;
      const userIdStr = typeof rawUserId === "object" ? rawUserId?._id : rawUserId;

      setLocations((prev) => {
        const index = prev.findIndex((l) => {
          const existingId = typeof l.userId === "object" ? l.userId?._id : l.userId;
          return existingId === userIdStr;
        });

        if (index >= 0) {
          const newArr = [...prev];
          newArr[index] = {
            ...newArr[index],
            ...data,
            ip: data.ip || newArr[index].ip,
            lat: data.lat ?? data.location?.coordinates?.[1] ?? newArr[index].lat,
            lng: data.lng ?? data.location?.coordinates?.[0] ?? newArr[index].lng,
            isOnline: data.isOnline !== undefined ? data.isOnline : true,
            lastSeenAt: data.lastSeenAt || new Date().toISOString(),
          };
          return newArr;
        } else {
          const userObj = typeof rawUserId === "object" ? rawUserId : null;
          const newUser: UserLocation & { ip?: string } = {
            _id: data._id || `temp_${userIdStr || Date.now()}`,
            ip: data.ip || "ثبت نشده",
            userId: userObj || {
              _id: userIdStr || "",
              firstName: data.firstName || "کاربر",
              lastName: data.lastName || "",
              phone: data.phone || "",
              role: data.role || "user",
              isActive: true,
              isBanned: false,
            },
            location: {
              type: "Point",
              coordinates: [data.lng || 0, data.lat || 0],
            },
            lat: data.lat ?? data.location?.coordinates?.[1] ?? 0,
            lng: data.lng ?? data.location?.coordinates?.[0] ?? 0,
            city: data.city || "نامشخص",
            province: data.province || "نامشخص",
            district: data.district || "نامشخص",
            isOnline: data.isOnline !== undefined ? data.isOnline : true,
            lastSeenAt: data.lastSeenAt || new Date().toISOString(),
            accuracy: data.accuracy || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return [newUser, ...prev];
        }
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
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
    } catch (err) {
      console.error("خطا در دریافت آمار:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params: LocationFilterParams = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      // اصلاح: ارسال وضعیت به صورت boolean یا 'all'
      if (statusFilter !== "all") {
        params.online = statusFilter === "true";
      }
      if (timeframeFilter !== "all") {
        params.timeframe = timeframeFilter;
      }

      const response = await locationApi.getUsersLocations(params);
      setLocations(response?.data || []);
    } catch (err) {
      console.error("خطا در دریافت لیست:", err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, timeframeFilter]);

  useEffect(() => {
    fetchStats();
    fetchLocations();
  }, [fetchStats, fetchLocations]);

  const handleSelectUser = (item: UserLocation & { ip?: string }, openModalDirectly = false) => {
    setSelectedUser(item);
    setSelectedUserId(item._id);

    if (openModalDirectly) {
      setIsUserModalOpen(true);
    }

    const lat = item.lat ?? item.location?.coordinates?.[1];
    const lng = item.lng ?? item.location?.coordinates?.[0];
    const activeMap = getActiveMap();

    if (activeMap && lat && lng) {
      activeMap.flyTo([lat, lng], 15, { duration: 1.2 });
      const marker = markersRef.current[item._id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const params: LocationFilterParams = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== "all") {
        params.online = statusFilter === "true";
      }
      if (timeframeFilter !== "all") {
        params.timeframe = timeframeFilter;
      }

      await locationApi.downloadLocationsExcel(params);
    } catch (err) {
      if (!locations || locations.length === 0) {
        alert("داده‌ای برای خروجی اکسل وجود ندارد.");
        setExportingExcel(false);
        return;
      }

      const excelData = locations.map((item, index) => {
        const userObj = item.userId;
        return {
          ردیف: index + 1,
          "نام و نام خانوادگی": `${userObj?.firstName || ""} ${userObj?.lastName || ""}`.trim() || "کاربر ناشناس",
          "شماره تلفن": userObj?.phone || "ثبت نشده",
          "آدرس IP": item.ip || "ثبت نشده",
          استان: item.province || "-",
          شهر: item.city || "-",
          "محله / خیابان": item.district || "نامشخص",
          "عرض جغرافیایی (Lat)": item.lat ?? "-",
          "طول جغرافیایی (Lng)": item.lng ?? "-",
          وضعیت: item.isOnline ? "آنلاین" : "آفلاین",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "موقعیت_کاربران");
      XLSX.writeFile(workbook, `گزارش_موقعیت_کاربران_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen text-foreground" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-sm">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">نقشه کاربران آنلاین</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                رصد لحظه‌ای موقعیت جغرافیایی کاربران در نقشه (محدود به ایران)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20">
              <Activity className="w-3.5 h-3.5" />
              {statsLoading ? "..." : (stats.onlineNow || 0).toLocaleString("fa-IR")} آنلاین
            </Badge>

            <button
              type="button"
              onClick={() => {
                fetchStats();
                fetchLocations();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/60 hover:bg-primary/5 text-sm font-medium transition text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
              بروزرسانی
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              {exportingExcel ? "در حال..." : "خروجی Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">کل کاربران دارای موقعیت</p>
            <h3 className="text-2xl font-black mt-1">
              {statsLoading ? "..." : (stats.totalWithLocation ?? stats.total ?? 0).toLocaleString("fa-IR")}
            </h3>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">آنلاین هم‌اکنون</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {statsLoading ? "..." : (stats.onlineNow ?? 0).toLocaleString("fa-IR")}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">آنلاین ۵ دقیقه اخیر</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {statsLoading ? "..." : (stats.online5m ?? stats.onlineLast5min ?? 0).toLocaleString("fa-IR")}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-100/80 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">فعال در ۱ ساعت اخیر</p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {statsLoading ? "..." : (stats.online1h ?? stats.onlineLastHour ?? 0).toLocaleString("fa-IR")}
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-100/80 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="جستجوی نام، تلفن، IP، شهر یا محله..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-background border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "true" | "false")}
            className="px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm font-medium focus:outline-none transition"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="true">فقط آنلاین</option>
            <option value="false">فقط آفلاین</option>
          </select>

          <select
            value={timeframeFilter}
            onChange={(e) => setTimeframeFilter(e.target.value as "all" | "5m" | "1h" | "24h")}
            className="px-3 py-2.5 bg-background border border-border/60 rounded-xl text-sm font-medium focus:outline-none transition"
          >
            <option value="all">همه زمان‌ها</option>
            <option value="5m">۵ دقیقه اخیر</option>
            <option value="1h">۱ ساعت اخیر</option>
            <option value="24h">۲۴ ساعت اخیر</option>
          </select>
        </div>
      </div>

      {/* بخش اصلی */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* لیست کاربران */}
        <div className="lg:col-span-4 bg-card rounded-2xl shadow-sm border border-border/50 p-4 flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-border/30 mb-3">
            <h2 className="font-bold text-foreground flex items-center gap-2 text-base">
              لیست کاربران
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                {locations.length.toLocaleString("fa-IR")}
              </span>
            </h2>
            <span className="text-xs text-muted-foreground">کلیک جهت زوم روی نقشه</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <RefreshCw className="animate-spin text-2xl text-primary" />
                <span className="text-sm">در حال دریافت لیست...</span>
              </div>
            ) : locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <MapPin className="text-3xl text-muted-foreground/30" />
                <span className="text-sm">هیچ کاربری یافت نشد.</span>
              </div>
            ) : (
              locations.map((item) => {
                const isSelected = selectedUser?._id === item._id;
                const userObj = item.userId;
                const fullName = userObj
                  ? `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || "کاربر ناشناس"
                  : "کاربر ناشناس";

                const isOnline = item.isOnline ?? false;
                // اصلاح: استفاده از role و isVip با توجه به تایپ جدید
                const isVip = (typeof userObj === "object" && userObj?.role === "vip") || item.isVip;
                const avatarUrl = (typeof userObj === "object" && userObj?.avatar) || "/images/user.webp";

                let borderColor = isOnline ? "#10B981" : "#94A3B8";
                if (isSelected) borderColor = "#EA580C";
                if (isVip) borderColor = "#8B5CF6";

                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectUser(item)}
                    className={cn(
                      "p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 group",
                      isSelected
                        ? "bg-primary/10 border-primary/50 shadow-md shadow-primary/10"
                        : "bg-card border-border/40 hover:border-primary/20 hover:bg-muted/10"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm bg-white flex-shrink-0 flex items-center justify-center" style={{ borderColor }}>
                        <img
                          src={avatarUrl}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/user.webp";
                          }}
                          alt={fullName}
                        />
                      </div>

                      <div className="overflow-hidden">
                        <h4 className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                          {fullName}
                          {isVip && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                              VIP
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-muted-foreground/60" />
                          {userObj?.phone || "بدون شماره"}
                        </p>
                        {item.ip && (
                          <p className="text-[10px] font-mono text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                            <Wifi className="w-3 h-3 text-muted-foreground/60" />
                            <span>IP: {item.ip}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 gap-1.5">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          isOnline
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                        )}
                      >
                        {isOnline ? "آنلاین" : "آفلاین"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUser(item, true);
                        }}
                        className="p-1 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition"
                        title="مشاهده جزئیات کامل"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* کانتاینر اصلی نقشه */}
        <div className="lg:col-span-8 bg-card rounded-2xl shadow-sm border border-border/50 p-2 h-[650px] relative overflow-hidden flex flex-col">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#E5E3DF]">
            <MapComponent
              locations={locations}
              selectedUserId={selectedUserId}
              onSelectUser={(user) => handleSelectUser(user)}
              onMapReady={(map) => {
                mainMapRef.current = map;
              }}
              markersRef={markersRef}
              onToggleFullscreen={() => setIsMapFullscreen(true)}
            />

            {/* راهنمای رنگ‌های نقشه */}
            <div className="absolute bottom-5 right-4 z-[500] bg-background/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-border text-xs flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="font-medium">آنلاین</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
                <span className="font-medium">آفلاین</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
                <span className="font-medium">VIP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* مودال نقشه بزرگ و وسط‌چین */}
      <Dialog open={isMapFullscreen} onOpenChange={setIsMapFullscreen}>
        <DialogContent className="max-w-[92vw] w-[92vw] h-[88vh] p-0 overflow-hidden flex flex-col sm:max-w-[92vw] rounded-2xl border-border bg-card shadow-2xl dir-rtl">
          <DialogHeader className="px-5 py-3.5 bg-card border-b border-border/60 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Globe className="w-5 h-5 text-primary" />
              نمای کامل نقشه (محدود به ایران)
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 w-full h-full overflow-hidden bg-[#E5E3DF]">
            <MapComponent
              locations={locations}
              selectedUserId={selectedUserId}
              onSelectUser={(user) => handleSelectUser(user)}
              onMapReady={(map) => {
                fullscreenMapRef.current = map;
              }}
              markersRef={markersRef}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* مودال اطلاعات کامل کاربر */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-md w-full p-6 dir-rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              مشخصات کامل کاربر
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 text-sm mt-2">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-background flex items-center justify-center font-bold text-lg">
                  <img
                    src={
                      (typeof selectedUser.userId === "object" && selectedUser.userId?.avatar) ||
                      "/images/user.webp"
                    }
                    alt="avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/user.webp";
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {typeof selectedUser.userId === "object"
                      ? `${selectedUser.userId?.firstName || ""} ${selectedUser.userId?.lastName || ""}`.trim() ||
                        "کاربر ناشناس"
                      : "کاربر ناشناس"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {typeof selectedUser.userId === "object" ? selectedUser.userId?.phone : "ثبت نشده"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-card border rounded-xl">
                  <span className="text-xs text-muted-foreground block">استان / شهر</span>
                  <span className="font-semibold">
                    {selectedUser.province || "-"} / {selectedUser.city || "-"}
                  </span>
                </div>
                <div className="p-3 bg-card border rounded-xl">
                  <span className="text-xs text-muted-foreground block">محله / منطقه</span>
                  <span className="font-semibold">{selectedUser.district || "نامشخص"}</span>
                </div>
                <div className="p-3 bg-card border rounded-xl">
                  <span className="text-xs text-muted-foreground block">آدرس IP</span>
                  <span className="font-mono font-semibold text-primary">{selectedUser.ip || "ثبت نشده"}</span>
                </div>
                <div className="p-3 bg-card border rounded-xl">
                  <span className="text-xs text-muted-foreground block">مختصات جغرافیایی</span>
                  <span className="font-mono text-xs font-semibold dir-ltr block">
                    {selectedUser.lat ? `${selectedUser.lat.toFixed(5)}, ${selectedUser.lng?.toFixed(5)}` : "نامشخص"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}