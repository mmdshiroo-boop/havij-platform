"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  color?: "orange" | "blue" | "green" | "purple" | "red";
  href?: string;
  onClick?: () => void;
}

const colorMap: Record<string, string> = {
  orange:
    "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  green:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  purple:
    "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

const trendIcons: Record<string, string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

const trendColors: Record<string, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  stable: "text-gray-500 dark:text-gray-400",
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = "orange",
  href,
  onClick,
}: KpiCardProps) {
  const content = (
    <div className="transition-all bg-card shadow-card hover:shadow-lg border border-border/50 rounded-2xl cursor-pointer group h-full">
      <div className="p-5 flex items-center gap-4">
        {/* Icon */}
        <div
          className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0 ${
            colorMap[color] || colorMap.orange
          }`}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-card-foreground truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-foreground tabular-nums">
              {value}
            </span>
            {trend && trendValue && (
              <span
                className={`text-xs font-bold flex items-center gap-0.5 ${
                  trendColors[trend]
                }`}
              >
                <span>{trendIcons[trend]}</span>
                <span>{trendValue}</span>
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Arrow (if link) */}
        {href && (
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 flex-shrink-0" />
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-right">
        {content}
      </button>
    );
  }

  return content;
}
