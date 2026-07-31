"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ──────────────────────────────────────────────
// تایپ داده‌ی هر اسلاید
// ──────────────────────────────────────────────
export interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  link: string;
  buttonText: string;
}

// ──────────────────────────────────────────────
// داده‌های پیش‌فرض نمایشی
// ──────────────────────────────────────────────
const defaultSlides: Slide[] = [
  {
    id: 1,
    image: "https://placehold.co/1200x500/EAEAEA/333333?text=Slide+1",
    title: "بهترین آگهی‌های املاک",
    subtitle: "هزاران آگهی معتبر در سراسر ایران",
    badge: "پرطرفدار",
    badgeColor: "from-amber-500 to-orange-600",
    link: "/ads",
    buttonText: "مشاهده آگهی‌ها",
  },
  {
    id: 2,
    image: "https://placehold.co/1200x500/EAEAEA/333333?text=Slide+2",
    title: "ویلاهای لواسان و شمال",
    subtitle: "ویلای رویایی خود را پیدا کنید",
    badge: "فوری",
    badgeColor: "from-rose-500 to-red-600",
    link: "/villas",
    buttonText: "جستجوی ویلا",
  },
  {
    id: 3,
    image: "https://placehold.co/1200x500/EAEAEA/333333?text=Slide+3",
    title: "آپارتمان‌های تهران",
    subtitle: "جدیدترین آگهی‌های آپارتمان",
    link: "/apartments",
    buttonText: "آپارتمان‌ها",
  },
  {
    id: 4,
    image: "https://placehold.co/1200x500/EAEAEA/333333?text=Slide+4",
    title: "مشاور املاک شوید",
    subtitle: "عضویت ویژه آژانس‌های املاک",
    badge: "VIP",
    badgeColor: "from-purple-500 to-indigo-600",
    link: "/join",
    buttonText: "عضویت آژانس",
  },
];

// ──────────────────────────────────────────────
// تنظیمات اسلایدر
// ──────────────────────────────────────────────
const AUTOPLAY_INTERVAL = 5000; // مدت زمان نمایش هر اسلاید (میلی‌ثانیه)
const DRAG_THRESHOLD = 50; // حداقل فاصله برای تشخیص سوایپ (پیکسل)

// ──────────────────────────────────────────────
// کامپوننت اصلی اسلایدر
// ──────────────────────────────────────────────
interface HomeSliderProps {
  slides?: Slide[];
  autoplay?: boolean;
}

