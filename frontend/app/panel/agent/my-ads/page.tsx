// app/panel/agent/my-ads/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/services/api/client";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";

interface Ad {
  _id: string;
  title: string;
  price: number;
  priceType: string;
  city: string;
  status: "pending" | "active" | "sold" | "expired" | "rejected";
  views: number;
  createdAt: string;
  isVip: boolean;
  images?: string[];
  category?: { _id: string; name: string };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const formatPrice = (price: number) => {
  if (!price || price === 0) return "توافقی";
  return price.toLocaleString("fa-IR") + " تومان";
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fa-IR", {
    month: "long",
    day: "numeric",
  });
};

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    active: {
      label: "فعال",
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    pending: {
      label: "در انتظار",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    sold: {
      label: "فروخته شده",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    expired: {
      label: "منقضی شده",
      className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      icon: <Ban className="w-3.5 h-3.5" />,
    },
    rejected: {
      label: "رد شده",
      className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      icon: <Trash2 className="w-3.5 h-3.5" />,
    },
  };

  const item = config[status] || config.pending;
  return (
    <Badge variant="outline" className={cn("flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold", item.className)}>
      {item.icon}
      {item.label}
    </Badge>
  );
};

export default function AgentMyAds() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/ads/my");
      setAds(res.data.data || res.data.ads || []);
    } catch (err: any) {
      toast.error("خطا در دریافت آگهی‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/ads/${deleteId}`);
      toast.success("آگهی با موفقیت حذف شد");
      setAds((prev) => prev.filter((ad) => ad._id !== deleteId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در حذف آگهی");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const activeAds = ads.filter((a) => a.status === "active").length;
  const pendingAds = ads.filter((a) => a.status === "pending").length;
  const totalViews = ads.reduce((sum, a) => sum + (a.views || 0), 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* هدر */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              آگهی‌های آژانس
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              مدیریت آگهی‌های ثبت‌شده توسط آژانس شما
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAds}
            className="gap-2 rounded-xl border-border/60 hover:bg-muted"
          >
            <RefreshCw className="w-4 h-4" /> بروزرسانی
          </Button>
          <Button onClick={() => router.push("/create-ad")} className="gap-2 rounded-xl font-bold shadow-md shadow-primary/10">
            <PlusCircle className="w-4 h-4" />
            ثبت آگهی جدید
          </Button>
        </div>
      </motion.div>

      {/* کارت‌های آماری */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title="کل آگهی‌ها" value={ads.length.toLocaleString()} icon={FileText} />
        <StatCard title="فعال" value={activeAds.toLocaleString()} icon={CheckCircle2} />
        <StatCard title="کل بازدیدها" value={totalViews.toLocaleString()} icon={Eye} />
      </motion.div>

      {/* محتوا */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted flex items-center justify-center rounded-full text-muted-foreground/70">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1.5">
              هنوز هیچ آگهی‌ای ثبت نکرده‌اید
            </h3>
            <p className="text-muted-foreground text-xs font-medium mb-5">
              اولین آگهی خود را ثبت کنید
            </p>
            <Button onClick={() => router.push("/create-ad")} className="gap-2 rounded-xl font-bold">
              <PlusCircle className="w-4 h-4" />
              ثبت اولین آگهی
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
          {/* نسخهٔ دسکتاپ (جدول) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="text-right text-xs font-bold text-muted-foreground p-4">آگهی</th>
                  <th className="text-right text-xs font-bold text-muted-foreground p-4">قیمت</th>
                  <th className="text-right text-xs font-bold text-muted-foreground p-4">شهر</th>
                  <th className="text-right text-xs font-bold text-muted-foreground p-4">وضعیت</th>
                  <th className="text-right text-xs font-bold text-muted-foreground p-4">بازدید</th>
                  <th className="text-right text-xs font-bold text-muted-foreground p-4">تاریخ</th>
                  <th className="text-center text-xs font-bold text-muted-foreground p-4">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad._id} className="border-b border-border/20 hover:bg-muted/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(ad.images?.[0])}
                          alt={ad.title}
                          className="w-10 h-10 rounded-lg object-cover border border-border/30 shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/images/user.webp"; }}
                        />
                        <Link href={`/ad/${ad._id}`} className="font-bold text-sm hover:text-primary transition-colors line-clamp-1">
                          {ad.title}
                        </Link>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold">{formatPrice(ad.price)}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {ad.city}
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(ad.status)}</td>
                    <td className="p-4 text-sm">{ad.views.toLocaleString("fa-IR")}</td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(ad.createdAt)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-bold gap-1"
                          onClick={() => router.push(`/ad/${ad._id}`)}
                        >
                          <Eye className="w-3.5 h-3.5" /> مشاهده
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-bold gap-1 text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white"
                          onClick={() => router.push(`/panel/agent/my-ads/edit/${ad._id}`)}
                        >
                          <Edit className="w-3.5 h-3.5" /> ویرایش
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-bold gap-1 text-rose-500 border-rose-500/20 hover:bg-rose-600 hover:text-white"
                          onClick={() => setDeleteId(ad._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* نسخهٔ موبایل (کارت‌های لیستی) */}
          <div className="md:hidden divide-y divide-border/40">
            {ads.map((ad) => (
              <div key={ad._id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={getImageUrl(ad.images?.[0])}
                    alt={ad.title}
                    className="w-14 h-14 rounded-xl object-cover border border-border/30 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/user.webp"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link href={`/ad/${ad._id}`} className="font-bold text-sm line-clamp-1 hover:text-primary">
                      {ad.title}
                    </Link>
                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary/70" />
                        {ad.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary/70" />
                        {formatDate(ad.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-primary/70" />
                        {ad.views || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(ad.status)}
                      <p className="font-black text-primary text-sm">{formatPrice(ad.price)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end border-t border-border/30 pt-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1" onClick={() => router.push(`/ad/${ad._id}`)}>
                    <Eye className="w-3.5 h-3.5" /> مشاهده
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1 text-amber-600 border-amber-500/20" onClick={() => router.push(`/panel/agent/my-ads/edit/${ad._id}`)}>
                    <Edit className="w-3.5 h-3.5" /> ویرایش
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1 text-rose-500 border-rose-500/20" onClick={() => setDeleteId(ad._id)}>
                    <Trash2 className="w-3.5 h-3.5" /> حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* دیالوگ حذف */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md" dir="rtl">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-lg font-black text-destructive">حذف آگهی</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              آیا از حذف کامل این آگهی اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl text-sm font-bold">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-rose-500 hover:bg-rose-600 rounded-xl text-sm font-bold text-white gap-1"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}