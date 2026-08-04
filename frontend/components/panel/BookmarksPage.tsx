"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { favoriteApi, FavoriteAd } from "@/services/api/favorite.api";
import { Bookmark, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AdCard } from "@/components/home/AdCard";

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

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      const data = await favoriteApi.getFavorites();
      setAds(data || []);
    } catch (error) {
      toast.error("خطا در دریافت ذخیره‌شده‌ها");
    } finally {
      setLoading(false);
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
      {/* هدر موبایل */}
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

      {/* هدر دسکتاپ */}
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
          {ads.map((ad) => (
  <AdCard
    key={ad._id}
    _id={ad._id}
    title={ad.title}
    price={ad.price || 0}
    city={ad.city}
    district={(ad as any).district}
    images={ad.images}
    createdAt={ad.createdAt}
    isUrgent={ad.isUrgent}
    isVerified={(ad as any).isVerified}
    adType={(ad as any).adType}
    userRole={(ad as any).userRole}
  />
))}
        </div>
      )}
    </div>
  );
}