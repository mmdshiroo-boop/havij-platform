"use client";

import Link from "next/link";
import { ChevronLeft, Home, MapPin } from "lucide-react";
import React from "react";

interface CategoryPath {
  name: string;
  slug?: string;
  _id?: string;
  id?: string;
}

interface AdBreadcrumbProps {
  cityName?: string;
  citySlug?: string;
  categories: CategoryPath[];
  adTitle: string;
}

export function AdBreadcrumb({
  cityName,
  citySlug,
  categories,
  adTitle,
}: AdBreadcrumbProps) {
  const getCategoryHref = (cat: CategoryPath) => {
    const identifier = cat.slug?.trim() || cat._id || cat.id || "";
    if (!identifier || identifier === "all") return "/search";
    return `/search?category=${identifier}`;
  };

  const getCityHref = () => {
    if (
      !cityName ||
      cityName === "همه ایران" ||
      cityName === "all" ||
      citySlug === "all"
    )
      return "/search";
    const cityValue = citySlug && citySlug !== "all" ? citySlug : cityName;
    return `/search?city=${encodeURIComponent(cityValue)}`;
  };

  return (
    <nav
      className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-4 flex-nowrap overflow-x-auto scrollbar-none select-none w-full
      
      {/* استایل موبایل: حذف کامل رنگ و بوردر */}
       shadow-none px-2 py-2
      
      {/* استایل تبلت و دسکتاپ: بازگشت به استایل قبلی */}
       md:backdrop-blur-sm  md:rounded-2xl md:px-4 md:py-2.5"
      dir="rtl"
    >
      {/* خانه */}
      <Link
        href="/"
        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors shrink-0 font-semibold"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden md:inline">خانه</span>
      </Link>

      {/* دسته‌بندی‌ها */}
      {Array.isArray(categories) &&
        categories.length > 0 &&
        categories.map((cat, index) => {
          if (!cat?.name) return null;
          return (
            <React.Fragment key={`${cat.slug || index}-${index}`}>
              <ChevronLeft className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              <Link
                href={getCategoryHref(cat)}
                className="text-muted-foreground hover:text-primary transition-colors font-semibold shrink-0 truncate max-w-[100px] md:max-w-[160px]"
              >
                {cat.name}
              </Link>
            </React.Fragment>
          );
        })}

      {/* شهر */}
      {cityName &&
        cityName !== "همه ایران" &&
        cityName !== "all" &&
        citySlug !== "all" && (
          <>
            <ChevronLeft className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            <Link
              href={getCityHref()}
              className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-2 py-1 rounded-full text-[10px] font-bold shrink-0"
            >
              <MapPin className="w-3 h-3" />
              {cityName}
            </Link>
          </>
        )}

      {/* عنوان آگهی */}
      <ChevronLeft className="w-3 h-3 text-muted-foreground/50 shrink-0" />
      <span className="text-foreground font-black truncate shrink-0 max-w-[120px] md:max-w-[360px]">
        {adTitle}
      </span>
    </nav>
  );
}
