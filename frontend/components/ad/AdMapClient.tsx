"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const fixMarkerIcon = () => {
  if (typeof window !== "undefined") {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }
};

fixMarkerIcon();

function ChangeMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (center && center[0] && center[1] && map) {
      map.setView(center, map.getZoom(), { animate: false });
      timerId = setTimeout(() => {
        if (map && typeof map.invalidateSize === "function") {
          try {
            map.invalidateSize({ animate: false });
          } catch (error) {
            console.warn(
              "Leaflet map container was removed before invalidateSize could run.",
            );
          }
        }
      }, 150);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [center, map]);
  return null;
}

interface AdMapClientProps {
  city: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export function AdMapClient({ latitude, longitude }: AdMapClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultCenter: [number, number] = [35.6892, 51.389];
  const hasCoords =
    typeof latitude === "number" && typeof longitude === "number";
  const position: [number, number] = hasCoords
    ? [latitude!, longitude!]
    : defaultCenter;

  if (!isMounted || typeof window === "undefined") {
    return <div className="w-full h-full bg-muted/20 animate-pulse" />;
  }

  return (
    <MapContainer
      center={position}
      zoom={hasCoords ? 15 : 12}
      className="w-full h-full"
      zoomControl={true}
      scrollWheelZoom={true}
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasCoords && (
        <>
          <Marker position={position} />
          <ChangeMapCenter center={position} />
        </>
      )}
    </MapContainer>
  );
}
