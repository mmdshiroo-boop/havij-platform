"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { UserLocation } from "@/services/api/locationMap.api";
import {
  Phone, MapPin, ExternalLink, ZoomIn, ZoomOut,
  Maximize2, Globe, Wifi,
} from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";

/* ─── ثابت‌ها ─── */
const ROLE_LABELS: Record<string, string> = {
  guest: "مهمان",
  user: "کاربر عادی",
  vip: "VIP",
  agent: "آژانس",
  expert: "کارشناس",
  developer: "توسعه‌دهنده",
  admin: "ادمین",
  super_admin: "مدیر ارشد",
};

const IRAN_BOUNDS: L.LatLngBoundsExpression = [
  [25.0, 44.0],
  [39.8, 63.3],
];

/* ─── تایپ‌ها ─── */
interface MapComponentProps {
  locations: UserLocation[];
  selectedUserId?: string | null;
  onSelectUser: (user: UserLocation) => void;
  onMapReady?: (map: any) => void;
  markersRef?: React.MutableRefObject<{ [key: string]: any }>;
  onToggleFullscreen?: () => void;
}

/* ─── helper: استخراج IP از هر جایی که باشد ─── */
function extractIp(loc: any): string {
  return loc?.ip || "";
}
/* ─── helper: استخراج موقعیت ─── */
function extractLatLng(loc: any): { lat: number; lng: number } | null {
  const lat =
    loc?.lat ??
    loc?.latitude ??
    loc?.location?.coordinates?.[1] ??
    null;
  const lng =
    loc?.lng ??
    loc?.longitude ??
    loc?.location?.coordinates?.[0] ??
    null;

  if (!lat || !lng || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
}

/* ─── MapResizeHandler ─── */
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize(); }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/* ─── کنترل‌های سفارشی ─── */
function MapCustomControls({
  onToggleFullscreen,
  isSatellite,
  setIsSatellite,
}: {
  onToggleFullscreen?: () => void;
  isSatellite: boolean;
  setIsSatellite: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const map = useMap();

  return (
    <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-2.5 pointer-events-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-700 flex flex-col overflow-hidden w-11">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); map.zoomIn(); }}
          className="p-2.5 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors border-b border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200"
          title="بزرگ‌نمایی"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); map.zoomOut(); }}
          className="p-2.5 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors text-gray-700 dark:text-gray-200"
          title="کوچک‌نمایی"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {onToggleFullscreen && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-700 w-11 h-11 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-gray-700 dark:text-gray-200"
          title="تمام صفحه"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsSatellite((prev) => !prev); }}
        className={cn(
          "rounded-2xl shadow-lg w-11 h-11 flex items-center justify-center transition-all",
          isSatellite
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-orange-500 text-white hover:bg-orange-600",
        )}
        title={isSatellite ? "نقشه معمولی" : "نمای ماهواره‌ای"}
      >
        <Globe className="w-5 h-5" />
      </button>
    </div>
  );
}

/* ─── رنگ border ─── */
function getBorderColor(role: string, isOnline: boolean, isSelected: boolean): string {
  if (isSelected) return "#EA580C";
  if (role === "vip") return "#8B5CF6";
  if (role === "admin" || role === "super_admin") return "#EF4444";
  if (role === "expert") return "#3B82F6";
  if (role === "agent") return "#10B981";
  return isOnline ? "#10B981" : "#94A3B8";
}

/* ─── ساخت آیکون ─── */
function createAvatarIcon(user: any, isOnline: boolean, isSelected: boolean) {
  const role = user?.role || "guest";
  const borderColor = getBorderColor(role, isOnline, isSelected);
  const size = isSelected ? 50 : 38;
  const avatarUrl = user?.avatar ? getImageUrl(user.avatar) : "/images/user.webp";

  let badge = "";
  if (role === "vip") {
    badge = `<div style="position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:#F59E0B;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:900;box-shadow:0 2px 4px rgba(0,0,0,0.2);z-index:10;">★</div>`;
  } else if (role === "admin" || role === "super_admin") {
    badge = `<div style="position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:#EF4444;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:900;box-shadow:0 2px 4px rgba(0,0,0,0.2);z-index:10;">A</div>`;
  } else if (role === "expert") {
    badge = `<div style="position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:#3B82F6;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:900;box-shadow:0 2px 4px rgba(0,0,0,0.2);z-index:10;">E</div>`;
  }

  const pulse = (isOnline || isSelected)
    ? `<span style="position:absolute;inset:0;border-radius:50%;background:${borderColor};opacity:0.3;animation:ping 1.5s ease-in-out infinite;"></span>`
    : "";

  return L.divIcon({
    className: "custom-avatar-marker",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${pulse}
        <div style="position:relative;width:100%;height:100%;border-radius:50%;overflow:hidden;border:2.5px solid ${borderColor};box-shadow:0 4px 12px rgba(0,0,0,0.2);background:white;transition:all 0.3s;">
          <img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='/images/user.webp'" alt="user" />
        </div>
        ${badge}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 6],
  });
}

