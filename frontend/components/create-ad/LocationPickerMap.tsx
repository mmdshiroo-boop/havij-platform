// components/create-ad/LocationPickerMap.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({
  initialLat = 35.6892,
  initialLng = 51.389,
  onLocationSelect,
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [marker, setMarker] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // ایمپورت پویای leaflet (فقط در کلاینت)
    const L = require("leaflet");
    // جلوگیری از ساخت نقشه تکراری
    if ((mapRef.current as any)._leaflet_map) return;

    const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    let currentMarker: L.Marker | null = null;

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setMarker([lat, lng]);
      onLocationSelect(lat, lng);

      if (currentMarker) {
        currentMarker.setLatLng([lat, lng]);
      } else {
        currentMarker = L.marker([lat, lng]).addTo(map);
      }
    });

    (mapRef.current as any)._leaflet_map = map;

    return () => {
      // ✅ بررسی وجود mapRef.current قبل از حذف نقشه
      if (mapRef.current && (mapRef.current as any)._leaflet_map) {
        map.remove();
        delete (mapRef.current as any)._leaflet_map;
      }
    };
  }, [initialLat, initialLng, onLocationSelect]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MapPin className="w-4 h-4 text-primary" />
        <span>روی نقشه کلیک کنید تا موقعیت دقیق مشخص شود</span>
      </div>
      <div
        ref={mapRef}
        className="w-full h-64 rounded-xl border border-border/50 overflow-hidden"
      />
      {marker && (
        <p className="text-xs text-emerald-600 font-bold">
          مختصات انتخاب‌شده: {marker[0].toFixed(6)} , {marker[1].toFixed(6)}
        </p>
      )}
    </div>
  );
}
