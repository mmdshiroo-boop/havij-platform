"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Bell,
  Star,
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

// ─── آرایه‌های منوها دقیقاً مطابق با PanelSidebar ───
const userMenu = [
  {
    href: "/panel/user/dashboard",
    label: "داشبورد عملکرد",
    icon: LayoutDashboard,
  },
  { href: "/panel/user/my-ads", label: "آگهی‌های من", icon: FileText },
  { href: "/panel/user/bookmarks", label: "ذخیره‌شده‌ها", icon: Bookmark },
  { href: "/panel/user/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/panel/user/tickets", label: "تیکت‌های من", icon: Ticket },
  {
    href: "/panel/user/my-consulting",
    label: "مشاوره‌های من",
    icon: MessageSquare,
  },
  {
    href: "/panel/user/comments",
    label: "نظرات آگهی‌های من",
    icon: MessageSquare,
  },
  { href: "/panel/user/reports-my", label: "گزارشات تخلف من", icon: Flag },
  { href: "/panel/user/profile", label: "پروفایل کاربری", icon: User },
  { href: "/panel/user/settings", label: "تنظیمات پنل", icon: Settings },
];

const vipMenu = [
  {
    href: "/panel/vip/dashboard",
    label: "داشبورد ویژه",
    icon: LayoutDashboard,
  },
  { href: "/panel/vip/my-ads", label: "آگهی‌های من", icon: Crown },
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
  {
    href: "/panel/vip/my-consulting",
    label: "مشاوره های  من",
    icon: MessageSquare,
  },
  { href: "/panel/vip/reports-my", label: "گزارشات", icon: FileText },
  { href: "/panel/vip/support", label: "تیکت پشتیبانی", icon: MessageSquare },
  { href: "/panel/vip/settings", label: "تنظیمات", icon: Settings },
  { href: "/panel/vip/profile", label: "پروفایل", icon: User },
];

