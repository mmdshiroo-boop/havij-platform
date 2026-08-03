"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adBannerApi,
  AdBanner as AdBannerType,
} from "@/services/api/adBanner.api";
import { getImageUrl } from "@/lib/getImageUrl"; // ✅ helper مرکزی

interface AdBannerProps {
  position:
    | "home_top"
    | "home_bottom"
    | "sidebar_top"
    | "sidebar_bottom"
    | "search_top"
    | "search_bottom";
  className?: string;
}

export const AdBanner = ({ position, className = "" }: AdBannerProps) => {
  const [banners, setBanners] = useState<AdBannerType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setImgError(false);
    adBannerApi
      .getByPosition(position)
      .then((data) => {
        if (data && data.length > 0) {
          setBanners(data);
          adBannerApi.trackView(data[0]._id).catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [position]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        adBannerApi.trackView(banners[nextIndex]._id).catch(console.error);
        setImgError(false); // ریست خطا برای بنر جدید
        return nextIndex;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [banners]);

  if (loading) {
    return (
      <Skeleton className={`h-24 md:h-36 w-full rounded-xl ${className}`} />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  const rawImageUrl =
    isMobile && currentBanner.mobileImageUrl
      ? currentBanner.mobileImageUrl
      : currentBanner.imageUrl;

  const imageUrl = getImageUrl(rawImageUrl); // ✅ تبدیل مسیر با helper

  const renderBannerContent = () => (
    <div className="relative w-full overflow-hidden rounded-xl bg-neutral-50 border border-neutral-100/80 group transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="relative w-full aspect-[4/1] md:aspect-[5/1] max-h-[130px] md:max-h-[160px] min-h-[80px]">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
            تصویر بنر در دسترس نیست
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={currentBanner.title || "بنر تبلیغاتی"}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02] p-1"
            loading={position === "home_top" ? "eager" : "lazy"}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {currentBanner.description && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 text-right"
          dir="rtl"
        >
          <p className="text-white text-[11px] md:text-xs font-medium line-clamp-1">
            {currentBanner.description}
          </p>
        </div>
      )}
    </div>
  );

  if (currentBanner.linkUrl) {
    return (
      <Link
        href={currentBanner.linkUrl}
        target="_blank"
        rel="sponsored nofollow"
        className={`block w-full max-w-5xl mx-auto ${className}`}
        onClick={() => adBannerApi.trackClick(currentBanner._id)}
      >
        {renderBannerContent()}
      </Link>
    );
  }

  return (
    <div className={`w-full max-w-5xl mx-auto ${className}`}>
      {renderBannerContent()}
    </div>
  );
};