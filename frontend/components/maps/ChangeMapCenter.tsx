import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function ChangeMapCenter({
  center,
}: {
  center: [number, number];
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}
