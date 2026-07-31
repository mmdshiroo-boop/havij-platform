"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  XCircle,
  Search,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { adminPanelApi } from "@/services/api/admin-panel.api";
import { toast } from "sonner";

interface Ad {
  _id: string;
  title: string;
  price: number;
  city: string;
  images: string[];
  rejectReason?: string;
  createdAt: string;
  userId: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export default function AdminRejectedAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  useEffect(() => {
    fetchAds();
  }, [searchTerm, pagination.page]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const response = await adminPanelApi.getRejectedAds({
        page: pagination.page,
        limit: 12,
        search: searchTerm || undefined,
      });
      setAds(response.data || []);
      setPagination({
        page: response.pagination?.page || 1,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1,
      });
    } catch (error) {
      console.error("Error fetching rejected ads:", error);
      toast.error("خطا در دریافت آگهی‌های رد شده");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (!price) return "توافقی";
    if (price >= 1_000_000_000)
      return `${(price / 1_000_000_000).toFixed(1)} میلیارد تومان`;
    if (price >= 1_000_000)
      return `${(price / 1_000_000).toFixed(0)} میلیون تومان`;
    return price.toLocaleString() + " تومان";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fa-IR");
  };

  const getImageUrl = (url: string) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    return `${baseUrl}${url}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56 mt-1" />
          </div>
        </div>
        <Skeleton className="h-10 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">آگهی‌های رد شده</h1>
        <p className="text-sm text-muted-foreground">
          لیست آگهی‌هایی که توسط کارشناسان رد شده‌اند
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="جستجوی آگهی..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 rounded-xl"
        />
      </div>

      {/* Ads Grid */}
      {ads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500/50" />
            <h3 className="text-lg font-semibold mb-2">
              هیچ آگهی رد شده‌ای وجود ندارد
            </h3>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad, index) => (
              <motion.div
                key={ad._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all group">
                  <div className="relative h-48 bg-muted overflow-hidden">
                    <img
                      src={getImageUrl(ad.images?.[0])}
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-white">رد شده</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg line-clamp-1">
                      {ad.title}
                    </h3>
                    <p className="text-xl font-bold text-primary mt-1">
                      {formatPrice(ad.price)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{ad.city}</span>
                    </div>
                    {ad.rejectReason && (
                      <div className="mt-2 p-2 rounded-lg bg-red-500/10 text-red-600 text-xs">
                        دلیل رد: {ad.rejectReason}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(ad.createdAt)}</span>
                      </div>
                      <Link href={`/ad/${ad._id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          مشاهده
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
              >
                قبلی
              </Button>
              <span className="flex items-center px-4 text-sm">
                صفحه {pagination.page} از {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.pages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.pages}
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
