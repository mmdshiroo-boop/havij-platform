"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardColor =
  | "orange"
  | "amber"
  | "emerald"
  | "red"
  | "blue"
  | "violet";

const colorMap: Record<
  StatCardColor,
  { bg: string; border: string; icon: string; blur: string }
> = {
  orange: {
    bg: "bg-orange-100/80 dark:bg-orange-500/15",
    border: "border-orange-300/60 dark:border-orange-500/30",
    icon: "text-orange-600 dark:text-orange-400",
    blur: "bg-orange-200/30 dark:bg-orange-500/15",
  },
  amber: {
    bg: "bg-amber-100/80 dark:bg-amber-500/15",
    border: "border-amber-300/60 dark:border-amber-500/30",
    icon: "text-amber-600 dark:text-amber-400",
    blur: "bg-amber-200/30 dark:bg-amber-500/15",
  },
  emerald: {
    bg: "bg-emerald-100/80 dark:bg-emerald-500/15",
    border: "border-emerald-300/60 dark:border-emerald-500/30",
    icon: "text-emerald-600 dark:text-emerald-400",
    blur: "bg-emerald-200/30 dark:bg-emerald-500/15",
  },
  red: {
    bg: "bg-red-100/80 dark:bg-red-500/15",
    border: "border-red-300/60 dark:border-red-500/30",
    icon: "text-red-600 dark:text-red-400",
    blur: "bg-red-200/30 dark:bg-red-500/15",
  },
  blue: {
    bg: "bg-blue-100/80 dark:bg-blue-500/15",
    border: "border-blue-300/60 dark:border-blue-500/30",
    icon: "text-blue-600 dark:text-blue-400",
    blur: "bg-blue-200/30 dark:bg-blue-500/15",
  },
  violet: {
    bg: "bg-violet-100/80 dark:bg-violet-500/15",
    border: "border-violet-300/60 dark:border-violet-500/30",
    icon: "text-violet-600 dark:text-violet-400",
    blur: "bg-violet-200/30 dark:bg-violet-500/15",
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  colorVariant?: StatCardColor;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  href,
  trend,
  description,
  className,
  colorVariant = "orange",
}: StatCardProps) {
  const colors = colorMap[colorVariant];

  const cardContent = (
    <CardContent className="p-5 flex flex-row items-center justify-between gap-4 h-full">
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-semibold text-muted-foreground truncate">
            {title}
          </p>
          {trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                trend.isPositive
                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-500/10"
                  : "text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-500/10",
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value}
            </span>
          )}
        </div>

        <p className="text-2xl font-black tracking-tight text-foreground leading-tight">
          {value}
        </p>

        {description && (
          <p className="text-[10px] text-muted-foreground/80 leading-relaxed line-clamp-1">
            {description}
          </p>
        )}
      </div>

      <div
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105",
          colors.bg,
          colors.border,
          colors.icon,
          "border",
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={1.8} />
      </div>
    </CardContent>
  );

  const cardClasses = cn(
    "group relative overflow-hidden border border-border/50 transition-all duration-300 h-full",
    "bg-gradient-to-br from-background via-background to-muted/20 dark:from-card dark:via-card dark:to-muted/5",
    "shadow-sm hover:shadow-md",
    href && "cursor-pointer active:scale-[0.98]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Card dir="rtl" className={cardClasses}>
          {cardContent}
          <div
            className={cn(
              "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl pointer-events-none opacity-70",
              colors.blur,
            )}
          />
        </Card>
      </Link>
    );
  }

  return (
    <Card dir="rtl" className={cardClasses}>
      {cardContent}
      <div
        className={cn(
          "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl pointer-events-none opacity-70",
          colors.blur,
        )}
      />
    </Card>
  );
}