/* ─── کامپوننت اصلی ─── */
export function MapComponent({
  locations,
  selectedUserId,
  onSelectUser,
  onMapReady,
  markersRef,
  onToggleFullscreen,
}: MapComponentProps) {
const [mounted, setMounted] = useState(false); // ← جدید
  const defaultCenter: [number, number] = [32.5, 53.5];
  const [isSatellite, setIsSatellite] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-xl">
        <span className="text-sm text-muted-foreground">در حال بارگذاری نقشه...</span>
      </div>
    );
  }

    const tileUrl = isSatellite
    ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      minZoom={5}
      maxBounds={IRAN_BOUNDS}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
      className="z-0 bg-[#E5E3DF]"
      ref={onMapReady}
      attributionControl={false}
      zoomControl={false}
    >
      <MapResizeHandler />
      <TileLayer url={tileUrl} maxZoom={19} />

      <MapCustomControls
        onToggleFullscreen={onToggleFullscreen}
        isSatellite={isSatellite}
        setIsSatellite={setIsSatellite}
      />

      {locations.map((loc) => {
        /* ─── استخراج مختصات ─── */
        const coords = extractLatLng(loc);
        if (!coords) return null;
        const { lat, lng } = coords;

        /* ─── استخراج IP — مهم‌ترین بخش ─── */
        const ip = extractIp(loc);

        const u = (loc as any).userId as any;
        const isSelected = loc._id === selectedUserId;
        const isOnline = (loc as any).isOnline ?? false;
        const role = u?.role || "guest";
        const isVip = role === "vip";
        const avatarUrl = u?.avatar ? getImageUrl(u.avatar) : "/images/user.webp";
        const fullName = `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "کاربر ناشناس";
        const city = (loc as any).city || "";
        const district = (loc as any).district || "";
        const province = (loc as any).province || "";
        const icon = createAvatarIcon(u, isOnline, isSelected);

        return (
          <Marker
            key={loc._id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{ click: () => onSelectUser(loc) }}
            ref={(ref) => { if (ref && markersRef?.current) markersRef.current[loc._id] = ref; }}
          >
            <Popup className="custom-popup" minWidth={250} maxWidth={300}>
              <div className="flex flex-col font-sans" dir="rtl">
                {/* ─── هدر ─── */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 p-3.5 border-b border-gray-200 flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-orange-400 shadow-sm shrink-0">
                    <img
                      src={avatarUrl}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/images/user.webp"; }}
                      alt={fullName}
                    />
                    {isVip && (
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-white text-[9px] font-black">★</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 truncate">{fullName}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={cn(
                        "w-2 h-2 rounded-full inline-block shrink-0",
                        isOnline ? "bg-emerald-500" : "bg-gray-400",
                      )} />
                      <span className="text-[10px] text-gray-500">
                        {isOnline ? "آنلاین" : "آفلاین"}
                      </span>
                      <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">
                        {ROLE_LABELS[role] || role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ─── اطلاعات ─── */}
                <div className="p-3.5 space-y-2">

                  {/* شماره تلفن */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="font-mono text-xs font-bold">
                      {u?.phone || "بدون شماره"}
                    </span>
                  </div>

                  {/* ─── IP ─── */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Wifi className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className={cn(
                      "font-mono text-xs font-bold",
                      ip ? "text-orange-600" : "text-gray-400 italic",
                    )}>
                      {ip || "IP ثبت نشده"}
                    </span>
                  </div>

                  {/* موقعیت */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <div className="text-xs">
                      {province && (
                        <span className="text-gray-400">{province} / </span>
                      )}
                      <span className="font-medium">{city || "نامشخص"}</span>
                      {district && (
                        <span className="text-gray-400"> — {district}</span>
                      )}
                    </div>
                  </div>

                  {/* مختصات */}
                  <div className="text-[10px] text-gray-400 font-mono pr-5" dir="ltr">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </div>

                  {/* لینک */}
                  <Link
                    href={`/panel/admin/users/${u?._id}`}
                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white transition py-2 rounded-xl text-xs font-bold shadow-sm mt-1"
                  >
                    مشاهده پرونده کاربر ←
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}