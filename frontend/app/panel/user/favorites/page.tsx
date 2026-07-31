"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MapPin, Eye, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api/client";
import { Ad } from "@/services/api/ads.api";

const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "/placeholder.jpg";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/uploads")) {
    return `http://localhost:5000${imagePath}`;
  }
  return `http://localhost:5000/uploads/${imagePath}`;
};

export default function FavoritesPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, [page]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/favorites", {
        params: { page, limit: 12 },
      });
      setAds(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("خطا در دریافت نشان شده‌ها");
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (adId: string) => {
    setRemovingId(adId);
    try {
      await apiClient.delete(`/favorites/${adId}`);
      toast.success("آگهی از نشان شده‌ها حذف شد");
      fetchFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("خطا در حذف از نشان شده‌ها");
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (price: number) => {
    if (!price || price === 0) return "توافقی";
    return price.toLocaleString() + " تومان";
  };

  const formatDate = (date: string) => {
    const diffDays = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "امروز";
    if (diffDays === 1) return "دیروز";
    if (diffDays < 7) return `${diffDays} روز پیش`;
    return `${Math.floor(diffDays / 7)} هفته پیش`;
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        {/* هماهنگی اسکلتون لودینگ با چیدمان جدید ۴ ستونه */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر صفحه */}
      <div>
        <h1 className="text-2xl font-black">نشان شده‌ها</h1>
        <p className="text-muted-foreground text-sm mt-1">
          آگهی‌هایی که ذخیره کرده‌اید
        </p>
      </div>

      {/* وضعیت لیست آگهی‌ها */}
      {ads.length === 0 ? (
        <Card className="border-dashed border-muted-foreground/30 shadow-xs rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Heart className="w-10 h-10 text-orange-500 fill-orange-500/10" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              هیچ آگهی نشان شده‌ای وجود ندارد
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              با کلیک روی آیکون قلب در صفحه جزییات هر آگهی، می‌توانید آن‌ها را
              در این بخش دسترسی داشته باشید.
            </p>
            <Link href="/search">
              <Button className="gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-6 font-bold shadow-md shadow-orange-500/10">
                مشاهدۀ آگهی‌ها
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* تغییر گرید به حداکثر ۴ ستون برای مانیتورهای بزرگ (کارت‌های کوچک‌تر و منسجم‌تر) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map((ad) => (
              <Card
                key={ad._id}
                className="overflow-hidden group border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl"
              >
                <Link href={`/ad/${ad._id}`}>
                  {/* تغییر نسبت ابعاد تصویر به aspect-video جهت جمع‌وجورتر شدن کارت */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img
                      src={getImageUrl(ad.images?.[0])}
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.jpg";
                      }}
                    />
                    {ad.isUrgent && (
                      <Badge
                        variant="destructive"
                        className="absolute top-2.5 right-2.5 text-[10px] px-2 py-0.5 rounded-lg font-black shadow-sm"
                      >
                        فوری
                      </Badge>
                    )}
                  </div>
                </Link>

                <CardContent className="p-3.5 space-y-2.5">
                  <Link href={`/ad/${ad._id}`}>
                    <h3 className="font-bold text-foreground line-clamp-1 hover:text-orange-500 transition-colors text-sm">
                      {ad.title}
                    </h3>
                  </Link>

                  {/* تنظیم سایز فونت قیمت متناسب با ابعاد فشرده جدید کارت */}
                  <p className="text-base font-black text-orange-600 dark:text-orange-400">
                    {formatPrice(ad.price)}
                  </p>

                  <div className="flex justify-between items-center text-[11px] text-muted-foreground/90 border-t border-border/40 pt-2">
                    <span className="flex items-center gap-1 font-medium max-w-[70px] truncate">
                      <MapPin className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                      {ad.city}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                      {formatDate(ad.createdAt!)}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Eye className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                      {ad.views || 0}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-0.5 gap-1.5 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-[11px] h-8"
                    onClick={() => removeFavorite(ad._id)}
                    disabled={removingId === ad._id}
                  >
                    {removingId === ad._id ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    حذف از نشان شده‌ها
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* صفحه‌بندی */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl px-4 border-border hover:bg-orange-500/5 hover:text-orange-600 font-bold"
              >
                قبلی
              </Button>
              <span className="flex items-center px-4 text-sm font-semibold text-muted-foreground">
                صفحه {page} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl px-4 border-border hover:bg-orange-500/5 hover:text-orange-600 font-bold"
              >
                بعدی
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
