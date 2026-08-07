"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Crown,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart3,
  Eye,
  Headset,
  BadgeCheck,
  Rocket,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";

interface VipPromoCardProps {
  href?: string;
  source?: string;
  compact?: boolean;
  className?: string;
  title?: string;
  description?: string;
  ctaText?: string;
}

const FEATURES_FULL = [
  { icon: Eye, title: "نمایش ویژه آگهی", description: "آگهی‌هات در صدر نتایج قرار می‌گیرن" },
  { icon: BarChart3, title: "تحلیل بازار مسکن", description: "قیمت‌های روز و روند بازار" },
  { icon: Zap, title: "ثبت آگهی فوری", description: "آگهی فوری با اولویت بالاتر" },
  { icon: TrendingUp, title: "آمار بازدید", description: "ببین چند نفر آگهی‌هات رو دیدن" },
  { icon: Headset, title: "پشتیبانی اختصاصی", description: "تیکت‌هات زودتر بررسی می‌شن" },
  { icon: ShieldCheck, title: "نشان تأیید VIP", description: "پروفایلت با نشان ویژه متمایز می‌شه" },
];

const FEATURES_COMPACT = [
  { icon: Eye, title: "نمایش ویژه" },
  { icon: BarChart3, title: "تحلیل بازار" },
  { icon: ShieldCheck, title: "پشتیبانی VIP" },
];

const STATS = [
  { value: "۳x", label: "بازدید بیشتر" },
  { value: "۲x", label: "فروش سریع‌تر" },
  { value: "24/7", label: "پشتیبانی" },
];

export function VipPromoCard({
  href = "/pricing",
  source = "vip-promo",
  compact = false,
  className,
  title,
  description,
  ctaText,
}: VipPromoCardProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  if (
    user &&
    ["vip", "agent", "expert", "admin", "super_admin"].includes(user.role)
  ) {
    return null;
  }

  const finalHref = `${href}${href.includes("?") ? "&" : "?"}source=${encodeURIComponent(source)}`;
  const defaultTitle = compact ? "ارتقا به VIP" : "بیشتر دیده شو، سریع‌تر بفروش";
  const defaultDescription = compact
    ? "دسترسی به امکانات ویژه و بازدید بیشتر"
    : "با اشتراک VIP هویج، آگهی‌هات در صدر نتایج قرار می‌گیرن و به ابزارهای حرفه‌ای دسترسی پیدا می‌کنی.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <Link
        href={finalHref}
        className="block group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "relative overflow-hidden rounded-3xl border",
            "border-orange-200/60 dark:border-orange-700/30",
            "bg-gradient-to-br from-orange-50 via-background to-amber-50/60",
            "dark:from-orange-950/30 dark:via-background dark:to-amber-950/15",
            "shadow-[0_8px_32px_rgba(249,115,22,0.08)]",
            compact ? "p-4" : "p-5 md:p-6 lg:p-7",
          )}
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[260px] h-[140px] bg-orange-400/8 dark:bg-orange-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-200/10 to-transparent pointer-events-none"
            initial={{ x: "-100%" }}
            animate={isHovered ? { x: "100%" } : { x: "-100%" }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:18px_18px]" />

          <div className="relative z-10">
            {/* بالا */}
            <div className="flex items-start justify-between gap-4 lg:gap-8">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100/90 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 text-[10px] font-extrabold border border-orange-200/60 dark:border-orange-700/40">
                  <Sparkles className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                  محبوب‌ترین پلن کاربران
                </div>
                <h3 className={cn("mt-2.5 font-black text-foreground leading-snug", compact ? "text-sm" : "text-base md:text-lg lg:text-xl")}>
                  {title || defaultTitle}
                </h3>
                <p className={cn("mt-1.5 text-muted-foreground leading-relaxed", compact ? "text-[11px]" : "text-xs md:text-[13px] lg:text-sm max-w-[500px]")}>
                  {description || defaultDescription}
                </p>

                {/* آمار - فقط در حالت full و روی تبلت/دسکتاپ زیبا */}
                {!compact && (
                  <div className="hidden sm:flex items-center gap-2.5 mt-5">
                    {STATS.map((stat, i) => (
                      <div key={i} className="flex-1 sm:flex-none sm:min-w-[110px] lg:min-w-[130px] text-center py-2.5 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-100/60 dark:border-orange-800/25">
                        <p className="text-base lg:text-lg font-black text-orange-600 dark:text-orange-400 leading-none">{stat.value}</p>
                        <p className="text-[10px] lg:text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Crown */}
              <div className="shrink-0 relative">
                <div className={cn("relative rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white shadow-lg flex items-center justify-center", compact ? "w-11 h-11" : "w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16")}>
                  <Crown className={compact ? "w-5 h-5" : "w-6 h-6 lg:w-7 lg:h-7"} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* ویژگی‌ها */}
            <div className={cn("mt-5", compact ? "" : "lg:mt-6")}>
              {!compact && (
                <div className="flex items-center gap-2 mb-3">
                  <BadgeCheck className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  <span className="text-xs lg:text-sm font-extrabold text-foreground/80">امکانات اشتراک VIP</span>
                </div>
              )}

              {compact ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {FEATURES_COMPACT.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-orange-100/80 dark:border-orange-800/25 bg-white/70 dark:bg-background/50">
                        <Icon className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                        <span className="text-[10px] font-bold text-foreground/85">{f.title}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 lg:gap-3">
                  {FEATURES_FULL.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="rounded-2xl border border-orange-100/60 dark:border-orange-800/20 bg-white/60 dark:bg-background/40 p-3 md:p-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-orange-100/80 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 md:w-4.5 md:h-4.5 text-orange-500 dark:text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] md:text-xs font-extrabold text-foreground/90 leading-snug">{f.title}</p>
                            <p className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5 leading-snug">{f.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* فوتر CTA */}
            <div className="flex items-center justify-between gap-3 mt-5 lg:mt-6">
              <div className="flex items-center gap-2">
                {!compact && (
                  <div className="hidden sm:flex -space-x-1">
                    {[0, 1, 2].map((i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    ))}
                  </div>
                )}
                <p className="text-[10px] md:text-[11px] text-muted-foreground/60">
                  {compact ? "برای کاربران فعال" : "مورد اعتماد کاربران حرفه‌ای هویج"}
                </p>
              </div>
              <div className={cn("inline-flex items-center gap-1.5 shrink-0 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold shadow-md transition-colors", compact ? "px-3.5 py-2 text-[11px]" : "px-5 py-2.5 md:px-6 md:py-3 text-xs md:text-sm")}>
                <Rocket className="w-4 h-4" />
                <span>{ctaText || (compact ? "ارتقا" : "مشاهده پلن‌های VIP")}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}