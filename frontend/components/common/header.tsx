"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User as UserIcon,
  LogOut,
  Heart,
  FileText,
  Settings,
  LayoutDashboard,
  MessageCircle,
  HelpCircle,
  Shield,
  ChevronLeft,
  Crown,
  Building,
  Code2,
  Star,
  Clock,
  Flag,
  Users,
  Database,
  BarChart3,
  Key,
  Webhook,
  BookOpen,
  Bell,
  LucideIcon,
  ScrollText,
  Activity,
  PlusCircle,
  Menu,
  Gem,
  Bookmark,
  Home,
  Car,
  Smartphone,
  Sofa,
  Shirt,
  Wrench,
  Briefcase,
  Factory,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn, getFullImageUrl } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  categoryApi,
  Category as CategoryType,
} from "@/services/api/category.api";
import { City, locationApi, Province } from "@/services/api/location.api";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { SearchBox } from "../search/SearchBox";
import { NotificationBell } from "../notifcation/NotificationBell";
import { User } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  divider?: boolean;
}

interface UserMenuProps {
  onLogout?: () => void;
  customMenuItems?: MenuItem[];
}

// ─── منوهای کاربری ───

const defaultMenuItems: MenuItem[] = [
  { icon: UserIcon, label: "پروفایل کاربری", href: "/panel/user/profile" },
  { icon: FileText, label: "آگهی‌های من", href: "/panel/user/my-ads" },
  { icon: Heart, label: "نشان شده‌ها", href: "/panel/user/favorites" },
  { icon: MessageCircle, label: "صندوق پیام‌ها", href: "/chats" },
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/user/reports-my" },
  {
    icon: LayoutDashboard,
    label: "داشبورد حساب",
    href: "/panel/user",
    divider: true,
  },
  { icon: Settings, label: "تنظیمات حساب", href: "/panel/user/settings" },
  { icon: HelpCircle, label: "راهنما و پشتیبانی", href: "/help" },
];

const vipMenuItems: MenuItem[] = [
  { icon: UserIcon, label: "پروفایل ویژه", href: "/panel/vip/profile" },
  { icon: Crown, label: "باشگاه مشتریان VIP", href: "/panel/vip/benefits" },
  {
    icon: BarChart3,
    label: "آنالیز پیشرفته آگهی‌ها",
    href: "/panel/vip/stats",
  },
  { icon: FileText, label: "آگهی‌های من", href: "/panel/vip/my-ads" },
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/vip/reports-my" },
  {
    icon: LayoutDashboard,
    label: "داشبورد اختصاصی",
    href: "/panel/vip",
    divider: true,
  },
  { icon: Settings, label: "تنظیمات پیشرفته", href: "/panel/vip/settings" },
  { icon: HelpCircle, label: "پشتیبانی اختصاصی", href: "/help" },
];

const agentMenuItems: MenuItem[] = [
  { icon: UserIcon, label: "پروفایل تجاری", href: "/panel/agent/profile" },
  {
    icon: Building,
    label: "مدیریت املاک و مستغلات",
    href: "/panel/agent/properties",
  },
  { icon: Users, label: "مدیریت مشاوران آژانس", href: "/panel/agent/agents" },
  {
    icon: BarChart3,
    label: "گزارشات و آمار فروش",
    href: "/panel/agent/reports",
  },
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/agent/reports-my" },
  {
    icon: LayoutDashboard,
    label: "پنل مدیریت آژانس",
    href: "/panel/agent",
    divider: true,
  },
  { icon: Settings, label: "تنظیمات پنل", href: "/panel/agent/settings" },
  { icon: HelpCircle, label: "راهنما", href: "/help" },
];

const expertMenuItems: MenuItem[] = [
  { icon: UserIcon, label: "پروفایل کارشناسی", href: "/panel/expert/profile" },
  {
    icon: Clock,
    label: "آگهی‌های در انتظار بررسی",
    href: "/panel/expert/pending-ads",
  },
  { icon: Flag, label: "گزارشات تخلف کاربران", href: "/panel/expert/reports" },
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/expert/reports-my" },
  {
    icon: MessageCircle,
    label: "مشاوره‌های فعال",
    href: "/panel/expert/consulting",
  },
  {
    icon: LayoutDashboard,
    label: "میز کار کارشناس",
    href: "/panel/expert",
    divider: true,
  },
  { icon: Settings, label: "تنظیمات سیستم", href: "/panel/expert/settings" },
  { icon: HelpCircle, label: "راهنما", href: "/help" },
];