export default function HomeSlider({
  slides = defaultSlides,
  autoplay = true,
}: HomeSliderProps) {
  // ── وضعیت‌ها ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // ── رفرنس‌ها ──
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(
    null,
  );
  const sliderRef = useRef<HTMLDivElement>(null);
  const progressStartRef = useRef<number>(0);

  // ── تعداد کل اسلایدها ──
  const totalSlides = slides.length;

  // ────────────────────────────────────────────
  // رفتن به اسلاید قبلی
  // ────────────────────────────────────────────
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  // ────────────────────────────────────────────
  // رفتن به اسلاید بعدی
  // ────────────────────────────────────────────
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  // ────────────────────────────────────────────
  // رفتن به اسلاید خاص
  // ────────────────────────────────────────────
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // ────────────────────────────────────────────
  // نوار پیشرفت خودکار
  // انیمیشن بر اساس requestAnimationFrame
  // ────────────────────────────────────────────
  const startProgress = useCallback(() => {
    // پاک‌سازی انیمیشن قبلی
    if (progressRef.current) {
      cancelAnimationFrame(progressRef.current);
    }

    progressStartRef.current = performance.now();
    setProgress(0);

    const animate = (now: number) => {
      const elapsed = now - progressStartRef.current;
      const pct = Math.min((elapsed / AUTOPLAY_INTERVAL) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        progressRef.current = requestAnimationFrame(animate);
      }
    };

    progressRef.current = requestAnimationFrame(animate);
  }, []);

  // ────────────────────────────────────────────
  // شروع پخش خودکار
  // ────────────────────────────────────────────
  const startAutoplay = useCallback(() => {
    if (!autoplay) return;

    // پاک‌سازی قبلی
    if (intervalRef.current) clearInterval(intervalRef.current);

    startProgress();

    intervalRef.current = setInterval(() => {
      goToNext();
      startProgress();
    }, AUTOPLAY_INTERVAL);
  }, [autoplay, goToNext, startProgress]);

  // ────────────────────────────────────────────
  // توقف پخش خودکار
  // ────────────────────────────────────────────
  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressRef.current) {
      cancelAnimationFrame(progressRef.current);
      progressRef.current = null;
    }
    setProgress(0);
  }, []);

  // ────────────────────────────────────────────
  // مدیریت تغییر اسلاید → ریست نوار پیشرفت
  // ────────────────────────────────────────────
  useEffect(() => {
    if (autoplay && !isHovered && isVisible && !isDragging) {
      startProgress();
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // ────────────────────────────────────────────
  // شروع/توقف بر اساس هاور
  // ────────────────────────────────────────────
  useEffect(() => {
    if (isHovered || !isVisible || isDragging) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  }, [isHovered, isVisible, isDragging, startAutoplay, stopAutoplay]);

  // ────────────────────────────────────────────
  // پاک‌سازی هنگام حذف کامپوننت
  // ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAutoplay();
    };
  }, [stopAutoplay]);

  // ────────────────────────────────────────────
  // IntersectionObserver: توقف پخش وقتی خارج از دید است
  // ────────────────────────────────────────────
  useEffect(() => {
    const element = sliderRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.25 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  // ────────────────────────────────────────────
  // پشتیبانی از کلیدهای کیبورد
  // ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // فقط اگر اسلایدر در دید باشد
      if (!isVisible) return;

      if (e.key === "ArrowLeft") {
        // در RTL فلش چپ = بعدی
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowRight") {
        // در RTL فلش راست = قبلی
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, goToNext, goToPrev]);

  // ────────────────────────────────────────────
  // رویدادهای سوایپ / درگ (لمسی + ماوس)
  // ────────────────────────────────────────────
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX);
  }, []);

  const handleDragEnd = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      setIsDragging(false);

      const diff = clientX - dragStartX;

      // در RTL جهت برعکس است
      if (diff > DRAG_THRESHOLD) {
        // سوایپ به چپ (در RTL) = قبلی
        goToPrev();
      } else if (diff < -DRAG_THRESHOLD) {
        // سوایپ به راست (در RTL) = بعدی
        goToNext();
      }
    },
    [isDragging, dragStartX, goToPrev, goToNext],
  );

  // رویدادهای لمسی
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientX);
    },
    [handleDragStart],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      handleDragEnd(e.changedTouches[0].clientX);
    },
    [handleDragEnd],
  );

  // رویدادهای ماوس
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientX);
    },
    [handleDragStart],
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      handleDragEnd(e.clientX);
    },
    [handleDragEnd],
  );

  const onMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  // ────────────────────────────────────────────
  // اسلاید فعلی
  // ────────────────────────────────────────────
  const currentSlide = slides[currentIndex];

  // ────────────────────────────────────────────
  // رندر
  // ────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      ref={sliderRef}
      className="relative w-full select-none rounded-2xl overflow-hidden group"
      style={{ aspectRatio: "12 / 5" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        onMouseLeave();
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      role="region"
      aria-label="اسلایدر اصلی"
      tabIndex={0}
    >
      {/* ─── پس‌زمینه اسلایدها با ترنزیشن ─── */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: index === currentIndex ? 1 : 0,
              zIndex: index === currentIndex ? 1 : 0,
            }}
          >
            {/* تصویر پس‌زمینه */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />

            {/* گرادیانت تیره از راست به چپ (RTL) */}
            <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent" />
          </div>
        ))}
      </div>

      {/* ─── محتوای اسلاید فعلی با انیمیشن ─── */}
      <div className="relative z-10 flex items-center justify-end h-full px-4 sm:px-8 md:px-12 lg:px-16">
        <div
          className="w-full max-w-md transition-all duration-700 ease-out"
          key={currentSlide.id}
          style={{
            opacity: 1,
            transform: "translateX(0)",
            animation: "slideInRight 0.7s ease-out",
          }}
        >
          {/* کارت شیشه‌ای */}
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
            {/* نشان (بج) */}
            {currentSlide.badge && (
              <div className="mb-4">
                <span
                  className={`inline-block bg-gradient-to-l ${currentSlide.badgeColor || "from-orange-500 to-amber-500"} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}
                >
                  {currentSlide.badge}
                </span>
              </div>
            )}

            {/* عنوان */}
            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-snug mb-3 drop-shadow-lg">
              {currentSlide.title}
            </h2>

            {/* زیرعنوان */}
            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6">
              {currentSlide.subtitle}
            </p>

            {/* دکمه اقدام */}
            <a
              href={currentSlide.link}
              className="inline-flex items-center gap-2 bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm md:text-base px-6 py-3 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98]"
            >
              {currentSlide.buttonText}
              {/* فلش چپ (در RTL به معنای جلو رفتن است) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ─── دکمه‌های جهت‌نما (فلش چپ و راست) ─── */}
      {/* دکمه بعدی (سمت چپ در RTL) */}
      <button
        onClick={goToNext}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/25 hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="اسلاید بعدی"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* دکمه قبلی (سمت راست در RTL) */}
      <button
        onClick={goToPrev}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/25 hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="اسلاید قبلی"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* ─── نقطه‌های راهنما (دات‌ها) ─── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              index === currentIndex
                ? "w-8 h-2.5 bg-gradient-to-l from-orange-500 to-amber-400 shadow-lg shadow-orange-500/40"
                : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`رفتن به اسلاید ${index + 1}`}
            aria-current={index === currentIndex ? "true" : undefined}
          />
        ))}
      </div>

      {/* ─── نوار پیشرفت پخش خودکار ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-orange-500 to-amber-400 transition-[width] duration-100 ease-linear"
          style={{
            width: `${isHovered || !isVisible || isDragging ? 0 : progress}%`,
          }}
        />
      </div>

      {/* ─── استایل‌های انیمیشن CSS ─── */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
