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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowRight, User, Phone, Calendar, Shield, Ban,
  CheckCircle2, Trash2, Mail, CreditCard, Clock,
  AlertTriangle, Loader2, Copy, RefreshCw, UserCheck,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";

interface UserData {
  _id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  nationalCode?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
  lastLogin?: string;
}

const roleConfig: Record<string, { label: string; badgeClass: string }> = {
  user: { label: "کاربر عادی", badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800" },
  vip: { label: "کاربر ویژه", badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  agent: { label: "آژانس املاک", badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  expert: { label: "کارشناس", badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  developer: { label: "توسعه‌دهنده", badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
  admin: { label: "مدیر سیستم", badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
  super_admin: { label: "مدیر ارشد", badgeClass: "bg-red-600/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800" },
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banningUser, setBanningUser] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => { if (userId) fetchUser(); }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/users/admin/${userId}`);
      const userData = response.data?.data || response.data;
      setUser(userData);
      setSelectedRole(userData.role);
    } catch (err: any) {
      setError(err.response?.status === 404 ? "کاربر مورد نظر یافت نشد." : "خطا در دریافت اطلاعات.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === user?.role) return;
    setUpdatingRole(true);
    try {
      await apiClient.put(`/users/admin/${userId}/role`, { role: selectedRole });
      toast.success("نقش کاربر تغییر یافت");
      fetchUser();
    } catch { toast.error("خطا در تغییر نقش"); }
    finally { setUpdatingRole(false); }
  };

  const handleBanToggle = async () => {
    if (!user) return;
    setBanningUser(true);
    try {
      if (user.isBanned) {
        await apiClient.put(`/users/admin/${userId}/unban`);
        toast.success("حساب کاربر فعال شد");
      } else {
        await apiClient.put(`/users/admin/${userId}/ban`, { banReason: banReason || "توسط مدیریت" });
        toast.success("کاربر مسدود شد");
      }
      setBanDialogOpen(false);
      setBanReason("");
      fetchUser();
    } catch { toast.error("خطا در تغییر وضعیت"); }
    finally { setBanningUser(false); }
  };

  const handleDeleteUser = async () => {
    setDeletingUser(true);
    try {
      await apiClient.delete(`/users/admin/${userId}`);
      toast.success("کاربر حذف شد");
      router.push("/panel/admin/users");
    } catch { toast.error("خطا در حذف کاربر"); }
    finally { setDeletingUser(false); setDeleteDialogOpen(false); }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} کپی شد`);
  };

  const formatDate = (date?: string) => {
    if (!date) return "ثبت نشده";
    try { return new Date(date).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return date; }
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-6" dir="rtl">
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <p className="text-sm text-muted-foreground">{error || "کاربر یافت نشد"}</p>
        <div className="flex gap-2">
          <Button onClick={fetchUser} variant="outline" className="gap-2 rounded-xl">
            <RefreshCw className="w-4 h-4" /> تلاش مجدد
          </Button>
          <Link href="/panel/admin/users">
            <Button className="rounded-xl">بازگشت</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentRoleInfo = roleConfig[user.role] || { label: user.role, badgeClass: "" };
  const fullName = user.firstName || user.lastName
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "کاربر بدون نام";

  // ★ همیشه یک src معتبر
  const avatarSrc = user.avatar ? getImageUrl(user.avatar) : "/images/user.webp";

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/panel/admin/users">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {/* ★ آواتار بدون children در AvatarFallback */}
            <Avatar className="h-12 w-12 border-2 border-border/60">
              <AvatarImage src={avatarSrc} alt={fullName} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-base" />
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold">{fullName}</h1>
                <Badge variant="outline" className={cn("text-xs px-2.5 py-0.5 rounded-lg border", currentRoleInfo.badgeClass)}>
                  {currentRoleInfo.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{user.phone}</p>
            </div>
          </div>
        </div>

        <div className="self-end sm:self-auto">
          {user.isBanned ? (
            <Badge variant="destructive" className="gap-1 px-3 py-1 text-xs rounded-xl">
              <Ban className="w-3.5 h-3.5" /> مسدود
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 gap-1 px-3 py-1 text-xs rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" /> فعال
            </Badge>
          )}
        </div>
      </div>

      {/* محتوا */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* مشخصات */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                اطلاعات حساب کاربری
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "نام", value: user.firstName || "—" },
                  { label: "نام خانوادگی", value: user.lastName || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3.5 rounded-xl bg-muted/20 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">{label}:</p>
                    <p className="font-semibold text-sm">{value}</p>
                  </div>
                ))}

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> شماره همراه:
                    </p>
                    <button onClick={() => copyToClipboard(user.phone, "شماره")}
                      className="text-muted-foreground hover:text-primary transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-semibold text-sm" dir="ltr">{user.phone}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> ایمیل:
                    </p>
                    {user.email && (
                      <button onClick={() => copyToClipboard(user.email!, "ایمیل")}
                        className="text-muted-foreground hover:text-primary transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="font-semibold text-sm break-all">{user.email || "ثبت نشده"}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <CreditCard className="w-3.5 h-3.5" /> کد ملی:
                  </p>
                  <p className="font-semibold text-sm">{user.nationalCode || "ثبت نشده"}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> تاریخ عضویت:
                  </p>
                  <p className="font-semibold text-sm">{formatDate(user.createdAt)}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 sm:col-span-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5" /> آخرین ورود:
                  </p>
                  <p className="font-semibold text-sm">{formatDate(user.lastLogin)}</p>
                </div>
              </div>

              {user.isBanned && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" /> علت مسدودیت
                  </div>
                  <p className="text-xs pr-6">{user.banReason || "علتی ثبت نشده"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* پنل‌های مدیریتی */}
        <div className="space-y-5">
          {/* تغییر نقش */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  سطح دسترسی و نقش
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">انتخاب نقش جدید</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full h-10 rounded-xl text-xs bg-background">
                      <SelectValue placeholder="انتخاب نقش" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {Object.entries(roleConfig).map(([key, item]) => (
                        <SelectItem key={key} value={key} className="text-xs">{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleRoleChange}
                  disabled={updatingRole || selectedRole === user.role}
                  className="w-full rounded-xl text-xs gap-2"
                >
                  {updatingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  به‌روزرسانی نقش
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* عملیات حساس */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  {user.isBanned
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    : <Ban className="w-4 h-4 text-amber-600" />
                  }
                  عملیات حساب
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {user.isBanned ? (
                  <Button
                    onClick={handleBanToggle} disabled={banningUser}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-2"
                  >
                    {banningUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    رفع مسدودیت
                  </Button>
                ) : (
                  <Button
                    variant="outline" onClick={() => setBanDialogOpen(true)}
                    className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl text-xs gap-2"
                  >
                    <Ban className="w-3.5 h-3.5" /> مسدودسازی
                  </Button>
                )}
                <Button
                  variant="outline" onClick={() => setDeleteDialogOpen(true)}
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl text-xs gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> حذف کاربر
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* مودال مسدودسازی */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl p-6" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-base font-bold text-amber-600">مسدود کردن کاربر</DialogTitle>
            <DialogDescription className="text-xs">آیا از مسدودسازی {fullName} اطمینان دارید؟</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-2">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>کاربر مسدود شده امکان ورود و ثبت آگهی را نخواهد داشت.</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">علت (اختیاری)</Label>
              <Textarea value={banReason} onChange={(e) => setBanReason(e.target.value)}
                placeholder="علت مسدودسازی..." rows={3} className="rounded-xl text-xs" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBanDialogOpen(false)} className="rounded-xl text-xs" disabled={banningUser}>
              انصراف
            </Button>
            <Button onClick={handleBanToggle} disabled={banningUser}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs gap-1.5">
              {banningUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              تایید مسدودسازی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال حذف */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl p-6" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-base font-bold text-destructive">حذف کاربر</DialogTitle>
            <DialogDescription className="text-xs">این عملیات غیرقابل بازگشت است.</DialogDescription>
          </DialogHeader>
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 my-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>تمامی داده‌های این کاربر پاک خواهد شد.</span>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl text-xs" disabled={deletingUser}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deletingUser} className="rounded-xl text-xs gap-1.5">
              {deletingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              حذف قطعی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}