const developerMenuItems: MenuItem[] = [
  { icon: UserIcon, label: "پروفایل", href: "/panel/developer/profile" },
  { icon: Key, label: "API Keys", href: "/panel/developer/api-key" },
  { icon: Webhook, label: "Webhooks", href: "/panel/developer/webhooks" },
  { icon: BookOpen, label: "مستندات", href: "/panel/developer/docs" },
  { icon: Bell, label: "اعلان‌ها", href: "/panel/developer/notifications" },
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/developer/reports-my" },
  {
    icon: LayoutDashboard,
    label: "داشبورد برنامه‌نویس",
    href: "/panel/developer/dashboard",
    divider: true,
  },
  {
    icon: Settings,
    label: "تنظیمات حریم خصوصی",
    href: "/panel/developer/settings",
  },
  { icon: HelpCircle, label: "مرکز راهنما", href: "/help" },
];

const adminMenuItems: MenuItem[] = [
  { icon: UserIcon, label: "پروفایل ادمین", href: "/panel/admin/profile" },
  { icon: Users, label: "مدیریت کاربری", href: "/panel/admin/users" },
  { icon: FileText, label: "نظارت بر آگهی‌ها", href: "/panel/admin/ads" },
  { icon: Flag, label: "گزارشات و شکایات", href: "/panel/admin/reports" },
  {
    icon: LayoutDashboard,
    label: "کنسول مدیریت",
    href: "/panel/admin",
    divider: true,
  },
  {
    icon: Settings,
    label: "تنظیمات کلی پلتفرم",
    href: "/panel/admin/settings",
  },
  { icon: HelpCircle, label: "مستندات ادمین", href: "/help" },
];

const superAdminMenuItems: MenuItem[] = [
  {
    icon: UserIcon,
    label: "پروفایل مدیر ارشد",
    href: "/panel/super-admin/profile",
  },
  {
    icon: Shield,
    label: "سطوح دسترسی و ادمین‌ها",
    href: "/panel/super-admin/admins",
  },
  { icon: Users, label: "نظارت کل کاربران", href: "/panel/super-admin/users" },
  {
    icon: FileText,
    label: "مدیریت کل آگهی‌ها",
    href: "/panel/super-admin/ads",
  },
  {
    icon: Database,
    label: "پشتیبان‌گیری هسته",
    href: "/panel/super-admin/backup",
  },
  {
    icon: ScrollText,
    label: "لاگ رویدادها",
    href: "/panel/super-admin/audit-logs",
  },
  {
    icon: Activity,
    label: "ترافیک سایت",
    href: "/panel/super-admin/traffic",
  },
  {
    icon: LayoutDashboard,
    label: "کنسول روت سیستم",
    href: "/panel/super-admin",
    divider: true,
  },
  {
    icon: Settings,
    label: "پیکربندی سرور",
    href: "/panel/super-admin/settings",
  },
];

// ─── کامپوننت منوی کاربر (UserMenu) ───

