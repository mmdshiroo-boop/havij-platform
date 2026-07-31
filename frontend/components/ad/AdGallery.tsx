"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Grid3X3,
  ImageOff,
} from "lucide-react";

interface AdImageGalleryProps {
  images: string[];
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
}

// ✅ تابع اصلاح‌شده برای جایگزینی localhost با دامنه Railway
const getImageUrl = (url: string) => {
  if (!url) return "/placeholder.jpg";

  // دامنه واقعی بک‌اند (بدون /api) را از متغیر محیطی می‌گیریم
  const backendBase = (
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001"
  );

  // اگر آدرس با localhost شروع شده باشد، آن را با backendBase جایگزین می‌کنیم
  if (url.startsWith("http://localhost:5001")) {
    return url.replace("http://localhost:5001", backendBase);
  }

  // اگر مسیر نسبی باشد (با / شروع شود)، دامنه را به ابتدا اضافه می‌کنیم
  if (url.startsWith("/")) {
    return backendBase + url;
  }

  // در غیر این صورت (آدرس خارجی کامل)، بدون تغییر برگردان
  return url;
};

export default function AdImageGallery({
  images,
  isModalOpen,
  setIsModalOpen,
  currentIndex,
  setCurrentIndex,
}: AdImageGalleryProps) {
  // ... بقیه کد کامپوننت دقیقاً همان است که فرستادید، بدون هیچ تغییری
  const [mounted, setMounted] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isModalOpen, currentIndex]);

  const totalImages = images?.length || 0;

  const handleOpenModal = (index: number) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  const handleNext = useCallback(() => {
    if (totalImages <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const handlePrev = useCallback(() => {
    if (totalImages <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const handleImageError = (idx: number) => {
    setImgErrors((prev) => new Set(prev).add(idx));
  };

  if (!images || totalImages === 0) {
    return (
      <div className="w-full h-56 md:h-64 bg-muted/30 rounded-none sm:rounded-2xl flex flex-col items-center justify-center text-muted-foreground border-y sm:border border-border/50 gap-3">
        <ImageOff className="w-10 h-10 opacity-40" />
        <span className="text-sm">تصویری برای این آگهی ثبت نشده است</span>
      </div>
    );
  }

  const Thumbnail = ({
    img,
    idx,
    priority = false,
  }: {
    img: string;
    idx: number;
    priority?: boolean;
  }) => (
    <div
      className="relative w-full h-full cursor-pointer overflow-hidden group rounded-none sm:rounded-xl sm:border border-border/30 shadow-sm sm:hover:shadow-md transition-shadow"
      onClick={() => handleOpenModal(idx)}
    >
      {!imgErrors.has(idx) ? (
        <img
          src={getImageUrl(img)}
          alt={`تصویر ${idx + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading={priority ? "eager" : "lazy"}
          onError={() => handleImageError(idx)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <ImageOff className="w-6 h-6 text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
      </div>
    </div>
  );

  return (
    <div
      className="w-full max-w-7xl mx-auto sm:px-4 py-0 sm:py-4 -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full"
      dir="rtl"
    >
      {totalImages === 1 && (
        <div className="w-full flex justify-center">
          <div className="relative w-full md:w-[65%] h-[280px] sm:h-[340px] md:h-[400px] sm:rounded-2xl overflow-hidden sm:shadow-md sm:border border-border/50">
            <Thumbnail img={images[0]} idx={0} priority />
          </div>
        </div>
      )}

      {totalImages === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 sm:gap-3 h-[280px] sm:h-[340px] md:h-[400px] sm:rounded-2xl overflow-hidden sm:shadow-md">
          <Thumbnail img={images[0]} idx={0} priority />
          <div className="hidden md:block h-full">
            <Thumbnail img={images[1]} idx={1} />
          </div>
        </div>
      )}

      {totalImages === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 sm:gap-3 h-[300px] sm:h-[350px] md:h-[420px] sm:rounded-2xl overflow-hidden sm:shadow-md">
          <div className="col-span-1 md:col-span-2 h-full">
            <Thumbnail img={images[0]} idx={0} priority />
          </div>
          <div className="hidden md:flex flex-col gap-3 h-full">
            <Thumbnail img={images[1]} idx={1} />
            <Thumbnail img={images[2]} idx={2} />
          </div>
        </div>
      )}

      {totalImages >= 4 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0.5 sm:gap-3 h-[300px] sm:h-[350px] md:h-[450px] sm:rounded-2xl overflow-hidden sm:shadow-md relative">
          <div className="col-span-1 md:col-span-2 h-full relative">
            <Thumbnail img={images[0]} idx={0} priority />
            <div className="absolute bottom-3 right-3 md:hidden z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal(0);
                }}
                className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg"
              >
                <Grid3X3 className="w-3.5 h-3.5" />۱ از {totalImages}
              </button>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 col-span-2 gap-3 h-full">
            {images.slice(1, 5).map((img, index) => {
              const actualIndex = index + 1;
              return (
                <div key={index} className="relative h-full">
                  <Thumbnail img={img} idx={actualIndex} />
                  {index === 3 && totalImages > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(0);
                        }}
                        className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl hover:bg-white transition-all"
                      >
                        <Grid3X3 className="w-4 h-4 text-primary" />+
                        {totalImages - 4} تصویر دیگر
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== FULLSCREEN MODAL ===================== */}
      {isModalOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between p-4 sm:p-6 select-none">
            <div className="w-full max-w-7xl flex justify-between items-center text-white/80 border-b border-white/10 pb-3 mt-safe">
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-mono text-white font-bold tracking-widest">
                {currentIndex + 1} / {totalImages}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full max-w-5xl h-[65vh] md:h-[75vh] flex items-center justify-center my-auto">
              {totalImages > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-1 md:-left-16 z-20 p-2.5 md:p-3 bg-black/40 md:bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all active:scale-90"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}

              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={getImageUrl(images[currentIndex])}
                  alt={`تصویر ${currentIndex + 1}`}
                  className="max-h-full max-w-full object-contain drop-shadow-2xl"
                />
              </div>

              {totalImages > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-1 md:-right-16 z-20 p-2.5 md:p-3 bg-black/40 md:bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all active:scale-90"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
            </div>

            {totalImages > 1 && (
              <div className="w-full max-w-4xl border-t border-white/10 pt-4 flex gap-2 justify-center overflow-x-auto pb-safe scrollbar-none">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative w-14 h-14 md:w-20 md:h-14 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                      currentIndex === index
                        ? "ring-2 ring-primary scale-105 opacity-100 shadow-lg"
                        : "opacity-40 hover:opacity-80"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`تصویر ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}