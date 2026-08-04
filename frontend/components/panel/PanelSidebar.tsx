// components/layout/PanelSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Heart,
  User,
  Home,
  Crown,
  Settings,
  LogOut,
  Building,
  Users,
  Shield,
  Code2,
  Clock,
  MessageSquare,
  Gift,
  TrendingUp,
  Key,
  BookOpen,
  CheckCircle,
  XCircle,
  BarChart3,
  Sparkles,
  Bell,
  Star,
  Ticket,
  Flag,
  Database,
  History,
  Webhook,
  Bookmark,
  Activity,
  ScrollText,
  Globe,
  CreditCard,
  SlidersHorizontal,
  MessageCircle,
  Cookie,
  ShieldAlert,
  MapPin,
  Download,
  ShieldCheck,
  Search,
  HomeIcon, // 🆕 برای ذخیره‌شده‌ها
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// ─── منوی کاربر عادی (USER) ───
export const userMenu = [
  {
    href: "/panel/user/dashboard",
    label: "داشبورد عملکرد",
    icon: LayoutDashboard,
  },
  {
    href: "/panel/user/consulting",
    label: "درخواست مشاوره",
    icon: MessageSquare,
  },
  {
    href: "/panel/user/my-consulting",
    label: "مشاوره‌های من",
    icon: MessageSquare,
  },
  { href: "/panel/user/my-ads", label: "آگهی‌های من", icon: FileText },
  { href: "/panel/user/bookmarks", label: "ذخیره‌شده‌ها", icon: Bookmark },
  { href: "/panel/user/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/user/tickets", label: "تیکت‌های من", icon: Ticket },
  {
    href: "/panel/user/comments",
    label: "نظرات آگهی‌های من",
    icon: MessageSquare,
  },
  { href: "/panel/user/reports-my", label: "گزارشات تخلف من", icon: Flag },
  { href: "/panel/user/profile", label: "پروفایل کاربری", icon: User },
  { href: "/panel/user/settings", label: "تنظیمات پنل", icon: Settings },
];

// ─── منوی VIP ───
export const vipMenu = [
  {
    href: "/panel/vip/dashboard",
    label: "داشبورد ویژه",
    icon: LayoutDashboard,
  },
  {
    href: "/panel/vip/consulting",
    label: "درخواست مشاوره",
    icon: MessageSquare,
  },
  {
    href: "/panel/vip/my-consulting",
    label: "مشاوره‌های من",
    icon: MessageSquare,
  },
  { href: "/panel/vip/my-ads", label: "آگهی‌های من", icon: Crown },
  {
    href: "/panel/vip/advanced-search",
    label: "جستجوی پیشرفته",
    icon: Search,
  },
  { href: "/panel/vip/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/vip/analytics", label: "آمار و تحلیل", icon: TrendingUp },
  {
    href: "/panel/vip/agents",
    label: "مدیریت کارشناسان آژانس",
    icon: HomeIcon,
  },
  {
    href: "/panel/vip/market-analysis",
    label: "تحلیل صنف و بازار",
    icon: BarChart3,
  },
  { href: "/panel/vip/bookmarks", label: "ذخیره‌شده‌ها", icon: Bookmark },
  {
    href: "/panel/vip/comments",
    label: "نظرات آگهی‌های من",
    icon: MessageSquare,
  },
  { href: "/panel/vip/reports-my", label: "گزارشات", icon: FileText },
  { href: "/panel/vip/support", label: "تیکت پشتیبانی", icon: MessageSquare },
  { href: "/panel/vip/profile", label: "پروفایل", icon: User },
  { href: "/panel/vip/settings", label: "تنظیمات", icon: Settings },
];

// ─── منوی آژانس (AGENT) ───
export const agentMenu = [
  {
    href: "/panel/agent/dashboard",
    label: "داشبورد آژانس",
    icon: LayoutDashboard,
  },
  {
    href: "/panel/agent/consulting",
    label: "درخواست مشاوره",
    icon: MessageSquare,
  },
  {
    href: "/panel/agent/my-consulting",
    label: "مشاوره‌های من",
    icon: MessageSquare,
  },
  {
    href: "/panel/agent/consulting/manage",
    label: "مدیریت درخواست‌ها",
    icon: Users,
  },
  { href: "/panel/agent/my-ads", label: "آگهی‌های من", icon: FileText },
  {
    href: "/panel/agent/advanced-search",
    label: "جستجوی پیشرفته",
    icon: Search,
  },
  { href: "/panel/agent/bookmarks", label: "ذخیره‌شده‌ها", icon: Bookmark },
  {
    href: "/panel/agent/comments",
    label: "نظرات آگهی‌های من",
    icon: MessageSquare,
  },
  { href: "/panel/agent/tickets", label: "تیکت‌های پشتیبانی", icon: Ticket },
  { href: "/panel/agent/properties", label: "فهرست املاک", icon: Building },
  { href: "/panel/agent/agents", label: "مدیریت مشاوران", icon: Users },
  { href: "/panel/agent/reports", label: "گزارشات آژانس", icon: FileText },
  {
    href: "/panel/agent/market-analysis",
    label: "تحلیل بازار",
    icon: TrendingUp,
  },
  { href: "/panel/agent/chat", label: "گفتگوی داخلی", icon: MessageSquare },
  { href: "/panel/agent/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/agent/reports-my", label: "گزارشات تخلف من", icon: Flag },
  { href: "/panel/agent/settings", label: "تنظیمات", icon: Settings },
  { href: "/panel/agent/profile", label: "پروفایل مدیریتی", icon: User },
];

