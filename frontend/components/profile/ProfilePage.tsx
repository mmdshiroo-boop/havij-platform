"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
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
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

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

export default function ProfilePage() {
  const pathname = usePathname();

  // ✅ logout را هم از context می‌گیریم
  const { user: authUser, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const [menuItems, setMenuItems] = useState(userMenu);
  const [userRole, setUserRole] = useState<string>("user");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
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
      case "vip":
        setMenuItems(vipMenu);
        break;
      case "agent":
        setMenuItems(agentMenu);
        break;
      case "developer":
        setMenuItems(developerMenu);
        break;
      case "expert":
        setMenuItems(expertMenu);
        break;
      case "admin":
        setMenuItems(adminMenu);
        break;
      case "super-admin":
        setMenuItems(superAdminMenu);
        break;
      default:
        setMenuItems(userMenu);
    }
  }, [authUser]);

  // ✅ خروج درست
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

  const getAvatarUrl = () => {
    if (!authUser?.avatar) return "";
    if (authUser.avatar.startsWith("http")) return authUser.avatar;
    return `${API_BASE.replace("/api", "")}${authUser.avatar}`;
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

  return (
    <div
      className="min-h-screen bg-background text-foreground p-4 md:p-6 pb-24"
      dir="rtl"
    >
      {/* کارت هدر پروفایل */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-5 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-full ring-2 ring-primary/20">
            <AvatarImage
              src={authUser?.avatar ? getAvatarUrl() : "/images/user.webp"}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-xl font-black text-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">
              {authUser?.firstName
                ? `${authUser.firstName} ${authUser.lastName || ""}`
                : "کاربر میهمان"}
            </h2>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {authUser?.phone || "شماره ثبت نشده"}
              </span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {userRole.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/panel/${userRole}/profile`}
          className="rounded-full bg-muted/50 p-2.5 text-muted-foreground transition hover:bg-accent"
        >
          <Edit className="h-5 w-5" />
        </Link>
      </div>

      {/* دسترسی‌های اصلی */}
      {mainNavigation.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 pr-2 text-xs font-bold tracking-wider text-muted-foreground">
            دسترسی‌های اصلی
          </p>

          <div className="space-y-1 rounded-2xl border border-border bg-card p-2 shadow-card">
            {mainNavigation.map((item, index) => {
              const isActive = pathname === item.href;

              const badgeCount =
                item.href.includes("notifications") && unreadCount > 0
                  ? unreadCount
                  : null;

              return (
                <MenuItem
                  key={index}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive}
                  badgeCount={badgeCount}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* تنظیمات و حساب */}
      <div>
        <p className="mb-3 pr-2 text-xs font-bold tracking-wider text-muted-foreground">
          تنظیمات و حساب
        </p>

        <div className="space-y-1 rounded-2xl border border-border bg-card p-2 shadow-card">
          {accountNavigation.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <MenuItem
                key={index}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isActive}
              />
            );
          })}

          <hr className="my-2 border-border" />

          {/* حالت شب */}
          <div
            onClick={toggleTheme}
            className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-4">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                حالت شب
              </span>
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
            className="group flex w-full items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-destructive/10 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <LogOut className="h-5 w-5 text-destructive transition-transform group-hover:scale-110" />
              <span className="text-sm font-bold text-destructive">
                {logoutLoading ? "در حال خروج..." : "خروج از حساب کاربری"}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

interface MenuItemProps {
  href: string;
  label: string;
  icon: any;
  isActive?: boolean;
  badgeCount?: number | null;
}

const MenuItem = ({
  href,
  label,
  icon: Icon,
  isActive,
  badgeCount,
}: MenuItemProps) => (
  <Link href={href} className="block w-full">
    <div
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200",
        isActive ? "bg-primary/10" : "hover:bg-accent"
      )}
    >
      <div className="flex items-center gap-4">
        <Icon
          className={cn(
            "h-5 w-5 transition-transform",
            isActive ? "scale-110 text-primary" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "text-sm",
            isActive ? "font-black text-primary" : "font-medium text-foreground"
          )}
        >
          {label}
        </span>

        {badgeCount ? (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
            {badgeCount}
          </span>
        ) : null}
      </div>

      <ChevronLeft
        className={cn(
          "h-4 w-4",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
    </div>
  </Link>
);