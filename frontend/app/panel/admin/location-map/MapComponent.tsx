"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { UserLocation } from "@/services/api/locationMap.api";
import {
  Phone,
  MapPin,
  Circle,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe,
} from "lucide-react";
import Link from "next/link";

interface MapComponentProps {
  locations: UserLocation[];
  selectedUserId?: string | null;
  onSelectUser: (user: UserLocation) => void;
  onMapReady?: (map: any) => void;
  markersRef?: React.MutableRefObject<{ [key: string]: any }>;
  onToggleFullscreen?: () => void;
}

// مرزهای دقیق جغرافیایی ایران جهت قفل کردن نقشه
const IRAN_BOUNDS: L.LatLngBoundsExpression = [
  [25.0, 44.0], // جنوب غربی ایران
  [39.8, 63.3], // شمال شرقی ایران
];

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// دکمه‌های کنترلی دقیقاً مشابه تصویر درخواستی شما
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
    <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-3 pointer-events-auto">
      {/* گروه زوم (مثبت و منفی) */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col overflow-hidden w-12">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map.zoomIn();
          }}
          className="p-3 hover:bg-gray-50 flex items-center justify-center transition-colors border-b border-gray-200 text-gray-800"
          title="بزرگ‌نمایی"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map.zoomOut();
          }}
          className="p-3 hover:bg-gray-50 flex items-center justify-center transition-colors text-gray-800"
          title="کوچک‌نمایی"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* دکمه تمام صفحه */}
      {onToggleFullscreen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
          className="bg-white rounded-2xl shadow-md border border-gray-200 w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-800"
          title="نقشه تمام صفحه"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      )}

      {/* دکمه ماهواره (کادر نارنجی با آیکون کره) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsSatellite((prev) => !prev);
        }}
        className="bg-[#EA580C] text-white rounded-2xl shadow-lg w-12 h-12 flex items-center justify-center hover:bg-[#C2410C] transition-colors"
        title="تغییر حالت نقشه / ماهواره"
      >
        <Globe className="w-6 h-6" />
      </button>
    </div>
  );
}

export function MapComponent({
  locations,
  selectedUserId,
  onSelectUser,
  onMapReady,
  markersRef,
  onToggleFullscreen,
}: MapComponentProps) {
  const defaultCenter: [number, number] = [32.5, 53.5];
  const [isSatellite, setIsSatellite] = useState<boolean>(false);

  // تغییر سورس ماهواره به سرورهای گوگل مپ (بدون مشکل تحریم در ایران)
  const tileUrl = isSatellite
    ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const createAvatarIcon = (
    user: any,
    isOnline: boolean,
    isSelected: boolean,
    isVip: boolean = false,
    isUrgent: boolean = false
  ) => {
    let borderColor = isOnline ? "#10B981" : "#94A3B8";
    if (isSelected) borderColor = "#EA580C";
    if (isVip) borderColor = "#8B5CF6";

    const size = isSelected ? 48 : 36;
    const avatarUrl = user?.avatar || "/images/user.webp";

    let badge = "";
    if (isVip) {
      badge = `<div class="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-10">★</div>`;
    } else if (isUrgent) {
      badge = `<div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-10">!</div>`;
    }

    return L.divIcon({
      className: "custom-avatar-marker bg-transparent border-0",
      html: `
        <div class="relative flex items-center justify-center" style="width:${size}px; height:${size}px;">
          <div class="relative w-full h-full rounded-full overflow-hidden border-2 shadow-md bg-white transition-all duration-300" style="border-color: ${borderColor};">
            <img src="${avatarUrl}" class="w-full h-full object-cover" onerror="this.src='/images/user.webp'" alt="user" />
          </div>
          ${badge}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2 - 5],
    });
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      minZoom={5} // جلوگیری از زوم به بیرون از نقشه ایران
      maxBounds={IRAN_BOUNDS} // قفل کردن موقعیت نقشه به مرزهای ایران
      maxBoundsViscosity={1.0} // مقاومت کامل در برابر کشیدن به بیرون مرز
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
        if (!loc.location?.coordinates || loc.location.coordinates.length < 2) return null;

        // رفع ارور تایپ اسکریپت با تبدیل موقت loc به any جهت خواندن lat/lng اختیاری
        const rawLoc = loc as any;
        const lat = rawLoc.lat ?? loc.location.coordinates[1];
        const lng = rawLoc.lng ?? loc.location.coordinates[0];
        const u = loc.userId as any;
        const isSelected = loc._id === selectedUserId;

        const avatarUrl = u?.avatar || "/images/user.webp";
        const fullName = `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "کاربر ناشناس";

        const icon = createAvatarIcon(
          u,
          rawLoc.isOnline ?? false,
          isSelected,
          u?.role === "vip",
          rawLoc.isUrgent ?? false
        );

        return (
          <Marker
            key={loc._id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{ click: () => onSelectUser(loc) }}
            ref={(ref) => {
              if (ref && markersRef?.current) markersRef.current[loc._id] = ref;
            }}
          >
            <Popup className="custom-popup">
              <div className="flex flex-col font-sans" dir="rtl">
                <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-border">
                    <img
                      src={avatarUrl}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/user.webp";
                      }}
                      alt={fullName}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground">{fullName}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Circle
                        className={`w-2 h-2 fill-current ${
                          rawLoc.isOnline ? "text-emerald-500" : "text-gray-400"
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {rawLoc.isOnline ? "آنلاین" : "آفلاین"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-mono">{u?.phone || "بدون شماره"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>
                      {rawLoc.city || "شهر نامشخص"} {rawLoc.district ? `(${rawLoc.district})` : ""}
                    </span>
                  </div>

                  <Link
                    href={`/panel/admin/users/${u?._id}`}
                    className="mt-2 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary transition-colors py-2 rounded-lg text-xs font-bold"
                  >
                    مشاهده پرونده کاربر <ExternalLink className="w-3 h-3" />
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