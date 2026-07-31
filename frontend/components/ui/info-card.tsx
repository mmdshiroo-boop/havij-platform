import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

// ─── کلاس‌های ثابت ───────────────────────────────────
export const infoCardClass = cn(
  "group transition-all duration-200",
  "bg-white dark:bg-card",
  "border border-border/50", // حاشیهٔ ملایم بر اساس تم
  "shadow-md hover:shadow-lg",
  "bg-gradient-to-br from-amber-50/10 to-transparent", // گرادیان نارنجی ملایم
  "dark:bg-gradient-to-br dark:from-amber-950/10 dark:to-transparent",
);

export const infoCardIconClass = cn(
  "p-2.5 rounded-xl",
  "bg-primary/10 text-primary", // نارنجی زمینه‌دار بدون border
  "group-hover:scale-110 transition-transform",
  "flex items-center justify-center",
);

export const infoCardArrowClass = cn(
  "w-4 h-4 text-muted-foreground",
  "opacity-0 group-hover:opacity-100",
  "transition-all -translate-x-2 group-hover:translate-x-0", // حرکت به چپ در RTL
);

// ─── Props ──────────────────────────────────────────
interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode; // محتوای سفارشی به‌جای ArrowLeft
  iconClassName?: string;
}

// ─── کامپوننت اصلی (قابل کلیک / لینک) ─────────────
export function InfoCard({
  icon,
  title,
  description,
  href,
  onClick,
  className,
  children,
  iconClassName,
}: InfoCardProps) {
  const content = (
    <CardContent className="p-4 flex items-center gap-4">
      {/* کادر آیکون */}
      <div className={cn(infoCardIconClass, iconClassName)}>{icon}</div>

      {/* متن */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {description}
          </p>
        )}
      </div>

      {/* فلش (یا custom) */}
      {children ? children : <ArrowLeft className={infoCardArrowClass} />}
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className={cn(infoCardClass, "cursor-pointer", className)}>
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card
      className={cn(infoCardClass, onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      {content}
    </Card>
  );
}

// ─── نسخهٔ استاتیک (نمایش مقدار ثابت) ─────────────
export function InfoCardStatic({
  icon,
  title,
  value,
  subtitle,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Card className={cn(infoCardClass, "hover:shadow-lg", className)}>
      <CardContent className="p-5 flex items-center gap-4">
        {/* آیکون */}
        <div className={cn(infoCardIconClass)}>{icon}</div>

        {/* عنوان + مقدار + زیرنویس */}
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground">{title}</p>
          <p className="text-2xl font-black mt-1 tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* فلش */}
        <ArrowLeft className={infoCardArrowClass} />
      </CardContent>
    </Card>
  );
}