// ─── منوی برنامه‌نویس (DEVELOPER) ───
export const developerMenu = [
  {
    href: "/panel/developer/dashboard",
    label: "داشبورد",
    icon: LayoutDashboard,
  },
  { href: "/panel/developer/api-key", label: "API Keys", icon: Key },
  { href: "/panel/developer/webhooks", label: "Webhooks", icon: Webhook },
  {
    href: "/panel/developer/logs",
    label: "لاگ‌ها و آنالیتیکس",
    icon: BarChart3,
  },
  { href: "/panel/developer/docs", label: "مستندات", icon: BookOpen },
  { href: "/panel/developer/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/developer/settings", label: "تنظیمات", icon: Settings },
  { href: "/panel/developer/profile", label: "پروفایل", icon: User },
];

// ─── منوی کارشناس (EXPERT) ───
export const expertMenu = [
  {
    href: "/panel/expert/dashboard",
    label: "داشبورد کارشناسی",
    icon: LayoutDashboard,
  },
  {
    href: "/panel/expert/consulting",
    label: "درخواست مشاوره",
    icon: MessageSquare,
  },
  {
    href: "/panel/expert/my-consulting",
    label: "مشاوره‌های من",
    icon: MessageSquare,
  },
  {
    href: "/panel/expert/consulting/manage",
    label: "مدیریت درخواست‌ها",
    icon: Users,
  },
  { href: "/panel/expert/bulk-upload", label: "بارگذاری آگهی", icon: Download },
  { href: "/panel/expert/pending", label: "در انتظار بررسی", icon: Clock },
  { href: "/panel/expert/approved", label: "تایید شده‌ها", icon: CheckCircle },
  { href: "/panel/expert/rejected", label: "رد شده‌ها", icon: XCircle },
  { href: "/panel/expert/verify-ads", label: "تأیید آگهی", icon: ShieldCheck },
  { href: "/panel/expert/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/expert/chat", label: "اتاق گفتگو", icon: MessageSquare },
  { href: "/panel/expert/tickets", label: "تیکت‌ها و پشتیبانی", icon: Ticket },
  { href: "/panel/expert/reports", label: "گزارشات", icon: BarChart3 },
  { href: "/panel/expert/bookmarks", label: "نشان‌ها", icon: Bookmark },
  { href: "/panel/expert/profile", label: "پروفایل کارشناس", icon: User },
  { href: "/panel/expert/settings", label: "تنظیمات", icon: Settings },
];

// ─── منوی ادمین (ADMIN) ───
export const adminMenu = [
  {
    href: "/panel/admin/dashboard",
    label: "داشبورد مدیریت",
    icon: LayoutDashboard,
  },
  {
    href: "/panel/admin/users",
    label: "مدیریت کاربران",
    icon: Users,
  },
  {
    href: "/panel/admin/ads",
    label: "مدیریت آگهی‌ها",
    icon: FileText,
  },
  {
    href: "/panel/admin/tickets",
    label: "مدیریت تیکت‌ها",
    icon: Ticket,
  },
  {
    href: "/panel/admin/reports",
    label: "گزارشات",
    icon: Flag,
  },
  {
    href: "/panel/admin/special-ads",
    label: "مدیریت آگهی‌های فوری و ویژه",
    icon: Sparkles,
  },
  // ✅ آیتم جدید
  {
    href: "/panel/admin/location-map",
    label: "نقشه کاربران آنلاین",
    icon: MapPin,
  },
  {
    href: "/panel/admin/analytics",
    label: "گزارشات پیشرفته",
    icon: Flag,
  },
  {
    href: "/panel/admin/comments",
    label: "مدیریت نظرات",
    icon: MessageSquare,
  },
  {
    href: "/panel/admin/profile",
    label: "پروفایل ادمین",
    icon: User,
  },
  {
    href: "/panel/admin/settings",
    label: "تنظیمات سیستم",
    icon: Settings,
  },
];

