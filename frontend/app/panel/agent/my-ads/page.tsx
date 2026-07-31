"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/services/api/client";
import { InfoCardStatic } from "@/components/ui/info-card";

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
  category?: {
    _id: string;
    name: string;
  };
}

export default function AgentMyAds() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAds = async () => {
    try {
      const res = await apiClient.get("/ads/my");
      setAds(res.data.data || res.data.ads || []);
    } catch (err: any) {
      console.error("Fetch ads error:", err);
      toast.error("خطا در دریافت آگهی‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleDelete = async (adId: string) => {
    if (!confirm("آیا از حذف این آگهی مطمئن هستید؟")) return;
    setDeletingId(adId);
    try {
      await apiClient.delete(`/ads/${adId}`);
      toast.success("آگهی با موفقیت حذف شد");
      setAds((prev) => prev.filter((ad) => ad._id !== adId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در حذف آگهی");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { label: string; color: string; icon: React.ReactNode }
    > = {
      active: {
        label: "فعال",
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      },
      pending: {
        label: "در انتظار",
        color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      sold: {
        label: "فروخته شده",
        color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      },
      expired: {
        label: "منقضی شده",
        color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
        icon: <Ban className="w-3.5 h-3.5" />,
      },
      rejected: {
        label: "رد شده",
        color: "bg-red-500/10 text-red-600 border-red-500/20",
        icon: <Trash2 className="w-3.5 h-3.5" />,
      },
    };

    const item = config[status] || config.pending;
    return (
      <Badge
        variant="outline"
        className={`${item.color} flex items-center gap-1.5 px-2 py-0.5`}
      >
        {item.icon}
        {item.label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    if (!price || price === 0) return "توافقی";
    return price.toLocaleString("fa-IR") + " تومان";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const activeAds = ads.filter((a) => a.status === "active").length;
  const pendingAds = ads.filter((a) => a.status === "pending").length;
  const totalViews = ads.reduce((sum, a) => sum + a.views, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر سفید-نارنجی */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                آگهی‌های آژانس
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مدیریت آگهی‌های ثبت‌شده توسط آژانس شما
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAds}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              <RefreshCw className="w-4 h-4" /> بروزرسانی
            </Button>
            <Button
              onClick={() => router.push("/create-ad")}
              className="gap-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              ثبت آگهی جدید
            </Button>
          </div>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCardStatic
          icon={<FileText className="w-5 h-5" />}
          title="کل آگهی‌ها"
          value={ads.length}
        />
        <InfoCardStatic
          icon={<CheckCircle2 className="w-5 h-5" />}
          title="فعال"
          value={activeAds}
        />
        <InfoCardStatic
          icon={<Eye className="w-5 h-5" />}
          title="کل بازدیدها"
          value={totalViews.toLocaleString("fa-IR")}
        />
      </div>

      <Separator />

      {/* جدول آگهی‌ها */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <Card className="transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent shadow-md border-border/50">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              هنوز هیچ آگهی‌ای ثبت نکرده‌اید.
            </p>
            <Button
              onClick={() => router.push("/create-ad")}
              className="mt-4 gap-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              اولین آگهی را ثبت کنید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent shadow-md border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">عنوان آگهی</TableHead>
                  <TableHead className="text-right">دسته‌بندی</TableHead>
                  <TableHead className="text-right">قیمت</TableHead>
                  <TableHead className="text-right">شهر</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">بازدید</TableHead>
                  <TableHead className="text-right">تاریخ ثبت</TableHead>
                  <TableHead className="text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad._id} className="hover:bg-primary/5">
                    <TableCell className="font-semibold">
                      <Link
                        href={`/ad/${ad._id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {ad.title}
                      </Link>
                    </TableCell>
                    <TableCell>{ad.category?.name || "—"}</TableCell>
                    <TableCell>{formatPrice(ad.price)}</TableCell>
                    <TableCell>{ad.city}</TableCell>
                    <TableCell>{getStatusBadge(ad.status)}</TableCell>
                    <TableCell>{ad.views.toLocaleString("fa-IR")}</TableCell>
                    <TableCell className="text-xs">
                      {formatDate(ad.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => router.push(`/ad/${ad._id}`)}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            مشاهده
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/panel/agent/my-ads/edit-ad/${ad._id}`,
                              )
                            }
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            ویرایش
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(ad._id)}
                            disabled={deletingId === ad._id}
                            className="text-destructive"
                          >
                            {deletingId === ad._id ? (
                              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 ml-2" />
                            )}
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
