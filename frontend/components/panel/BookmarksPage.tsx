"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { favoriteApi, FavoriteAd } from "@/services/api/favorite.api";
import { Trash2, Bookmark, MapPin } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export function BookmarksPage() {
  const [ads, setAds] = useState<FavoriteAd[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const data = await favoriteApi.getFavorites();
      setAds(data);
    } catch (error) {
      toast.error("خطا در دریافت ذخیره‌شده‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (adId: string) => {
    try {
      await favoriteApi.removeFavorite(adId);
      setAds((prev) => prev.filter((ad) => ad._id !== adId));
      toast.success("از ذخیره‌شده‌ها حذف شد");
    } catch (error) {
      toast.error("خطا در حذف");
    }
  };

  const getImageUrl = (path?: string) => {
    if (!path) return "/images/placeholder.jpg";
    if (path.startsWith("http")) return path;
    return `${API_BASE.replace("/api", "")}${path}`;
  };

  const formatPrice = (price: number) => {
    if (!price) return "توافقی";
    return price.toLocaleString("fa-IR") + " تومان";
  };

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Bookmark className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-extrabold">ذخیره‌شده‌ها</h1>
        <span className="text-sm text-muted-foreground">({ads.length})</span>
      </div>

      {ads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>هنوز آگهی‌ای ذخیره نکرده‌اید</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <Card
              key={ad._id}
              className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row">
                {/* تصویر */}
                <Link
                  href={`/ad/${ad._id}`}
                  className="relative w-full sm:w-40 h-32 shrink-0 bg-muted"
                >
                  <img
                    src={getImageUrl(ad.images?.[0])}
                    alt={ad.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </Link>
                {/* اطلاعات */}
                <div className="flex-1 flex items-center justify-between p-4">
                  <Link
                    href={`/ad/${ad._id}`}
                    className="space-y-1 flex-1 min-w-0"
                  >
                    <h3 className="font-bold text-sm truncate">{ad.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {ad.city}
                    </p>
                    <p className="text-primary font-extrabold text-sm">
                      {formatPrice(ad.price)}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleRemove(ad._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