// ─── منوی مدیر ارشد (SUPER_ADMIN) ───
export const superAdminMenu = [
  {
    href: "/panel/super-admin/dashboard",
    label: "داشبورد مدیر ارشد",
    icon: LayoutDashboard,
  },
  {
    href: "/panel/super-admin/special-ads",
    label: "مدیریت آگهی‌های فوری و ویژه",
    icon: Sparkles,
  },
  // ✅ آیتم جدید
  {
    href: "/panel/super-admin/location-map",
    label: "نقشه کاربران آنلاین",
    icon: MapPin,
  },
  {
    href: "/panel/super-admin/graph",
    label: "تحلیل شبکه و مدیریت گراف",
    icon: LayoutDashboard,
  },
  {
    href: "/panel/super-admin/blacklist-keywords",
    label: "کلمات سیاه‌لیست",
    icon: ShieldAlert,
  },
  {
    href: "/panel/super-admin/cookie-audits",
    label: "رصد کوکی و نشست‌های کاربران",
    icon: Cookie,
  },
  {
    href: "/panel/super-admin/ads",
    label: "مدیریت کل آگهی‌ها",
    icon: FileText,
  },
  { href: "/panel/super-admin/users", label: "مدیریت کاربران", icon: Users },
  { href: "/panel/super-admin/admins", label: "مدیریت ادمین‌ها", icon: Shield },
  {
    href: "/panel/super-admin/chat-monitor",
    label: "رصد چت و پیام‌ها",
    icon: MessageCircle,
  },
  {
    href: "/panel/super-admin/roles",
    label: "نقش‌ها و مجوزها",
    icon: SlidersHorizontal,
  },
  { href: "/panel/super-admin/tickets", label: "مدیریت تیکت‌ها", icon: Ticket },
  {
    href: "/panel/super-admin/comments",
    label: "مدیریت کامنت‌ها",
    icon: MessageSquare,
  },
  {
    href: "/panel/super-admin/financial",
    label: "گزارش‌های مالی",
    icon: CreditCard,
  },
  {
    href: "/panel/super-admin/subscriptions",
    label: "پلن‌های اشتراک و VIP",
    icon: Gift,
  },
  { href: "/panel/super-admin/banners", label: "مدیریت بنرها", icon: Globe },
  {
    href: "/panel/super-admin/market-analysis",
    label: "تحلیل بازار",
    icon: TrendingUp,
  },
  { href: "/panel/super-admin/api-keys", label: "کلیدهای API", icon: Key },
  { href: "/panel/super-admin/webhooks", label: "وب‌هوک‌ها", icon: Webhook },
  {
    href: "/panel/super-admin/settings",
    label: "تنظیمات سایت",
    icon: Settings,
  },
  { href: "/panel/super-admin/backup", label: "پشتیبان‌گیری", icon: Database },
  {
    href: "/panel/super-admin/audit-logs",
    label: "لاگ رویدادها",
    icon: ScrollText,
  },
  { href: "/panel/super-admin/traffic", label: "ترافیک سایت", icon: Activity },
  {
    href: "/panel/super-admin/notifications",
    label: "اعلان‌های سیستمی",
    icon: Bell,
  },
  {
    href: "/panel/super-admin/profile",
    label: "پروفایل مدیر ارشد",
    icon: User,
  },
];


