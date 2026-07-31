"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  categoryApi,
  Category as CategoryType,
} from "@/services/api/category.api";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getCategoryIcon } from "@/components/common/CategoryMenu";

export function CategoryNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        const mainCats = data.filter((cat) => !cat.parentId);
        setCategories(mainCats);
      } catch (error) {
        console.error("Error fetching nav categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // مدیریت نمایش فلش‌ها بر اساس میزان اسکرول واقعی مرورگر
  const checkArrows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // در حالت RTL، مقدار scrollLeft معمولاً منفی یا صفر است
    const isScrollable = scrollWidth > clientWidth;

    if (!isScrollable) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }

    // بررسی دقیق موقعیت اسکرول در سیستم راست‌چین
    setShowLeftArrow(Math.abs(scrollLeft) < scrollWidth - clientWidth - 10);
    setShowRightArrow(Math.abs(scrollLeft) > 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkArrows);
      // یک بررسی اولیه بعد از رندر شدن محتوا
      setTimeout(checkArrows, 200);
    }
    return () => container?.removeEventListener("scroll", checkArrows);
  }, [categories, loading]);

  const handleScroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 240;
    // در حالت RTL جهت مثبت و منفی اسکرول متفاوت است
    const sign = direction === "left" ? -1 : 1;
    
    container.scrollBy({
      left: scrollAmount * sign,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="w-full bg-background border-b border-zinc-100 py-4">
        <div className="w-full max-w-[1200px] mx-auto px-4 flex items-center justify-center gap-4 overflow-hidden" dir="rtl">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[95px] animate-pulse">
              <div className="w-14 h-14 rounded-full bg-zinc-100 mx-auto" />
              <div className="w-14 h-3 bg-zinc-100 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background border-b border-zinc-100 dark:border-border/40 py-4 relative select-none" dir="rtl">
      <div className="w-full max-w-[1200px] mx-auto px-6 relative flex items-center">
        
        {/* فلش راست */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-background border border-border/60 shadow-sm rounded-full text-zinc-600 hover:bg-muted active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* 📱 باکس اصلی اسکرول: در موبایل با لمس کاملاً روان (Touch) حرکت می‌کند و در دسکتاپ در مرکز قرار می‌گیرد */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto flex md:justify-center items-center gap-3 sm:gap-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x snap-x"
        >
          {categories.map((cat) => {
            const isActive = currentCategory === cat.slug;

            return (
              <div
                key={cat._id}
                onClick={() => router.push(`/search?category=${cat.slug}`)}
                className="flex flex-col p-2 mt-5 items-center gap-2.5 group text-center shrink-0 w-[98px] sm:w-[108px] cursor-pointer snap-center"
              >
                <div
                  className={`w-14 h-14 sm:w-15 sm:h-15 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm pointer-events-none
                    ${
                      isActive
                        ? "bg-orange-500 text-white scale-105 ring-4 ring-orange-500/20"
                        : "bg-[#fafafa] dark:bg-muted/40 text-zinc-700 dark:text-zinc-300 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md"
                    }`}
                >
                  {getCategoryIcon(
                    cat.icon,
                    `w-6 h-6 transition-colors duration-200 ${isActive ? "text-white" : "text-zinc-600 group-hover:text-white dark:text-zinc-400"}`,
                    cat.name,
                    cat.slug,
                  )}
                </div>

                <span
                  className={`text-[12px] font-bold transition-colors tracking-tight w-full truncate px-0.5 pointer-events-none
                    ${isActive ? "text-orange-500 font-extrabold" : "text-zinc-700 dark:text-zinc-300 group-hover:text-orange-500"}`}
                >
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* فلش چپ */}
        {/* {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-background border border-border/60 shadow-sm rounded-full text-zinc-600 hover:bg-muted active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )} */}
      </div>
    </div>
  );
}