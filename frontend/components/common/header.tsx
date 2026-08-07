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
  DropdownMenuLabel,
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
  LayoutGrid,
  PenTool,
  Info,
  PhoneCall,
  CreditCard,
  Headset,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  categoryApi,
  Category as CategoryType,
} from "@/services/api/category.api";
import { City, locationApi, Province } from "@/services/api/location.api";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { SearchBox } from "../search/SearchBox";
import { NotificationBell } from "../notifcation/NotificationBell";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// ═══════════════ لینک‌های اصلی (فارسی) ═══════════════
const mainLinks = [
  { href: "/category", label: "دسته‌بندی‌ها", icon: LayoutGrid },
  { href: "/create-ad", label: "ثبت آگهی", icon: PlusCircle },
  { href: "/consulting", label: "مشاوره", icon: Headset },
  { href: "/chat", label: "گفتگو", icon: MessageCircle },
  { href: "/help", label: "راهنما", icon: HelpCircle },
  { href: "/about", label: "درباره ما", icon: Info },
  { href: "/contact", label: "تماس با ما", icon: PhoneCall },
  { href: "/pricing", label: "تعرفه‌ها", icon: CreditCard },
  { href: "/rules", label: "قوانین", icon: BookOpen },
  { href: "/privacy", label: "حریم خصوصی", icon: Shield },
  { href: "/support", label: "پشتیبانی", icon: Headset },
  { href: "/report", label: "گزارش تخلف", icon: AlertTriangle },
];

// ═══════════════ منوهای کاربری (برای UserMenu) ═══════════════
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
    href: "/panel/expert/pending",
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

// ═══════════════ UserMenu (کامل - بدون تغییر) ═══════════════
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
    src={avatarSrc || "/images/user.webp"}
    className="object-cover"
  />
  <AvatarFallback className="bg-muted text-foreground font-black text-sm" />
</Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 md:w-[340px] rounded-2xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-border/50 bg-background/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-300 text-right"
        align="center"
        sideOffset={10}
      >
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/20 backdrop-blur-sm mb-2">
        <Avatar className="w-14 h-14 ring-2 ring-primary/20 shadow-lg rounded-full shrink-0">
  <AvatarImage
    key={avatarKey}
    src={avatarSrc || "/images/user.webp"}
    className="object-cover"
  />
  <AvatarFallback />
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