export function PanelSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [menuItems, setMenuItems] = useState(userMenu);
  const [userRole, setUserRole] = useState<string>("user");
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (!authUser) return;
    const role = authUser.role || "user";
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
      case "super_admin":
        setMenuItems(superAdminMenu);
        break;
      default:
        setMenuItems(userMenu);
    }
  }, [authUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const getAvatarUrl = () => {
    if (!authUser?.avatar) return "";
    if (authUser.avatar.startsWith("http")) return authUser.avatar;
    return `${API_BASE.replace("/api", "")}${authUser.avatar}`;
  };

  const getInitials = () => {
    if (authUser?.firstName && authUser?.lastName)
      return `${authUser.firstName[0]}${authUser.lastName[0]}`;
    if (authUser?.firstName) return authUser.firstName[0];
    return authUser?.phone?.slice(-2) || "V";
  };

  const getRoleStyles = (role?: string) => {
    switch (role) {
      case "vip":
        return {
          label: "کاربر ویژه",
          bg: "from-amber-500/20 to-orange-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
          ring: "ring-amber-500/30",
          icon: <Crown className="w-3.5 h-3.5" />,
        };
      case "agent":
        return {
          label: "مشاور املاک",
          bg: "from-blue-500/20 to-indigo-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
          ring: "ring-blue-500/30",
          icon: <Building className="w-3.5 h-3.5" />,
        };
      case "developer":
        return {
          label: "برنامه‌نویس",
          bg: "from-purple-500/20 to-fuchsia-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400",
          ring: "ring-purple-500/30",
          icon: <Code2 className="w-3.5 h-3.5" />,
        };
      case "expert":
        return {
          label: "کارشناس سیستم",
          bg: "from-emerald-500/20 to-teal-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          ring: "ring-emerald-500/30",
          icon: <Shield className="w-3.5 h-3.5" />,
        };
      case "admin":
        return {
          label: "ادمین سیستم",
          bg: "from-red-500/20 to-rose-500/5 border-red-500/20 text-red-600 dark:text-red-400",
          ring: "ring-red-500/30",
          icon: <Shield className="w-3.5 h-3.5" />,
        };
      case "super_admin":
        return {
          label: "مدیر ارشد",
          bg: "from-amber-500/20 to-yellow-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
          ring: "ring-amber-500/30",
          icon: <Star className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: "کاربر عادی",
          bg: "from-muted/50 to-transparent border-border text-muted-foreground",
          ring: "ring-border/40",
          icon: <User className="w-3.5 h-3.5" />,
        };
    }
  };

  const roleConfig = getRoleStyles(userRole);
  const mainNavigation = menuItems.filter(
    (item) => !item.href.includes("profile") && !item.href.includes("settings"),
  );
  const accountNavigation = menuItems.filter(
    (item) => item.href.includes("profile") || item.href.includes("settings"),
  );

  return (
    <nav
      className="p-4 h-full flex flex-col justify-between bg-background/40 backdrop-blur-xl select-none"
      dir="rtl"
    >
      <div className="space-y-6">
        <div
          className={cn(
            "relative overflow-hidden p-4 rounded-2xl border bg-gradient-to-br transition-all duration-300 shadow-xs",
            roleConfig.bg,
          )}
        >
          {userRole === "vip" && (
            <div className="absolute left-[-10px] top-[-10px] opacity-10 rotate-12">
              <Sparkles className="w-20 h-20 text-amber-500" />
            </div>
          )}
          <div className="flex items-center gap-3 relative z-10">
            <Avatar className="h-11 w-11 ring-2 ring-primary/20 rounded-full">
              {authUser?.avatar ? (
                <AvatarImage key={avatarKey} src={getAvatarUrl()} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-right space-y-0.5">
              <p className="font-black text-sm text-foreground tracking-tight truncate">
                {authUser?.firstName
                  ? `${authUser.firstName} ${authUser.lastName || ""}`
                  : "کاربر سیستم"}
              </p>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/60 backdrop-blur-xs text-[10px] font-bold tracking-wide">
                {roleConfig.icon}
                <span>{roleConfig.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground/70 pr-2 mb-2 tracking-wider">
            منو دسترسی اصلی
          </p>
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block relative group"
              >
                <motion.div
                  whileHover={{ x: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 relative",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 font-black"
                      : "hover:bg-muted/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground/80 group-hover:text-primary",
                    )}
                  />
                  <span>{item.label}</span>
                  {item.href.includes("notifications") && unreadCount > 0 && (
                    <Badge className="mr-auto bg-destructive text-destructive-foreground h-5 min-w-[20px] flex items-center justify-center rounded-full text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-0 top-3 bottom-3 w-1 bg-primary-foreground rounded-l-md"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {accountNavigation.length > 0 && (
          <div className="space-y-1 pt-2">
            <p className="text-[10px] font-bold text-muted-foreground/70 pr-2 mb-2 tracking-wider">
              تنظیمات و حساب
            </p>
            {accountNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block relative group"
                >
                  <motion.div
                    whileHover={{ x: -3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 relative",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 font-black"
                        : "hover:bg-muted/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground/80 group-hover:text-primary",
                      )}
                    />
                    <span>{item.label}</span>
                    {item.href.includes("notifications") && unreadCount > 0 && (
                      <Badge className="mr-auto bg-destructive text-destructive-foreground h-5 min-w-[20px] flex items-center justify-center rounded-full text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-0 top-3 bottom-3 w-1 bg-primary-foreground rounded-l-md"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-1.5 pt-4 border-t border-border/60">
        <Link href="/" className="block group">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200">
            <Home className="w-4 h-4 flex-shrink-0 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
            <span>بازگشت به صفحه اصلی</span>
          </div>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span>خروج از حساب کاربری</span>
        </Button>
      </div>
    </nav>
  );
}