export function UserMenu({ onLogout, customMenuItems }: UserMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  useEffect(() => {
    const handleAvatarUpdate = () => setAvatarKey(Date.now());
    window.addEventListener("avatar-updated", handleAvatarUpdate);
    return () =>
      window.removeEventListener("avatar-updated", handleAvatarUpdate);
  }, []);

  useEffect(() => {
    setAvatarKey(Date.now());
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success("با موفقیت از حساب خود خارج شدید.");
    onLogout?.();
    window.dispatchEvent(new Event("avatar-updated"));
    router.push("/");
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName)
      return `${user.firstName[0]}${user.lastName[0]}`;
    if (user?.firstName) return user.firstName[0];
    return user?.phone?.slice(-2) || "U";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName)
      return `${user.firstName} ${user.lastName}`;
    if (user?.firstName) return user.firstName;
    return user?.phone || "کاربر مهمان";
  };

  const getRoleBadgeConfig = () => {
    switch (user?.role) {
      case "super_admin":
        return {
          label: "مدیر ارشد",
          icon: Star,
          className:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
        };
      case "admin":
        return {
          label: "مدیر سیستم",
          icon: Shield,
          className:
            "bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20",
        };
      case "developer":
        return {
          label: "توسعه‌دهنده",
          icon: Code2,
          className:
            "bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20",
        };
      case "expert":
        return {
          label: "کارشناس رسمی",
          icon: Shield,
          className:
            "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
        };
      case "agent":
        return {
          label: "آژانس املاک/خودرو",
          icon: Building,
          className:
            "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-cyan-500/20",
        };
      case "vip":
        return {
          label: "عضو ویژه (VIP)",
          icon: Crown,
          className:
            "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 ring-amber-500/30",
        };
      default:
        return {
          label: "کاربر عادی",
          icon: UserIcon,
          className: "bg-primary/10 text-primary ring-primary/20",
        };
    }
  };

  const roleConfig = getRoleBadgeConfig();
  const RoleIcon = roleConfig.icon;

  const getAvatarUrl = () => {
    if (!user?.avatar) return "";
    if (user.avatar.startsWith("http")) return user.avatar;
    return `${API_BASE.replace("/api", "")}${user.avatar}?t=${avatarKey}`;
  };
  const avatarSrc = user?.avatar ? getAvatarUrl() : "/images/user.webp";

  const menuItems =
    customMenuItems ||
    (() => {
      switch (user?.role) {
        case "developer":
          return developerMenuItems;
        case "expert":
          return expertMenuItems;
        case "agent":
          return agentMenuItems;
        case "admin":
          return adminMenuItems;
        case "super_admin":
          return superAdminMenuItems;
        case "vip":
          return vipMenuItems;
        default:
          return defaultMenuItems;
      }
    })();

  if (!user) {
    return (
      <Button
        variant="default"
        onClick={() => router.push("/auth")}
        className="gap-2 rounded-xl px-5 h-9 font-bold bg-gradient-to-r from-primary to-primary/90 text-white shadow-md hover:shadow-primary/20 active:scale-95 transition-all"
      >
        <UserIcon className="w-4 h-4" />
        ورود / عضویت
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-muted/60 transition-all duration-300"
        >
          <Avatar className="h-9 w-9 ring-2 ring-transparent hover:ring-primary/40 transition-all duration-300">
            <AvatarImage
              key={avatarKey}
              src={avatarSrc}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-foreground font-black text-sm">
              <img
                src="/images/user.webp"
                alt="avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 md:w-[340px] rounded-2xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-border/50 bg-background/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-300 text-right"
        align="center"
        sideOffset={10}
      >
        {/* هدر دراپ‌داون */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/20 backdrop-blur-sm mb-2">
          <Avatar className="w-14 h-14 ring-2 ring-primary/20 shadow-lg rounded-full shrink-0">
            <AvatarImage
              key={avatarKey}
              src={avatarSrc}
              className="object-cover"
            />
            <AvatarFallback>
              <img
                src="/images/user.webp"
                alt="avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 text-right">
            <p className="font-black text-[13px] text-foreground tracking-tight truncate">
              {getDisplayName()}
            </p>
            <p className="text-[11px] text-muted-foreground/80 font-mono mt-0.5 tracking-wider truncate">
              {user.phone}
            </p>

            <div
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold mt-1.5 ring-1",
                roleConfig.className,
              )}
            >
              <RoleIcon className="w-2.5 h-2.5 shrink-0" />
              <span>{roleConfig.label}</span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1.5 opacity-60" />

        <DropdownMenuGroup>
          {menuItems.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <div key={item.label}>
                <DropdownMenuItem
                  onClick={() => {
                    setIsOpen(false);
                    router.push(item.href);
                  }}
                  className="cursor-pointer rounded-xl py-2.5 px-3 text-xs font-bold text-foreground/80 hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary transition-all duration-200 group flex items-center justify-start gap-3"
                >
                  <ItemIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary group-focus:text-primary transition-all duration-300 group-hover:scale-110 shrink-0" />
                  <span className="flex-1 text-right">{item.label}</span>
                  <ChevronLeft className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-300 transform group-hover:-translate-x-1" />
                </DropdownMenuItem>
                {item.divider && index !== menuItems.length - 1 && (
                  <DropdownMenuSeparator className="my-1.5 opacity-60" />
                )}
              </div>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1.5 opacity-60" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer rounded-xl py-2.5 px-3 text-xs font-bold text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/10 focus:bg-destructive/5 transition-all duration-200 group flex items-center justify-start gap-3"
        >
          <LogOut className="w-4 h-4 text-destructive/80 group-hover:scale-110 transition-transform duration-300 shrink-0" />
          <span className="flex-1 text-right">خروج امن از حساب</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const getCategoryIcon = (iconName?: string) => {
  const p = {
    className:
      "w-6 h-6 text-zinc-700 dark:text-zinc-200 transition-transform duration-300 group-hover:scale-110",
  };
  const map: Record<string, React.ReactNode> = {
    Home: <Home {...p} />,
    Car: <Car {...p} />,
    Smartphone: <Smartphone {...p} />,
    Sofa: <Sofa {...p} />,
    Shirt: <Shirt {...p} />,
    Wrench: <Wrench {...p} />,
    Briefcase: <Briefcase {...p} />,
    Factory: <Factory {...p} />,
  };
  return map[iconName ?? ""] ?? <Package {...p} />;
};

function SheetBody({
  user,
  userAvatarUrl,
  avatarKey,
  provinces,
  citiesList,
  selectedProvince,
  selectedCity,
  categories,
  loadingCategories,
  onProvinceChange,
  onCityChange,
  onCategoryClick,
  onCreateAd,
  onChat,
  onSaved,
  onPricing,
  onLogout,
}: {
  user: User | null;
  userAvatarUrl: string;
  avatarKey: number;
  provinces: Province[];
  citiesList: City[];
  selectedProvince: Province | null;
  selectedCity: City | null;
  categories: CategoryType[];
  loadingCategories: boolean;
  onProvinceChange: (p: Province) => void;
  onCityChange: (c: City) => void;
  onCategoryClick: (slug: string) => void;
  onCreateAd: () => void;
  onChat: () => void;
  onSaved: () => void;
  onPricing: () => void;
  onLogout: () => void;
}) {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-right"
      dir="rtl"
    >
      {/* پروفایل / ورود */}
      {user ? (
        <div className="flex items-center gap-3 p-4 bg-zinc-100/80 dark:bg-muted/40 rounded-2xl border border-border/40 backdrop-blur-md transition-all hover:bg-muted/50">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20 shadow-lg rounded-full shrink-0">
            <AvatarImage
              key={avatarKey}
              src={
                userAvatarUrl
                  ? `${userAvatarUrl}?t=${avatarKey}`
                  : "/images/user.webp"
              }
              className="object-cover"
            />
            <AvatarFallback>
              <img
                src="/images/user.webp"
                alt="avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate text-foreground tracking-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[11px] text-muted-foreground/80 font-mono mt-0.5">
              {user.phone}
            </p>
          </div>
        </div>
      ) : (
        <Button
          className="w-full h-11 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/90 hover:opacity-85 shadow-sm active:scale-[0.98] transition-all"
          onClick={onCreateAd}
        >
          ورود / ثبت‌نام
        </Button>
      )}

      {/* موقعیت مکانی */}
      <div className="space-y-3">
        <p className="text-[11px] font-extrabold text-muted-foreground/60 tracking-wider">
          موقعیت مکانی
        </p>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedProvince?._id ?? ""}
            onChange={(e) => {
              const p = provinces.find((x) => x._id === e.target.value);
              if (p) onProvinceChange(p);
            }}
            className="p-2.5 rounded-xl border border-border/50 bg-zinc-100/80 dark:bg-muted/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none text-center text-foreground"
          >
            <option value="">همه استان‌ها</option>
            {provinces.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={selectedCity?._id ?? ""}
            disabled={!selectedProvince}
            onChange={(e) => {
              const c = citiesList.find((x) => x._id === e.target.value);
              if (c) onCityChange(c);
            }}
            className="p-2.5 rounded-xl border border-border/50 bg-zinc-100/80 dark:bg-muted/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer appearance-none text-center text-foreground"
          >
            <option value="">همه شهرها</option>
            {citiesList.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* دسته‌بندی‌ها */}
      <div className="space-y-3">
        <p className="text-[11px] font-extrabold text-muted-foreground/60 tracking-wider">
          دسته‌بندی‌ها
        </p>
        {loadingCategories ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-100/80 dark:bg-muted/40 animate-pulse rounded-xl h-11"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => onCategoryClick(cat.slug)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-100/80 dark:bg-muted/30 hover:bg-primary/5 hover:text-primary transition-all text-xs text-right group active:scale-[0.97]"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors shrink-0 scale-75">
                  {getCategoryIcon(cat.icon)}
                </span>
                <span className="truncate font-semibold text-foreground/90 group-hover:text-primary">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* اکشن‌ها */}
      <div className="space-y-2.5 pt-4 border-t border-border/40">
        <Button
          className="w-full gap-2 h-11 rounded-xl font-bold bg-gradient-to-r from-primary via-primary to-primary/90 text-white shadow-lg shadow-primary/10 hover:opacity-85 active:scale-[0.98] transition-all"
          onClick={onCreateAd}
        >
          <PlusCircle className="h-4 w-4" />
          ثبت آگهی رایگان
        </Button>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            variant="outline"
            className="gap-1 rounded-xl h-10 border-border/80 hover:bg-muted/50 text-[11px] font-bold transition-all active:scale-[0.96]"
            onClick={onChat}
          >
            <MessageCircle className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
            پیام‌ها
          </Button>
          <Button
            variant="outline"
            className="gap-1 rounded-xl h-10 border-border/80 hover:bg-muted/50 text-[11px] font-bold transition-all active:scale-[0.96]"
            onClick={onSaved}
          >
            <Bookmark className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
            ذخیره‌ها
          </Button>
          <Button
            variant="outline"
            className="gap-1 rounded-xl h-10 border-border/80 hover:bg-muted/50 text-[11px] font-bold transition-all active:scale-[0.96]"
            onClick={onPricing}
          >
            <Gem className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
            اشتراک VIP
          </Button>
        </div>
        {user && (
          <Button
            variant="ghost"
            className="w-full gap-2 rounded-xl h-10 text-destructive hover:text-destructive hover:bg-destructive/5 text-xs font-bold mt-2 transition-all"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" /> خروج از حساب کاربری
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── کامپوننت اصلی Header ───

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null,
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  useEffect(() => {
    setAvatarKey(Date.now());
  }, [user]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    locationApi
      .getProvinces()
      .then(async (data) => {
        setProvinces(data);
        const tehran = data.find((p) => p.slug === "tehran");
        if (tehran) {
          setSelectedProvince(tehran);
          const cities = await locationApi.getCitiesByProvince(tehran._id);
          setCitiesList(cities);
          const tehranCity = cities.find((c) => c.name === "تهران");
          if (tehranCity) setSelectedCity(tehranCity);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    categoryApi
      .getAll()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleProvinceChange = async (province: Province) => {
    setSelectedProvince(province);
    setSelectedCity(null);
    try {
      const cities = await locationApi.getCitiesByProvince(province._id);
      setCitiesList(cities);
    } catch {
      /* noop */
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const sharedBodyProps = {
    user,
    userAvatarUrl: user?.avatar ? getFullImageUrl(user.avatar) : "",
    avatarKey,
    provinces,
    citiesList,
    selectedProvince,
    selectedCity,
    categories,
    loadingCategories,
    onProvinceChange: handleProvinceChange,
    onCityChange: (c: City) => setSelectedCity(c),
    onCategoryClick: (slug: string) => {
      router.push(`/category/${slug}`);
      setIsMenuOpen(false);
    },
    onCreateAd: () => {
      user ? router.push("/create-ad") : router.push("/auth");
      setIsMenuOpen(false);
    },
    onChat: () => {
      router.push("/chat");
      setIsMenuOpen(false);
    },
    onSaved: () => {
      router.push("/panel/user/bookmarks");
      setIsMenuOpen(false);
    },
    onPricing: () => {
      router.push("/pricing");
      setIsMenuOpen(false);
    },
    onLogout: () => {
      handleLogout();
      setIsMenuOpen(false);
    },
  };

  const Logo = ({ small = false }: { small?: boolean }) => {
    return (
      <Link href="/" className="flex items-center shrink-0" dir="rtl">
        <img
          src="/log.png"
          alt="لوگو"
          className={`object-contain ${small ? "w-[60px]" : "w-[150px]"} h-20`}
        />
      </Link>
    );
  };

  const MobileSheetMenu = () => (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-foreground hover:bg-muted/60 active:scale-95 transition-transform"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[290px] sm:w-[320px] p-0 flex flex-col h-full border-l border-border/40 bg-background/95 backdrop-blur-xl text-right"
        dir="rtl"
      >
        <div className="sr-only">
          <SheetTitle>منوی ناوبری موبایل</SheetTitle>
        </div>
        <div className="p-4 pt-5 border-b border-border/40 flex items-center gap-3 bg-zinc-100/80 dark:bg-muted/40">
          <div className="w-8 h-8 bg-gradient-to-tr from-primary to-orange-400 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-black text-sm">
              هـ
            </span>
          </div>
          <p className="font-black text-sm text-foreground tracking-tight">
            پلتفرم جامع آگهی هویج
          </p>
        </div>
        <SheetBody {...sharedBodyProps} />
      </SheetContent>
    </Sheet>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b bg-card flex items-center",
        isScrolled
          ? "h-16 bg-background/95 backdrop-blur-md shadow-sm border-border/60"
          : "h-20 bg-background/80 backdrop-blur-sm border-border/40",
      )}
      dir="rtl"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between gap-4 md:gap-6">
        {/* === حالت دسکتاپ === */}
        <div className="hidden lg:flex items-center justify-between w-full gap-6">
          <Logo />
          <div className="flex-1 max-w-xl mx-auto w-full">
            <SearchBox className="w-full" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              className="rounded-xl h-9 px-3 gap-2 text-xs font-bold text-foreground hover:text-primary hover:bg-muted/60 hover:opacity-85 active:scale-95 transition-all"
              onClick={() => router.push("/chat")}
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              <span>پیام‌ها</span>
            </Button>

            <Button
              variant="ghost"
              className="rounded-xl h-9 px-3 gap-2 text-xs font-bold text-foreground hover:text-primary hover:bg-muted/60 hover:opacity-85 active:scale-95 transition-all"
              onClick={() => {
                const role = user?.role || "user";
                if (role === "admin" || role === "super_admin") {
                  router.push("/admin/bookmarks");
                } else {
                  router.push(`/panel/${role}/bookmarks`);
                }
              }}
            >
              <Bookmark className="h-[18px] w-[18px]" />
              <span>ذخیره‌شده‌ها</span>
            </Button>

            <Button
              variant="ghost"
              className="rounded-xl h-9 px-3 gap-2 text-xs font-bold text-foreground hover:text-primary hover:bg-muted/60 hover:opacity-85 active:scale-95 transition-all"
              onClick={() => router.push("/pricing")}
            >
              <Gem className="h-[17px] w-[17px]" />
              <span>اشتراک VIP</span>
            </Button>

            <ThemeToggle />
            <NotificationBell />


            <Button
              className="gap-2 rounded-xl h-9 px-4 text-xs font-bold bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
              onClick={() => router.push(user ? "/create-ad" : "/auth")}
            >
              <PlusCircle className="h-4 w-4" />
              <span>ثبت آگهی رایگان</span>
            </Button>
            <UserMenu />
          </div>
        </div>

        {/* === حالت موبایل === */}
        <div className="flex lg:hidden items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2">
            <MobileSheetMenu />
            <Logo small />
          </div>

          <div className="flex-1 max-w-xs mx-1">
            <SearchBox className="w-full" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
