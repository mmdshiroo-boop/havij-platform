"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  User,
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
  History,
  Key,
  Webhook,
  BookOpen,
  Bell,
  LucideIcon,
  ScrollText,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  role?: string;
}
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

const getFullImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
  const baseUrl = apiUrl.replace(/\/api$/, "");

  let cleanPath = imagePath;
  if (cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.replace("/api", "");
  }

  if (cleanPath.startsWith("/uploads")) {
    return `${baseUrl}${cleanPath}`;
  }

  return `${baseUrl}/uploads/${cleanPath}`;
};

// ─── منوها (همه با "گزارشات تخلف من" اضافه شده) ───

const defaultMenuItems: MenuItem[] = [
  { icon: User, label: "پروفایل کاربری", href: "/panel/user/profile" },
  { icon: FileText, label: "آگهی‌های من", href: "/panel/user/my-ads" },
  { icon: Heart, label: "نشان شده‌ها", href: "/panel/user/favorites" },
  { icon: MessageCircle, label: "صندوق پیام‌ها", href: "/chats" },
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/user/reports-my" }, // 🆕
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
  { icon: User, label: "پروفایل ویژه", href: "/panel/vip/profile" },
  { icon: Crown, label: "باشگاه مشتریان VIP", href: "/panel/vip/benefits" },
  {
    icon: BarChart3,
    label: "آنالیز پیشرفته آگهی‌ها",
    href: "/panel/vip/stats",
  },
  { icon: FileText, label: "آگهی‌های من", href: "/panel/vip/my-ads" },
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/vip/reports-my" }, // 🆕
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
  { icon: User, label: "پروفایل تجاری", href: "/panel/agent/profile" },
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
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/agent/reports-my" }, // 🆕
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
  { icon: User, label: "پروفایل کارشناسی", href: "/panel/expert/profile" },
    { icon: User, label: "پروفایل کارشناسی", href: "/panel/expert/profile" },

  {
    icon: Clock,
    label: "آگهی‌های در انتظار بررسی",
    href: "/panel/expert/pending-ads",
  },
  { icon: Flag, label: "گزارشات تخلف کاربران", href: "/panel/expert/reports" },
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/expert/reports-my" }, // 🆕
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
  { icon: User, label: "پروفایل", href: "/panel/developer/profile" },
  { icon: Key, label: "API Keys", href: "/panel/developer/api-key" },
  { icon: Webhook, label: "Webhooks", href: "/panel/developer/webhooks" },
  { icon: BookOpen, label: "مستندات", href: "/panel/developer/docs" },
  { icon: Bell, label: "اعلان‌ها", href: "/panel/developer/notifications" },
  { icon: Flag, label: "گزارشات تخلف من", href: "/panel/developer/reports-my" }, // 🆕
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
  { icon: User, label: "پروفایل ادمین", href: "/panel/admin/profile" },
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
    icon: User,
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
    return user?.phone?.slice(-2) || "V";
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
          icon: User,
          className: "bg-primary/10 text-primary ring-primary/20",
        };
    }
  };

  const roleConfig = getRoleBadgeConfig();
  const RoleIcon = roleConfig.icon;

  const profileImageSrc = user?.avatar
    ? getFullImageUrl(user.avatar)
    : "/images/user.webp";

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
        <User className="w-4 h-4" />
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
            <AvatarImage src="/images/user.webp" className="object-cover" />
            <AvatarFallback className="bg-muted text-foreground font-black text-sm">
              {getInitials()}
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
        {/* هدر دراپ‌داون */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/20 backdrop-blur-sm mb-2">
          <Avatar className="w-14 h-14 ring-2 ring-primary/20 shadow-lg rounded-full">
            <AvatarImage
              key={avatarKey}
              src={avatarSrc}
              className="object-cover"
            />
            {/* دیگر متن نمایش داده نمی‌شود – همیشه تصویر user.webp را نشان می‌دهد */}
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
