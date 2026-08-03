"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/getImageUrl";
import { motion } from "framer-motion";
import apiClient from "@/services/api/client";
import {
  LayoutDashboard,
  FileText,
  Bookmark,
  User,
  Crown,
  Settings,
  LogOut,
  Building,
  Users,
  Shield,
  Clock,
  MessageSquare,
  Gift,
  TrendingUp,
  Key,
  BookOpen,
  CheckCircle,
  XCircle,
  BarChart3,
  Bell,
  Ticket,
  Flag,
  Database,
  Webhook,
  SlidersHorizontal,
  CreditCard,
  Globe,
  MessageCircle,
  ShieldCheck,
  ScrollText,
  Cookie,
  Download,
  Search,
  ShieldAlert,
  Activity,
  HomeIcon,
  Moon,
  Sun,
  ChevronLeft,
  Edit,
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

// ═══════════════ منوها (همان تعاریف قبلی) ═══════════════
const userMenu = [
  { href: "/panel/user/dashboard", label: "داشبورد عملکرد", icon: LayoutDashboard },
  { href: "/panel/user/my-ads", label: "آگهی‌های من", icon: FileText },
  { href: "/panel/user/bookmarks", label: "ذخیره‌شده‌ها", icon: Bookmark },
  { href: "/panel/user/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/user/tickets", label: "تیکت‌های من", icon: Ticket },
  { href: "/panel/user/my-consulting", label: "مشاوره‌های من", icon: MessageSquare },
  { href: "/panel/user/comments", label: "نظرات آگهی‌های من", icon: MessageSquare },
  { href: "/panel/user/reports-my", label: "گزارشات تخلف من", icon: Flag },
  { href: "/panel/user/profile", label: "پروفایل کاربری", icon: User },
  { href: "/panel/user/settings", label: "تنظیمات پنل", icon: Settings },
];

const vipMenu = [
  { href: "/panel/vip/dashboard", label: "داشبورد ویژه", icon: LayoutDashboard },
  { href: "/panel/vip/my-ads", label: "آگهی‌های من", icon: Crown },
  { href: "/panel/vip/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/vip/analytics", label: "آمار و تحلیل", icon: TrendingUp },
  { href: "/panel/vip/agents", label: "مدیریت کارشناسان آژانس", icon: HomeIcon },
  { href: "/panel/vip/market-analysis", label: "تحلیل صنف و بازار", icon: BarChart3 },
  { href: "/panel/vip/bookmarks", label: "ذخیره‌شده‌ها", icon: Bookmark },
  { href: "/panel/vip/comments", label: "نظرات آگهی‌های من", icon: MessageSquare },
  { href: "/panel/vip/my-consulting", label: "مشاوره های  من", icon: MessageSquare },
  { href: "/panel/vip/reports-my", label: "گزارشات", icon: FileText },
  { href: "/panel/vip/support", label: "تیکت پشتیبانی", icon: MessageSquare },
  { href: "/panel/vip/settings", label: "تنظیمات", icon: Settings },
  { href: "/panel/vip/profile", label: "پروفایل", icon: User },
];

const agentMenu = [
  { href: "/panel/agent/dashboard", label: "داشبورد آژانس", icon: LayoutDashboard },
  { href: "/panel/agent/consulting", label: "مشاوره‌های من", icon: MessageSquare },
  { href: "/panel/agent/advanced-search", label: "جستجوی پیشرفته", icon: Search },
  { href: "/panel/agent/my-ads", label: "آگهی‌های من", icon: FileText },
  { href: "/panel/agent/bookmarks", label: "ذخیره‌شده‌ها", icon: Bookmark },
  { href: "/panel/agent/comments", label: "نظرات آگهی‌های من", icon: MessageSquare },
  { href: "/panel/agent/tickets", label: "تیکت‌های پشتیبانی", icon: Ticket },
  { href: "/panel/agent/properties", label: "فهرست املاک", icon: Building },
  { href: "/panel/agent/agents", label: "مدیریت مشاوران", icon: Users },
  { href: "/panel/agent/reports", label: "گزارشات آژانس", icon: FileText },
  { href: "/panel/agent/market-analysis", label: "تحلیل بازار", icon: TrendingUp },
  { href: "/panel/agent/chat", label: "گفتگوی داخلی", icon: MessageSquare },
  { href: "/panel/agent/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/agent/reports-my", label: "گزارشات تخلف من", icon: Flag },
  { href: "/panel/agent/settings", label: "تنظیمات", icon: Settings },
  { href: "/panel/agent/profile", label: "پروفایل مدیریتی", icon: User },
];

const developerMenu = [
  { href: "/panel/developer/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/panel/developer/api-key", label: "API Keys", icon: Key },
  { href: "/panel/developer/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/panel/developer/logs", label: "لاگ‌ها و آنالیتیکس", icon: BarChart3 },
  { href: "/panel/developer/docs", label: "مستندات", icon: BookOpen },
  { href: "/panel/developer/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/developer/reports-my", label: "گزارشات تخلف من", icon: Flag },
  { href: "/panel/developer/settings", label: "تنظیمات", icon: Settings },
  { href: "/panel/developer/profile", label: "پروفایل", icon: User },
];

const expertMenu = [
  { href: "/panel/expert/dashboard", label: "داشبورد کارشناسی", icon: LayoutDashboard },
  { href: "/panel/expert/bulk-upload", label: "بارگذاری آگهی", icon: Download },
  { href: "/panel/expert/pending", label: "در انتظار بررسی", icon: Clock },
  { href: "/panel/expert/approved", label: "تایید شده‌ها", icon: CheckCircle },
  { href: "/panel/expert/rejected", label: "رد شده‌ها", icon: XCircle },
  { href: "/panel/expert/verify-ads", label: "تأیید آگهی", icon: ShieldCheck },
  { href: "/panel/expert/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/expert/chat", label: "اتاق گفتگو", icon: MessageSquare },
  { href: "/panel/expert/tickets", label: "تیکت‌ها و پشتیبانی", icon: Ticket },
  { href: "/panel/expert/reports", label: "گزارشات", icon: BarChart3 },
  { href: "/panel/expert/consulting", label: "مشاوره", icon: Users },
  { href: "/panel/expert/bookmarks", label: "نشان‌ها", icon: Bookmark },
  { href: "/panel/expert/reports-my", label: "گزارشات تخلف من", icon: Flag },
  { href: "/panel/expert/profile", label: "پروفایل کارشناس", icon: User },
  { href: "/panel/expert/settings", label: "تنظیمات", icon: Settings },
];

const adminMenu = [
  { href: "/panel/admin/dashboard", label: "داشبورد مدیریت", icon: LayoutDashboard },
  { href: "/panel/admin/users", label: "مدیریت کاربران", icon: Users },
  { href: "/panel/admin/ads", label: "مدیریت آگهی‌ها", icon: FileText },
  { href: "/panel/admin/tickets", label: "مدیریت تیکت‌ها", icon: Ticket },
  { href: "/panel/admin/reports", label: "گزارشات", icon: Flag },
  { href: "/panel/admin/analytics", label: "گزارشات پیشرفته", icon: Flag },
  { href: "/panel/admin/comments", label: "مدیریت نظرات", icon: MessageSquare },
  { href: "/panel/admin/profile", label: "پروفایل ادمین", icon: User },
  { href: "/panel/admin/settings", label: "تنظیمات سیستم", icon: Settings },
];

export const superAdminMenu = [
  { href: "/panel/super-admin/dashboard", label: "داشبورد مدیر ارشد", icon: LayoutDashboard },
  { href: "/panel/super-admin/blacklist-keywords", label: "کلمات سیاه‌لیست", icon: ShieldAlert },
  { href: "/panel/super-admin/cookie-audits", label: "رصد کوکی و نشست‌های کاربران", icon: Cookie },
  { href: "/panel/super-admin/ads", label: "مدیریت کل آگهی‌ها", icon: FileText },
  { href: "/panel/super-admin/users", label: "مدیریت کاربران", icon: Users },
  { href: "/panel/super-admin/admins", label: "مدیریت ادمین‌ها", icon: Shield },
  { href: "/panel/super-admin/chat-monitor", label: "رصد چت و پیام‌ها", icon: MessageCircle },
  { href: "/panel/super-admin/roles", label: "نقش‌ها و مجوزها", icon: SlidersHorizontal },
  { href: "/panel/super-admin/tickets", label: "مدیریت تیکت‌ها", icon: Ticket },
  { href: "/panel/super-admin/comments", label: "مدیریت کامنت‌ها", icon: MessageSquare },
  { href: "/panel/super-admin/financial", label: "گزارش‌های مالی", icon: CreditCard },
  { href: "/panel/super-admin/subscriptions", label: "پلن‌های اشتراک و VIP", icon: Gift },
  { href: "/panel/super-admin/banners", label: "مدیریت بنرها", icon: Globe },
  { href: "/panel/super-admin/market-analysis", label: "تحلیل بازار", icon: TrendingUp },
  { href: "/panel/super-admin/api-keys", label: "کلیدهای API", icon: Key },
  { href: "/panel/super-admin/webhooks", label: "وب‌هوک‌ها", icon: Webhook },
  { href: "/panel/super-admin/settings", label: "تنظیمات سایت", icon: Settings },
  { href: "/panel/super-admin/backup", label: "پشتیبان‌گیری", icon: Database },
  { href: "/panel/super-admin/audit-logs", label: "لاگ رویدادها", icon: ScrollText },
  { href: "/panel/super-admin/traffic", label: "ترافیک سایت", icon: Activity },
  { href: "/panel/super-admin/notifications", label: "اعلان‌های سیستمی", icon: Bell },
  { href: "/panel/super-admin/profile", label: "پروفایل مدیر ارشد", icon: User },
];

// ═══════════════ کامپوننت صفحه پروفایل ═══════════════
export default function ProfilePage() {
  const pathname = usePathname();
  const { user: authUser, logout, refreshUser } = useAuth();
  const { unreadCount } = useNotifications();

  const [menuItems, setMenuItems] = useState(userMenu);
  const [userRole, setUserRole] = useState<string>("user");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // state های مربوط به آپلود آواتار
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark", !isDarkMode);
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    if (!authUser) {
      setMenuItems(userMenu);
      setUserRole("user");
      return;
    }

    const role = (authUser.role || "user").replace("_", "-");
    setUserRole(role);

    switch (role) {
      case "vip": setMenuItems(vipMenu); break;
      case "agent": setMenuItems(agentMenu); break;
      case "developer": setMenuItems(developerMenu); break;
      case "expert": setMenuItems(expertMenu); break;
      case "admin": setMenuItems(adminMenu); break;
      case "super-admin": setMenuItems(superAdminMenu); break;
      default: setMenuItems(userMenu);
    }
  }, [authUser]);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      toast.success("با موفقیت از حساب خارج شدید");
    } catch (error) {
      toast.error("خروج از حساب با خطا مواجه شد");
    } finally {
      setLogoutLoading(false);
    }
  };

  const getInitials = () => {
    if (authUser?.firstName && authUser?.lastName) {
      return `${authUser.firstName[0]}${authUser.lastName[0]}`;
    }
    if (authUser?.firstName) return authUser.firstName[0];
    return authUser?.phone?.slice(-2) || "U";
  };

  const mainNavigation = menuItems.filter(
    (item) => !item.href.includes("profile") && !item.href.includes("settings")
  );
  const accountNavigation = menuItems.filter(
    (item) => item.href.includes("profile") || item.href.includes("settings")
  );

  // ─── مدیریت انتخاب فایل ─────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("لطفاً یک فایل تصویری انتخاب کنید");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("حجم تصویر نباید بیشتر از 2 مگابایت باشد");
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  // ─── آپلود آواتار (اصلاح endpoint) ────────────────────────
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await apiClient.post("/users/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (typeof refreshUser === "function") {
        await refreshUser();
      } else {
        window.dispatchEvent(new Event("avatar-updated"));
      }

      toast.success("آواتار با موفقیت آپلود شد");
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "خطا در آپلود تصویر";
      toast.error(message);
    } finally {
      setAvatarLoading(false);
    }
  };

  // ─── حذف آواتار ──────────────────────────────────────────
  const handleDeleteAvatar = async () => {
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      await apiClient.delete("/users/avatar");

      if (typeof refreshUser === "function") {
        await refreshUser();
      } else {
        window.dispatchEvent(new Event("avatar-updated"));
      }

      toast.success("آواتار با موفقیت حذف شد");
      setAvatarPreview(null);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "خطا در حذف تصویر";
      toast.error(message);
    } finally {
      setAvatarLoading(false);
    }
  };

  // تعیین منبع تصویر: preview موقت > آواتار کاربر > تصویر پیش‌فرض
  const avatarSrc = avatarPreview || (authUser?.avatar ? getImageUrl(authUser.avatar) : "/images/user.webp");
  const hasAvatar = !!(authUser?.avatar || avatarPreview);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background text-foreground p-3 md:p-6 pb-24 overflow-y-auto"
      dir="rtl"
    >
      {/* ═══════════════ هدر ═══════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-sm">
            <Edit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-foreground">
              ویرایش پروفایل
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              اطلاعات حساب کاربری خود را مدیریت کنید
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════ کارت آواتار ═══════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl px-4 py-6 md:px-6 md:py-8 shadow-xl shadow-black/5 dark:shadow-white/5"
      >
        <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8">
          {/* بخش تصویر آواتار (اندازه کوچک‌تر) */}
          <div className="relative group shrink-0">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 rounded-full ring-2 ring-primary/30 shadow-md">
              <AvatarImage src={avatarSrc} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl md:text-3xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* دکمه‌های شناور روی آواتار */}
            <div className="absolute -bottom-2 -right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
                title="آپلود عکس جدید"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              {hasAvatar && (
                <button
                  onClick={handleDeleteAvatar}
                  disabled={avatarLoading}
                  className="p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-all"
                  title="حذف عکس"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* کنترل‌های آپلود */}
          <div className="flex-1 text-center md:text-right space-y-3">
            <h3 className="text-base md:text-lg font-extrabold text-foreground">
              {hasAvatar ? "تصویر پروفایل شما" : "تصویر پروفایل ثبت نشده"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasAvatar
                ? "می‌توانید تصویر خود را تغییر دهید"
                : "یک عکس برای پروفایل خود آپلود کنید"}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {avatarError && (
              <p className="text-xs font-medium text-destructive bg-destructive/10 rounded-xl px-3 py-1.5 inline-block">
                {avatarError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
                  avatarLoading && "opacity-60 cursor-not-allowed"
                )}
              >
                {avatarLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {hasAvatar ? "آپلود عکس جدید" : "آپلود عکس"}
              </button>

              {hasAvatar && (
                <button
                  onClick={handleDeleteAvatar}
                  disabled={avatarLoading}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                    "bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95",
                    avatarLoading && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  حذف عکس فعلی
                </button>
              )}
            </div>

            {/* دکمه تأیید آپلود (فقط وقتی فایل جدید انتخاب شده) */}
            {avatarFile && (
              <div className="mt-3">
                <button
                  onClick={handleUploadAvatar}
                  disabled={avatarLoading}
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                    "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20",
                    avatarLoading && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {avatarLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  تأیید و ذخیره تصویر
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════ دسترسی‌های اصلی ═══════════════ */}
      {mainNavigation.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <p className="mb-3 px-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            دسترسی‌های اصلی
          </p>

          <div className="space-y-1 rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-2 shadow-lg shadow-black/5">
            {mainNavigation.map((item, index) => {
              const isActive = pathname === item.href;
              const badgeCount =
                item.href.includes("notifications") && unreadCount > 0
                  ? unreadCount
                  : null;

              return (
                <Link key={index} href={item.href} className="block">
                  <div
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-transform",
                          isActive ? "scale-110 text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          isActive ? "font-bold" : "font-medium"
                        )}
                      >
                        {item.label}
                      </span>
                      {badgeCount != null && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                          {badgeCount}
                        </span>
                      )}
                    </div>
                    <ChevronLeft
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════ تنظیمات و حساب ═══════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="mb-3 px-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
          تنظیمات و حساب
        </p>

        <div className="space-y-1 rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-2 shadow-lg shadow-black/5">
          {accountNavigation.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link key={index} href={item.href} className="block">
                <div
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-transform",
                        isActive ? "scale-110 text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        isActive ? "font-bold" : "font-medium"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                  <ChevronLeft
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
              </Link>
            );
          })}

          <hr className="my-2 border-border/50" />

          {/* حالت شب */}
          <div
            onClick={toggleTheme}
            className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-muted/60"
          >
            <div className="flex items-center gap-4">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">حالت شب</span>
            </div>
            <button
              type="button"
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                isDarkMode ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                  isDarkMode ? "left-1" : "left-6"
                )}
              />
            </button>
          </div>

          {/* خروج */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-destructive/10 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <LogOut className="h-5 w-5 text-destructive transition-transform" />
              <span className="text-sm font-bold text-destructive">
                {logoutLoading ? "در حال خروج..." : "خروج از حساب کاربری"}
              </span>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}