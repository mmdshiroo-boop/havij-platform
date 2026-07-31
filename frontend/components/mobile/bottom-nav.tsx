"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Plus, MessageCircleMore, User, Bookmark } from "lucide-react";

// ساختار رنگی پویا بر اساس نقش‌های پنل کاربر
const roleConfigs: Record<
  string,
  { accent: string; bg: string; text: string }
> = {
  vip: {
    accent: "bg-primary hover:bg-primary",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  agent: {
    accent: "bg-primary hover:bg-primary",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  developer: {
    accent: "bg-primary hover:bg-primary",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
  },
  expert: {
    accent: "bg-primary hover:bg-primary",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  admin: {
    accent: "bg-primary hover:bg-primary",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
  super_admin: {
    accent: "bg-primary hover:bg-primary",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  user: {
    accent: "bg-primary hover:bg-primary",
    bg: "bg-primary/10",
    text: "text-primary",
  },
};

export function BottomNav() {
  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const { unreadCount } = useNotifications();

  // 🔴 کنترل هوشمند نمایش: اگر مسیر با /chat/ شروع شود و شناسه گفتگو داشته باشد، منو مخفی می‌شود
  const isInsideActiveChat =
    pathname.startsWith("/chat/") && pathname.split("/").length > 2;

  if (isInsideActiveChat) {
    return null;
  }

  const userRole = authUser?.role || "user";
  const activeRoleConfig = roleConfigs[userRole] || roleConfigs.user;

  // بررسی وضعیت حضور در پنل کاربری برای استایل‌های پویا
  const isInPanel = pathname.startsWith("/panel");

  // تعریف ۵ آیتم اصلی؛ اگر کاربر لاگین نکرده باشد، به مسیر /auth هدایت می‌شود
  const getNavItems = () => {
    return [
      {
        label: "آگهی‌ها",
        href: "/",
        icon: Home,
      },
      {
        label: "ذخیره‌ها",
        href: authUser ? `/bookmarks` : "/auth",
        icon: Bookmark,
      },
      {
        label: "ثبت آگهی",
        href: authUser ? "/create-ad" : "/auth",
        icon: Plus,
        isCenter: true,
      },
      {
        label: "پیام‌ها و اعلانات",
        href: authUser ? "/chat" : "/auth",
        icon: MessageCircleMore,
        badge: authUser ? unreadCount : 0, // شمارنده واقعی تعداد پیام‌ها و اعلانات خوانده‌نشده
      },
      {
        label: "حساب من",
        href: authUser ? `/profile-menu` : "/auth",
        icon: User,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/60 px-1 pb-safe pt-2 md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.04)] select-none">
      <div className="flex items-center justify-between h-16 max-w-lg mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;

          // بررسی هوشمند وضعیت اکتیو بودن تب‌ها بدون تداخل در زمان ریدایرکت به /auth
          const isActive = (() => {
            if (!authUser) {
              if (pathname === "/auth") {
                // در صفحه auth، فقط آیکون حساب من روشن بماند
                return item.label === "حساب من";
              }
              return pathname === item.href;
            }

            if (item.href === "/") {
              return pathname === "/";
            }

            if (item.href.startsWith("/panel")) {
              return pathname.startsWith("/panel");
            }

            return pathname.startsWith(item.href);
          })();

          // دکمه ثبت آگهی (کاملاً تراز وسط عمودی با متن زیر آن)
          if (item.isCenter) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative flex flex-col items-center justify-center flex-1 h-full py-1 group outline-none"
              >
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="flex flex-col items-center gap-1 w-full relative"
                >
                  {/* دکمه دایره‌ای پلاس با افکت Glow ملایم */}
                  <div className="relative flex items-center justify-center">
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full blur-md opacity-35 transition-all duration-300 group-hover:opacity-65 group-hover:blur-lg",
                        activeRoleConfig.accent,
                      )}
                    />

                    <div
                      className={cn(
                        "relative flex items-center justify-center rounded-full w-10 h-10 text-white transition-all duration-200",
                        "shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                        activeRoleConfig.accent,
                      )}
                    >
                      <Icon className="w-6 h-6 stroke-[3]" />
                    </div>
                  </div>

                  {/* برچسب متنی زیر دکمه پلاس */}
                  <span
                    className={cn(
                      "text-[10px] font-bold transition-all duration-200 tracking-tight text-center truncate max-w-full",
                      isActive
                        ? cn(
                            "font-black",
                            isInPanel ? activeRoleConfig.text : "text-primary",
                          )
                        : "text-muted-foreground/90 group-hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          }

          // سایر آیتم‌های استاندارد منو
          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 group outline-none min-w-0"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex flex-col items-center gap-1 w-full py-1 relative rounded-xl transition-colors duration-200",
                )}
              >
                {/* حباب اکتیو پشت آیکون‌ها */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="bottomNavActiveBubble"
                      className={cn(
                        "absolute inset-x-2 inset-y-0.5 rounded-xl -z-10",
                        isInPanel ? activeRoleConfig.bg : "bg-primary/10",
                      )}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* آیکون و بج تعداد پیام‌ها/اعلانات */}
                <div className="relative">
                  <Icon
                    className={cn(
                      "w-[21px] h-[21px] transition-transform duration-200",
                      isActive
                        ? cn(
                            "stroke-[2.5]",
                            isInPanel ? activeRoleConfig.text : "text-primary",
                          )
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-destructive text-destructive-foreground text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in shadow-sm leading-none">
                      {item.badge > 99 ? "+99" : item.badge}
                    </span>
                  )}
                </div>

                {/* متن آیتم */}
                <span
                  className={cn(
                    "text-[9.5px] font-bold transition-all duration-200 tracking-tight text-center truncate w-full px-0.5",
                    isActive
                      ? cn(
                          "font-black",
                          isInPanel ? activeRoleConfig.text : "text-primary",
                        )
                      : "text-muted-foreground/90",
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
