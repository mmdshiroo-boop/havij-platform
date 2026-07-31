"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import apiClient from "@/services/api/client";

export default function VipFavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/favorites");
      setFavorites(response.data.data || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (adId: string) => {
    try {
      await apiClient.delete(`/favorites/${adId}`);
      toast.success("از علاقه‌مندی‌ها حذف شد");
      fetchFavorites();
    } catch (error) {
      toast.error("خطا در حذف");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">نشان شده‌ها</h1>
        <p className="text-sm text-muted-foreground">
          آگهی‌هایی که ذخیره کرده‌اید
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">هیچ آگهی ذخیره‌ای ندارید</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {favorites.map((item) => (
            <Card key={item._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{item.ad?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.ad?.city} • {item.ad?.price?.toLocaleString()} تومان
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/ad/${item.ad?._id}`}>
                      <Button variant="outline" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500"
                      onClick={() => removeFavorite(item.ad?._id)}
                    >
                      <Heart className="w-4 h-4 fill-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
