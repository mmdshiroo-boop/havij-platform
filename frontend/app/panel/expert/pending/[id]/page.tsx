// frontend/app/(main)/panel/expert/pending-ads/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  Tag,
  Eye,
  Phone,
  AlertTriangle,
  FileText,
  Home,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";

import { expertApi } from "@/services/api/expert.api";

export default function ExpertReviewAdPage() {
  const params = useParams();
  const router = useRouter();
  const adId = params.id as string;

  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (adId) {
      fetchAdDetails();
    }
  }, [adId]);

  const fetchAdDetails = async () => {
    try {
      setLoading(true);
      const response = await expertApi.getPendingAdById(adId);
      console.log("✅ Ad data received:", response);

      // اصلاح: داده‌ها می‌توانند در response.data یا مستقیماً در response باشند
      let adData = response.data || response;

      // اگر response خودش یک آبجکت با success و data داشت
      if (response.success && response.data) {
        adData = response.data;
      }

      setAd(adData);
    } catch (error: any) {
      console.error("❌ Error fetching ad:", error);
      toast.error(
        error?.response?.data?.message || "خطا در دریافت اطلاعات آگهی",
      );
      router.push("/panel/expert/pending-ads");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await expertApi.approveAd(adId);
      toast.success("✅ آگهی با موفقیت تایید شد");
      router.push("/panel/expert/pending-ads");
    } catch (error: any) {
      console.error("❌ Error approving ad:", error);
      toast.error(error?.response?.data?.message || "خطا در تایید آگهی");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("لطفاً دلیل رد آگهی را وارد کنید");
      return;
    }

    try {
      setSubmitting(true);
      await expertApi.rejectAd(adId, rejectionReason);
      toast.success("❌ آگهی با موفقیت رد شد");
      router.push("/panel/expert/pending-ads");
    } catch (error: any) {
      console.error("❌ Error rejecting ad:", error);
      toast.error(error?.response?.data?.message || "خطا در رد آگهی");
    } finally {
      setSubmitting(false);
      setShowRejectModal(false);
      setRejectionReason("");
    }
  };

  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return "نامشخص";
    return new Intl.NumberFormat("fa-IR").format(price);
  };

  const formatDate = (date?: string) => {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR");
  };

  // تابع کمکی برای نمایش آدرس
  const getLocationText = () => {
    if (!ad) return "نامشخص";

    // اگر location object داریم
    if (ad.location) {
      let text = "";
      if (ad.location.province) text += ad.location.province;
      if (ad.location.city) text += (text ? "، " : "") + ad.location.city;
      if (ad.location.district)
        text += (text ? " - " : "") + ad.location.district;
      if (text) return text;
    }

    // فیلدهای مستقیم
    if (ad.city) return ad.city;
    if (ad.province) return ad.province;
    if (ad.address) return ad.address;

    return "موقعیت نامشخص";
  };

  // دریافت نام کاربر
  const getUserName = () => {
    if (!ad) return "نامشخص";
    if (ad.userId?.firstName)
      return `${ad.userId.firstName} ${ad.userId.lastName || ""}`;
    if (ad.user?.firstName)
      return `${ad.user.firstName} ${ad.user.lastName || ""}`;
    if (ad.fullName) return ad.fullName;
    if (ad.contactName) return ad.contactName;
    return "نامشخص";
  };

  // دریافت شماره تماس
  const getUserPhone = () => {
    if (!ad) return null;
    return (
      ad.phoneNumber ||
      ad.userId?.phone ||
      ad.user?.phone ||
      ad.contactPhone ||
      null
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">آگهی یافت نشد</h2>
        <p className="text-gray-500 mb-6">
          آگهی مورد نظر وجود ندارد یا حذف شده است
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6" dir="rtl">
      {/* دکمه بازگشت */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>بازگشت به لیست آگهی‌ها</span>
      </button>

      {/* هدر */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-500">
                در انتظار بررسی • ثبت شده در {formatDate(ad.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {ad.title || "بدون عنوان"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                <span>{ad.category?.name || "دسته‌بندی نشده"}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{getLocationText()}</span>
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(ad.price)} تومان
          </div>
        </div>
      </div>

      {/* دو ستونه */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ستون راست - جزئیات */}
        <div className="lg:col-span-2 space-y-6">
          {/* تصاویر */}
          {ad.images && ad.images.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                تصاویر آگهی
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ad.images.map((image: string, index: number) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={image}
                      alt={`تصویر ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* توضیحات */}
          {ad.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                توضیحات
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {ad.description}
              </p>
            </div>
          )}

          {/* جزئیات ملک */}
          {ad.propertyDetails && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5" />
                جزئیات ملک
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {ad.propertyDetails.area && (
                  <div>
                    <span className="text-sm text-gray-500">متراژ:</span>
                    <p className="font-medium">
                      {ad.propertyDetails.area} متر مربع
                    </p>
                  </div>
                )}
                {ad.propertyDetails.rooms && (
                  <div>
                    <span className="text-sm text-gray-500">تعداد اتاق:</span>
                    <p className="font-medium">{ad.propertyDetails.rooms}</p>
                  </div>
                )}
                {ad.propertyDetails.propertyType && (
                  <div>
                    <span className="text-sm text-gray-500">نوع ملک:</span>
                    <p className="font-medium">
                      {ad.propertyDetails.propertyType}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ستون چپ - عملیات */}
        <div className="space-y-6">
          {/* کارت اقدامات */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              اقدامات کارشناسی
            </h2>

            <div className="space-y-4">
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? "در حال تایید..." : "تایید آگهی"}
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                disabled={submitting}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                رد آگهی
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                یادداشت کارشناسی (اختیاری)
              </label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="یادداشت‌های خود را وارد کنید..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* اطلاعات آگهی دهنده */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              اطلاعات آگهی‌دهنده
            </h2>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">
                  نام و نام خانوادگی:
                </span>
                <p className="font-medium">{getUserName()}</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">شماره تماس:</span>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium text-left">
                    {getUserPhone() || "نامشخص"}
                  </p>
                  {getUserPhone() && (
                    <button
                      onClick={() =>
                        (window.location.href = `tel:${getUserPhone()}`)
                      }
                      className="p-1 text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500">آمار بازدید:</span>
                <div className="flex items-center gap-1 mt-1">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{ad.views || 0} بازدید</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* مودال رد آگهی */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6" dir="rtl">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              رد آگهی
            </h2>

            <p className="text-gray-700 mb-4">
              لطفاً دلیل رد این آگهی را وارد کنید:
            </p>

            <textarea
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              placeholder="مثال: اطلاعات ناقص، قیمت نامعقول، تخلف از قوانین..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "در حال ثبت..." : "رد آگهی"}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
