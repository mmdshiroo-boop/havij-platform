"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowRight,
  User,
  Phone,
  Calendar,
  Shield,
  Ban,
  CheckCircle2,
  Trash2,
  Mail,
  CreditCard,
  Clock,
  AlertTriangle,
  Loader2,
  Copy,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";

interface UserData {
  _id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  nationalCode?: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
  lastLogin?: string;
}

// کانفیگ جامع نقش‌ها با رنگ و آیکون
const roleConfig: Record<
  string,
  { label: string; badgeClass: string; icon: any }
> = {
  user: {
    label: "کاربر عادی",
    badgeClass:
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
    icon: User,
  },
  vip: {
    label: "کاربر ویژه",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: Shield,
  },
  agent: {
    label: "آژانس املاک",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: UserCheck,
  },
  expert: {
    label: "کارشناس",
    badgeClass:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: UserCheck,
  },
  developer: {
    label: "توسعه‌دهنده",
    badgeClass:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    icon: Shield,
  },
  admin: {
    label: "مدیر سیستم",
    badgeClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    icon: Shield,
  },
  super_admin: {
    label: "مدیر ارشد",
    badgeClass:
      "bg-red-600/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 font-bold",
    icon: Shield,
  },
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // وضعیت تغییر نقش
  const [selectedRole, setSelectedRole] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  // وضعیت مودال‌ها و عملیات‌ها
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banningUser, setBanningUser] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/users/admin/${userId}`);
      const userData = response.data?.data || response.data;
      setUser(userData);
      setSelectedRole(userData.role);
    } catch (err: any) {
      console.error("Error fetching user:", err);
      if (err.response?.status === 404) {
        setError("کاربر مورد نظر یافت نشد.");
        toast.error("کاربر یافت نشد");
      } else {
        setError("خطا در دریافت اطلاعات کاربر از سرور.");
        toast.error("خطا در دریافت اطلاعات کاربر");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === user?.role) return;
    setUpdatingRole(true);
    try {
      await apiClient.put(`/users/admin/${userId}/role`, {
        role: selectedRole,
      });
      toast.success("نقش کاربر با موفقیت تغییر یافت");
      fetchUser();
    } catch {
      toast.error("خطا در تغییر نقش کاربر");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleBanToggle = async () => {
    if (!user) return;
    setBanningUser(true);
    try {
      if (user.isBanned) {
        await apiClient.put(`/users/admin/${userId}/unban`);
        toast.success("حساب کاربر با موفقیت فعال شد");
      } else {
        await apiClient.put(`/users/admin/${userId}/ban`, {
          banReason: banReason || "توسط مدیریت",
        });
        toast.success("کاربر با موفقیت مسدود شد");
      }
      setBanDialogOpen(false);
      setBanReason("");
      fetchUser();
    } catch {
      toast.error("خطا در تغییر وضعیت مسدودیت کاربر");
    } finally {
      setBanningUser(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeletingUser(true);
    try {
      await apiClient.delete(`/users/admin/${userId}`);
      toast.success("کاربر با موفقیت حذف شد");
      router.push("/admin/users");
    } catch {
      toast.error("خطا در حذف کاربر");
    } finally {
      setDeletingUser(false);
      setDeleteDialogOpen(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} در حافظه کپی شد`);
  };

  const formatDate = (date?: string) => {
    if (!date) return "ثبت نشده";
    try {
      return new Date(date).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-right" dir="rtl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-6 bg-card rounded-2xl border border-border shadow-xs"
        dir="rtl"
      >
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold">خطا در دریافت اطلاعات</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {error || "کاربر یافت نشد"}
        </p>
        <div className="flex gap-2 mt-2">
          <Button
            onClick={fetchUser}
            variant="outline"
            className="gap-2 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </Button>
          <Link href="/admin/users">
            <Button className="rounded-xl">بازگشت به لیست کاربران</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentRoleInfo = roleConfig[user.role] || {
    label: user.role,
    badgeClass: "bg-gray-500/10 text-gray-700",
    icon: User,
  };

  const fullName =
    user.firstName || user.lastName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : "کاربر بدون نام";

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ==================== هدر صفحه ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/users">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-muted"
            >
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-border/60">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                {user.firstName?.[0] || user.phone?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-foreground">
                  {fullName}
                </h1>
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-0.5 rounded-lg border ${currentRoleInfo.badgeClass}`}
                >
                  {currentRoleInfo.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                {user.phone}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {user.isBanned ? (
            <Badge
              variant="destructive"
              className="gap-1 px-3 py-1 text-xs rounded-xl"
            >
              <Ban className="w-3.5 h-3.5" />
              حساب مسدود است
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 gap-1 px-3 py-1 text-xs rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" />
              حساب فعال است
            </Badge>
          )}
        </div>
      </div>

      {/* ==================== محتوای اصلی ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ستون راست: مشخصات فردی */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  اطلاعات حساب و مشخصات فردی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* نام */}
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                    <span className="text-xs text-muted-foreground">نام:</span>
                    <p className="font-semibold text-sm text-foreground">
                      {user.firstName || "—"}
                    </p>
                  </div>

                  {/* نام خانوادگی */}
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                    <span className="text-xs text-muted-foreground">
                      نام خانوادگی:
                    </span>
                    <p className="font-semibold text-sm text-foreground">
                      {user.lastName || "—"}
                    </p>
                  </div>

                  {/* شماره موبایل */}
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> شماره همراه:
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(user.phone, "شماره موبایل")
                        }
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="کپی"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p
                      className="font-semibold text-sm text-foreground"
                      dir="ltr"
                    >
                      {user.phone}
                    </p>
                  </div>

                  {/* ایمیل */}
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> آدرس ایمیل:
                      </span>
                      {user.email && (
                        <button
                          onClick={() => copyToClipboard(user.email!, "ایمیل")}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="کپی"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-foreground break-all">
                      {user.email || "ثبت نشده"}
                    </p>
                  </div>

                  {/* کد ملی */}
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> کد ملی:
                    </span>
                    <p className="font-semibold text-sm text-foreground">
                      {user.nationalCode || "ثبت نشده"}
                    </p>
                  </div>

                  {/* تاریخ عضویت */}
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> تاریخ عضویت:
                    </span>
                    <p className="font-semibold text-sm text-foreground">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>

                  {/* آخرین ورود */}
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1 sm:col-span-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> آخرین ورود به سیستم:
                    </span>
                    <p className="font-semibold text-sm text-foreground">
                      {formatDate(user.lastLogin)}
                    </p>
                  </div>
                </div>

                {/* هشدار در صورت مسدود بودن */}
                {user.isBanned && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>علت مسدودیت حساب</span>
                    </div>
                    <p className="text-xs text-destructive/90 pr-6">
                      {user.banReason || "علت مشخصی توسط مدیر ثبت نشده است."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ستون چپ: پنل‌های مدیریتی */}
        <div className="space-y-6">
          {/* کارت تغییر نقش */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  مدیریت سطح دسترسی و نقش
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    انتخاب نقش جدید
                  </Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full h-10 rounded-xl text-xs bg-background">
                      <SelectValue placeholder="انتخاب نقش" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {Object.entries(roleConfig).map(([key, item]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleRoleChange}
                  disabled={updatingRole || selectedRole === user.role}
                  className="w-full rounded-xl text-xs gap-2"
                >
                  {updatingRole && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  به‌روزرسانی نقش کاربر
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* کارت مدیریت وضعیت (مسدودسازی و حذف) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  {user.isBanned ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Ban className="w-4 h-4 text-amber-600" />
                  )}
                  عملیات حساس و وضعیت حساب
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {user.isBanned ? (
                  <Button
                    onClick={handleBanToggle}
                    disabled={banningUser}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-2"
                  >
                    {banningUser ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    رفع مسدودیت کاربر
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setBanDialogOpen(true)}
                    className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl text-xs gap-2"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    مسدودسازی حساب کاربر
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl text-xs gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف کامل کاربر از سامانه
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ==================== مودال مسدودسازی ==================== */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-md rounded-2xl p-6"
          dir="rtl"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-bold text-amber-600">
              مسدود کردن کاربر
            </DialogTitle>
            <DialogDescription className="text-xs">
              آیا از مسدودسازی حساب {fullName} اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                کاربر مسدود شده امکان ورود به حساب و ثبت آگهی را نخواهد داشت.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                علت مسدودسازی (اختیاری)
              </Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="علت مسدودسازی..."
                rows={3}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              className="rounded-xl text-xs"
              disabled={banningUser}
            >
              انصراف
            </Button>
            <Button
              onClick={handleBanToggle}
              disabled={banningUser}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs gap-1.5"
            >
              {banningUser ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ban className="w-3.5 h-3.5" />
              )}
              تایید مسدودسازی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== مودال حذف کاربر ==================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-md rounded-2xl p-6"
          dir="rtl"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-bold text-destructive">
              حذف کاربر
            </DialogTitle>
            <DialogDescription className="text-xs">
              آیا از حذف حساب کاربری {fullName} اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 my-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              این عملیات غیرقابل بازگشت است و تمام داده‌های کاربر حذف خواهند شد.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl text-xs"
              disabled={deletingUser}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deletingUser}
              className="rounded-xl text-xs gap-1.5"
            >
              {deletingUser ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              حذف قطعی کاربر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