// ═══════════════ MainNavMenu (منوی قدیمی برای موبایل - نگه داشته شده ولی استفاده نمی‌شود) ═══════════════
function MainNavMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

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

  const handleProvinceChange = async (provinceId: string) => {
    const p = provinces.find((x) => x._id === provinceId);
    if (p) {
      setSelectedProvince(p);
      setSelectedCity(null);
      const cities = await locationApi.getCitiesByProvince(p._id);
      setCitiesList(cities);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-foreground hover:bg-muted/60 active:scale-95 transition-transform"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[85vw] max-w-[360px] rounded-2xl p-4 border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl max-h-[80vh] overflow-y-auto text-right"
        align="start"
        sideOffset={10}
      >
        {user ? (
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl mb-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/30 rounded-full">
  <AvatarImage
    src={
      user.avatar
        ? user.avatar.startsWith("http")
          ? user.avatar
          : `${API_BASE.replace("/api", "")}${user.avatar}`
        : "/images/user.webp"
    }
    alt={user.firstName}
    className="object-cover"
  />
  <AvatarFallback />
</Avatar>
            <div className="text-right text-sm font-bold truncate">
              {user.firstName} {user.lastName}
              <p className="text-xs text-muted-foreground font-mono">{user.phone}</p>
            </div>
          </div>
        ) : (
          <Button
            className="w-full mb-3"
            onClick={() => { router.push("/auth"); setOpen(false); }}
          >
            ورود / ثبت‌نام
          </Button>
        )}

        <DropdownMenuLabel className="text-xs font-extrabold text-muted-foreground mt-2">موقعیت مکانی</DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select
            value={selectedProvince?._id ?? ""}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="p-2 rounded-xl border border-border/50 bg-muted/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">همه استان‌ها</option>
            {provinces.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <select
            value={selectedCity?._id ?? ""}
            disabled={!selectedProvince}
            onChange={(e) => {
              const c = citiesList.find((x) => x._id === e.target.value);
              if (c) setSelectedCity(c);
            }}
            className="p-2 rounded-xl border border-border/50 bg-muted/40 text-xs font-semibold disabled:opacity-40"
          >
            <option value="">همه شهرها</option>
            {citiesList.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <DropdownMenuLabel className="text-xs font-extrabold text-muted-foreground">دسته‌بندی‌ها</DropdownMenuLabel>
        {loadingCategories ? (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 bg-muted/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => { router.push(`/category/${cat.slug}`); setOpen(false); }}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-primary/5 hover:text-primary transition-all text-xs font-semibold"
              >
                <span className="text-muted-foreground group-hover:text-primary scale-75">
                  {getCategoryIcon(cat.icon)}
                </span>
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-border/40">
          <Button
            className="w-full gap-2 h-10 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/90 text-white"
            onClick={() => { router.push(user ? "/create-ad" : "/auth"); setOpen(false); }}
          >
            <PlusCircle className="h-4 w-4" /> ثبت آگهی رایگان
          </Button>
          <div className="grid grid-cols-3 gap-1.5">
            <Button variant="outline" size="sm" onClick={() => { router.push("/chat"); setOpen(false); }}>
              <MessageCircle className="h-4 w-4" /> پیام‌ها
            </Button>
            <Button variant="outline" size="sm" onClick={() => { router.push("/panel/user/bookmarks"); setOpen(false); }}>
              <Bookmark className="h-4 w-4" /> ذخیره‌ها
            </Button>
            <Button variant="outline" size="sm" onClick={() => { router.push("/pricing"); setOpen(false); }}>
              <Gem className="h-4 w-4" /> اشتراک
            </Button>
          </div>
          {user && (
            <Button
              variant="ghost"
              className="w-full text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 ml-2" /> خروج
            </Button>
          )}
        </div>
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

// ═══════════════ MainLinksSheet (با پورتال و z-index بالا) ═══════════════
export function MainLinksSheet() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("شما خارج شدید");
    router.push("/");
    setOpen(false);
  };

  const sheetContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-[110] h-full w-[290px] sm:w-[320px] bg-card text-foreground shadow-2xl border-l border-border flex flex-col"
          >
            {/* هدر */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link href="/" onClick={() => setOpen(false)}>
                <img
                  src="/log.png"
                  alt="لوگو"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted/60"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* پروفایل */}
            {user ? (
              <div className="flex items-center gap-3 p-4 bg-muted/30 border-b border-border">
              <Avatar className="w-10 h-10 ring-2 ring-primary/30 rounded-full">
  <AvatarImage
    src={
      user.avatar
        ? user.avatar.startsWith("http")
          ? user.avatar
          : `${API_BASE.replace("/api", "")}${user.avatar}`
        : "/images/user.webp"
    }
    alt={user.firstName}
    className="object-cover"
  />
  <AvatarFallback />
</Avatar>
                <div className="text-right">
                  <p className="text-sm font-bold truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{user.phone}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-border">
                <Button
                  className="w-full rounded-xl"
                  onClick={() => { router.push("/auth"); setOpen(false); }}
                >
                  <UserIcon className="w-4 h-4 ml-2" />
                  ورود / ثبت‌نام
                </Button>
              </div>
            )}

            {/* لینک‌ها */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-[10px] font-black text-muted-foreground/70 px-3 py-1.5 uppercase tracking-wider">
                صفحات اصلی
              </p>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {mainLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.href}
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0 },
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold
                                   text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span>{link.label}</span>
                        </div>
                        <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-1" />
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* فوتر */}
            {user && (
              <div className="p-3 border-t border-border bg-muted/20">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  خروج از حساب
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl text-foreground hover:bg-muted/60 active:scale-95 transition-transform"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* پورتال: رندر مستقیم در body برای جلوگیری از تداخل z-index */}
      {mounted && createPortal(sheetContent, document.body)}
    </>
  );
}

// ═══════════════ هدر اصلی — ریسپانسیو سه‌لایه ═══════════════
export function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b bg-card/90 backdrop-blur-md",
        isScrolled
          ? "h-16 bg-background/95 backdrop-blur-md shadow-sm border-border/60"
          : "h-20 md:h-[72px] bg-background/80 backdrop-blur-sm border-border/40"
      )}
      dir="rtl"
    >
      <div className="w-full max-w-[1400px] mx-auto h-full px-4 md:px-6 lg:px-8 flex items-center">

        {/* ═══════════════════════════════════════
            دسکتاپ (lg و بالاتر — ≥1024px)
           ═══════════════════════════════════════ */}
        <div className="hidden lg:flex items-center justify-between w-full gap-8">
          {/* لوگو */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/log.png"
              alt="هویج"
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* سرچ‌باکس */}
          <div className="flex-1 max-w-xl mx-auto w-full">
            <Suspense fallback={null}>
              <SearchBox className="w-full" />
            </Suspense>
          </div>

          {/* اکشن‌ها */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              className="rounded-xl h-9 px-3 gap-2 text-xs font-bold text-foreground/80 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
              onClick={() => router.push("/chat")}
            >
              <MessageCircle className="h-[18px] w-[18px] text-orange-500 dark:text-orange-400" />
              پیام‌ها
            </Button>

            <Button
              variant="ghost"
              className="rounded-xl h-9 px-3 gap-2 text-xs font-bold text-foreground/80 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
              onClick={() =>
                router.push(`/panel/${user?.role || "user"}/bookmarks`)
              }
            >
              <Bookmark className="h-[18px] w-[18px] text-orange-500 dark:text-orange-400" />
              ذخیره‌شده‌ها
            </Button>

            <Button
              variant="ghost"
              className="rounded-xl h-9 px-3 gap-2 text-xs font-bold text-foreground/80 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
              onClick={() => router.push("/pricing")}
            >
              <Gem className="h-[17px] w-[17px] text-orange-500 dark:text-orange-400" />
              اشتراک VIP
            </Button>

            <ThemeToggle />
            <NotificationBell />

            <Button
              className="gap-2 rounded-xl h-9 px-4 text-xs font-bold bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-white shadow-md shadow-orange-500/15 hover:shadow-orange-500/25 transition-all"
              onClick={() => router.push(user ? "/create-ad" : "/auth")}
            >
              <PlusCircle className="h-4 w-4" />
              ثبت آگهی
            </Button>

            <UserMenu />
          </div>
        </div>

        {/* ═══════════════════════════════════════
            تبلت (md تا lg — ≥768px و <1024px)
           ═══════════════════════════════════════ */}
        <div className="hidden md:flex lg:hidden items-center w-full gap-4">
          {/* ردیف بالا — لوگو + سرچ + اکشن‌ها */}
          <div className="flex items-center w-full gap-4">
            {/* منوی همبرگری */}
            <MainLinksSheet />

            {/* لوگو — بزرگ‌تر از موبایل */}
            <Link href="/" className="flex items-center shrink-0">
              <img
                src="/log.png"
                alt="هویج"
                className="h-12 w-auto object-contain"
              />
            </Link>

            {/* سرچ‌باکس — بزرگ‌تر و وسط */}
            <div className="flex-1 max-w-md mx-auto">
              <Suspense fallback={null}>
                <SearchBox className="w-full" />
              </Suspense>
            </div>

            {/* اکشن‌های تبلت */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* دکمه چت — فقط آیکون در تبلت */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
                onClick={() => router.push("/chat")}
              >
                <MessageCircle className="h-[18px] w-[18px] text-orange-500 dark:text-orange-400" />
              </Button>

              {/* دکمه ذخیره‌شده‌ها */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
                onClick={() =>
                  router.push(`/panel/${user?.role || "user"}/bookmarks`)
                }
              >
                <Bookmark className="h-[18px] w-[18px] text-orange-500 dark:text-orange-400" />
              </Button>

              {/* ثبت آگهی — دکمه کوچک‌تر */}
              <Button
                className="gap-1.5 rounded-xl h-9 px-3 text-xs font-bold bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-white shadow-md shadow-orange-500/15 hover:shadow-orange-500/25 transition-all"
                onClick={() => router.push(user ? "/create-ad" : "/auth")}
              >
                <PlusCircle className="h-4 w-4" />
                ثبت آگهی
              </Button>

              <NotificationBell />
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            موبایل (<768px)
           ═══════════════════════════════════════ */}
        <div className="flex md:hidden items-center justify-between w-full gap-2">
          {/* سمت راست — منو + لوگو */}
          <div className="flex items-center gap-1.5">
            <MainLinksSheet />
            <Link href="/" className="flex items-center shrink-0">
              <img
                src="/log.png"
                alt="هویج"
                className="h-9 w-auto object-contain"
              />
            </Link>
          </div>

          {/* وسط — سرچ‌باکس */}
          <div className="flex-1 mx-1.5">
            <Suspense fallback={null}>
              <SearchBox className="w-full" />
            </Suspense>
          </div>

          {/* سمت چپ — اکشن‌ها */}
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}