const agentMenu = [
  {
    href: "/panel/agent/dashboard",
    label: "داشبورد آژانس",
    icon: LayoutDashboard,
  },
  {
    href: "/panel/agent/consulting",
    label: "مشاوره‌های من",
    icon: MessageSquare,
  },
  {
    href: "/panel/agent/advanced-search",
    label: "جستجوی پیشرفته",
    icon: Search,
  },
  { href: "/panel/agent/my-ads", label: "آگهی‌های من", icon: FileText },
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

const developerMenu = [
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
  { href: "/panel/developer/reports-my", label: "گزارشات تخلف من", icon: Flag },
  { href: "/panel/developer/settings", label: "تنظیمات", icon: Settings },
  { href: "/panel/developer/profile", label: "پروفایل", icon: User },
];

const expertMenu = [
  {
    href: "/panel/expert/dashboard",
    label: "داشبورد کارشناسی",
    icon: LayoutDashboard,
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
  { href: "/panel/expert/consulting", label: "مشاوره", icon: Users },
  { href: "/panel/expert/bookmarks", label: "نشان‌ها", icon: Bookmark },
  { href: "/panel/expert/reports-my", label: "گزارشات تخلف من", icon: Flag },
  { href: "/panel/expert/profile", label: "پروفایل کارشناس", icon: User },
  { href: "/panel/expert/settings", label: "تنظیمات", icon: Settings },
];

const adminMenu = [
  {
    href: "/panel/admin/dashboard",
    label: "داشبورد مدیریت",
    icon: LayoutDashboard,
  },
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
  {
    href: "/panel/super-admin/dashboard",
    label: "داشبورد مدیر ارشد",
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

export default function ProfilePage() {
  const pathname = usePathname();
  const router = useRouter();

  const { user: authUser } = useAuth();
  const { unreadCount } = useNotifications();

  const [menuItems, setMenuItems] = useState(userMenu);
  const [userRole, setUserRole] = useState<string>("user");

  // استیت تم برای دارک مود
  const [isDarkMode, setIsDarkMode] = useState(false);

  // بررسی وضعیت دارک مود هنگام لود کامپوننت
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  // هندل تغییر تم
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  };

  // تنظیم منوها بر اساس نقش کاربر
  useEffect(() => {
    if (!authUser) return;

    // تبدیل آندرلاین به خط تیره جهت یکپارچه‌سازی روت‌ها (مانند تبدیل super_admin به super-admin)
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

  // توابع کمکی کاربر
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
    return authUser?.phone?.slice(-2) || "U";
  };

  // تفکیک منوهای اصلی و تنظمیات
  const mainNavigation = menuItems.filter(
    (item) => !item.href.includes("profile") && !item.href.includes("settings"),
  );
  const accountNavigation = menuItems.filter(
    (item) => item.href.includes("profile") || item.href.includes("settings"),
  );

  return (
    <div
      className="min-h-screen bg-background text-foreground p-4 md:p-6 pb-24"
      dir="rtl"
    >
      {/* کارت هدر پروفایل */}
      <div className="flex items-center justify-between py-5 px-4 bg-card rounded-2xl shadow-card border border-border mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20 rounded-full">
            <AvatarImage
              src={authUser?.avatar ? getAvatarUrl() : "/images/user.webp"}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-foreground font-black text-xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="font-bold text-lg text-foreground">
              {authUser?.firstName
                ? `${authUser.firstName} ${authUser.lastName || ""}`
                : "کاربر میهمان"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">
                {authUser?.phone || "شماره ثبت نشده"}
              </span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
                {userRole.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/panel/${userRole}/profile`}
          className="p-2.5 hover:bg-accent rounded-full transition text-muted-foreground bg-muted/50"
        >
          <Edit className="w-5 h-5" />
        </Link>
      </div>

      {/* بخش دسترسی‌های اصلی */}
      {mainNavigation.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-muted-foreground pr-2 mb-3 tracking-wider">
            دسترسی‌های اصلی
          </p>
          <div className="space-y-1 bg-card rounded-2xl shadow-card border border-border p-2">
            {mainNavigation.map((item, index) => {
              const isActive = pathname === item.href;
              // چک کردن اینکه آیا این آیتم مربوط به نوتیفیکیشن است و عدد نخوانده دارد یا خیر
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

      {/* بخش تنظیمات و حساب کاربری */}
      <div>
        <p className="text-xs font-bold text-muted-foreground pr-2 mb-3 tracking-wider">
          تنظیمات و حساب
        </p>
        <div className="space-y-1 bg-card rounded-2xl shadow-card border border-border p-2">
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

          {/* سوییچ حالت شب */}
          <div
            onClick={toggleTheme}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-accent rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                حالت شب
              </span>
            </div>
            <button
              className={`w-11 h-6 rounded-full transition-colors relative ${isDarkMode ? "bg-primary" : "bg-muted"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isDarkMode ? "left-1" : "left-6"}`}
              />
            </button>
          </div>

          {/* دکمه خروج واقعی با منطق handleLogout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-destructive/10 rounded-xl cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-4">
              <LogOut className="w-5 h-5 text-destructive group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-destructive">
                خروج از حساب کاربری
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// کامپوننت کمکی MenuItem همراه با روتینگ واقعی (Link)
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
        "flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200",
        isActive ? "bg-primary/10" : "hover:bg-accent",
      )}
    >
      <div className="flex items-center gap-4">
        <Icon
          className={cn(
            "w-5 h-5 transition-transform",
            isActive ? "text-primary scale-110" : "text-muted-foreground",
          )}
        />
        <span
          className={cn(
            "text-sm",
            isActive
              ? "font-black text-primary"
              : "font-medium text-foreground",
          )}
        >
          {label}
        </span>

        {badgeCount && (
          <span className="flex items-center justify-center bg-destructive text-destructive-foreground h-5 min-w-[20px] rounded-full text-[10px] font-bold px-1.5 ml-auto">
            {badgeCount}
          </span>
        )}
      </div>
      <ChevronLeft
        className={cn(
          "w-4 h-4",
          isActive ? "text-primary" : "text-muted-foreground",
        )}
      />
    </div>
  </Link>
);
