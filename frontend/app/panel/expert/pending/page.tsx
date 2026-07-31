"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Calendar,
  MapPin,
  DollarSign,
  User,
  Phone,
  Mail,
  Loader2,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { expertApi } from "@/services/api/expert.api";

interface Ad {
  _id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  images: string[];
  userId: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  category: { name: string };
  createdAt: string;
}

export default function ExpertPendingAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await expertApi.getPendingAds({
        page: 1,
        limit: 20,
        search: searchTerm || undefined,
      });
      // Handle different response structures
      const adsData = response.data || response.ads || [];
      setAds(adsData);
    } catch (error: any) {
      console.error("Error fetching pending ads:", error);
      toast.error(error?.response?.data?.message || "خطا در دریافت آگهی‌ها");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAds();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchAds]);

  const handleApprove = async (id: string) => {
    setApproveLoadingId(id);
    try {
      await expertApi.approveAd(id);
      toast.success("✅ آگهی با موفقیت تایید شد");
      fetchAds();
      setShowDetailModal(false);
      setSelectedAd(null);
    } catch (error: any) {
      console.error("Error approving ad:", error);
      toast.error(error?.response?.data?.message || "خطا در تایید آگهی");
    } finally {
      setApproveLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAd) return;
    if (!rejectReason.trim()) {
      toast.error("لطفاً دلیل رد آگهی را وارد کنید");
      return;
    }

    setActionLoading(true);
    try {
      await expertApi.rejectAd(selectedAd._id, rejectReason);
      toast.success("❌ آگهی با موفقیت رد شد");
      fetchAds();
      setShowDetailModal(false);
      setSelectedAd(null);
      setRejectReason("");
    } catch (error: any) {
      console.error("Error rejecting ad:", error);
      toast.error(error?.response?.data?.message || "خطا در رد آگهی");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailModal = (ad: Ad) => {
    setSelectedAd(ad);
    setRejectReason("");
    setShowDetailModal(true);
  };

  const formatPrice = (price: number) => {
    if (!price || price === 0) return "توافقی";
    if (price >= 1_000_000_000)
      return `${(price / 1_000_000_000).toFixed(1)} میلیارد تومان`;
    if (price >= 1_000_000)
      return `${(price / 1_000_000).toFixed(0)} میلیون تومان`;
    return price.toLocaleString() + " تومان";
  };

  const formatDate = (date: string) => {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR");
  };

  const getImageUrl = (url: string) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    return `${baseUrl}${url}`;
  };

  if (loading && ads.length === 0) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">آگهی‌های در انتظار تایید</h1>
          <p className="text-sm text-muted-foreground">
            بررسی و تایید آگهی‌های ثبت شده
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="جستجوی آگهی (عنوان، شهر)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 rounded-xl"
        />
      </div>

      {/* Ads List */}
      {ads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500/50" />
            <h3 className="text-lg font-semibold mb-2">
              هیچ آگهی در انتظار تایید نیست
            </h3>
            <p className="text-muted-foreground">همه آگهی‌ها بررسی شده‌اند</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ads.map((ad, index) => (
            <motion.div
              key={ad._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Image */}
                    <div className="w-full md:w-24 h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                      {ad.images?.[0] ? (
                        <img
                          src={getImageUrl(ad.images[0])}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder.jpg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-xs text-muted-foreground">
                            بدون تصویر
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{ad.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ad.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatPrice(ad.price)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(ad.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {ad.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 rounded-full"
                        onClick={() => openDetailModal(ad)}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden md:inline">جزئیات</span>
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 rounded-full bg-green-500 hover:bg-green-600"
                        onClick={() => handleApprove(ad._id)}
                        disabled={!!approveLoadingId}
                      >
                        {approveLoadingId === ad._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span className="hidden md:inline">تایید</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1 rounded-full"
                        onClick={() => openDetailModal(ad)}
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="hidden md:inline">رد</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl">
          {selectedAd && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedAd.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Images */}
                {selectedAd.images && selectedAd.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedAd.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={getImageUrl(img)}
                        alt={`تصویر ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">قیمت</p>
                    <p className="font-medium">
                      {formatPrice(selectedAd.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">شهر</p>
                    <p className="font-medium">{selectedAd.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">دسته‌بندی</p>
                    <p className="font-medium">{selectedAd.category?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">تاریخ ثبت</p>
                    <p className="font-medium">
                      {formatDate(selectedAd.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm text-muted-foreground">توضیحات</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {selectedAd.description}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold">اطلاعات تماس کاربر</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {selectedAd.userId.firstName}{" "}
                        {selectedAd.userId.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedAd.userId.phone}</span>
                    </div>
                    {selectedAd.userId.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedAd.userId.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reject Form */}
                <div className="border-t pt-4">
                  <Label>دلیل رد آگهی (اجباری برای رد)</Label>
                  <Textarea
                    placeholder="دلیل رد آگهی را وارد کنید..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  انصراف
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  رد آگهی
                </Button>
                <Button
                  onClick={() => handleApprove(selectedAd._id)}
                  disabled={!!approveLoadingId}
                  className="gap-2 bg-green-500 hover:bg-green-600"
                >
                  {approveLoadingId === selectedAd._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  تایید آگهی
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
