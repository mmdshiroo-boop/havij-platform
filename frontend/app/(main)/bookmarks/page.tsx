"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { favoriteApi, FavoriteAd } from "@/services/api/favorite.api";
import { Trash2, Bookmark, MapPin, ImageOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const getImageUrl = (path?: string) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE.replace("/api", "")}${path}`;
};

const formatPrice = (price?: number | null) => {
  if (!price || price === 0) return "توافقی";
  return price.toLocaleString("fa-IR");
};

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<FavoriteAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchFavorites = async () => {
    try {
      const data = await favoriteApi.getFavorites();
      setAds(data || []);
    } catch (error) {
      toast.error("خطا در دریافت ذخیره‌شده‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const handleRemove = async (e: React.MouseEvent, adId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await favoriteApi.removeFavorite(adId);
      setAds((prev) => prev.filter((ad) => ad._id !== adId));
      toast.success("از ذخیره‌شده‌ها حذف شد");
    } catch (error) {
      toast.error("خطا در حذف آگهی");
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
        <div className="flex items-center gap-3 border-b pb-4 border-border/50">
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      {/* هدر موبایل (فقط نمایش در موبایل) */}
      <div className="md:hidden flex items-center gap-3 border-b pb-4 border-border/50 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl hover:bg-muted shrink-0"
        >
          <ArrowRight className="w-5 h-5 text-foreground" />
        </Button>
        <h1 className="text-xl font-black text-foreground">ذخیره‌شده‌ها</h1>
      </div>

      {/* هدر دسکتاپ (مخفی در موبایل) */}
      <div className="hidden md:flex items-center justify-between border-b pb-4 border-border/50">
        <div className="flex items-center gap-3">
          <Bookmark className="w-6 h-6 text-primary fill-none" />
          <h1 className="text-2xl font-black text-foreground">ذخیره‌شده‌ها</h1>
          <span className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-bold">
            {ads.length} آگهی
          </span>
        </div>
      </div>

      {/* لیست آگهی‌ها */}
      {ads.length === 0 ? (
        <Card className="border border-dashed bg-muted/20 shadow-none">
          <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <Bookmark className="w-16 h-16 mb-4 text-muted-foreground/30" />
            <h3 className="font-bold text-lg text-foreground mb-2">
              لیست ذخیره‌شده‌های شما خالی است
            </h3>
            <Link href="/">
              <Button className="px-8 rounded-xl font-bold bg-primary hover:bg-primary/90">
                مشاهده آگهی‌ها
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {ads.map((ad) => {
            const imageSrc = getImageUrl(ad.images?.[0]);
            return (
              <Link key={ad._id} href={`/ad/${ad._id}`} className="block group">
                {/* ساختار کارت آگهی (بدون تغییر) */}
                <div className="flex flex-col h-full rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative max-sm:flex-row-reverse max-sm:h-[140px] max-sm:rounded-none max-sm:border-0 max-sm:border-b max-sm:border-border/40 max-sm:p-3 max-sm:gap-3">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted/20 shrink-0 max-sm:w-[130px] max-sm:h-full max-sm:rounded-xl">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={ad.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageOff className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <button
                      onClick={(e) => handleRemove(e, ad._id)}
                      className="absolute top-2.5 right-2.5 z-30 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-red-500/90 text-white shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col flex-1 px-3 py-3 gap-2">
                    <h3 className="font-bold text-[14px] text-foreground leading-relaxed line-clamp-2">
                      {ad.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto">
                      <MapPin className="w-3.5 h-3.5" /> <span>{ad.city}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
