import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تابع مرکزی تولید URL تصاویر (جایگزین تمام توابع تکراری در پروژه)
 * @param imagePath مسیر نسبی یا مطلق تصویر
 * @returns آدرس کامل قابل استفاده در src
 */
export function getImageUrl(imagePath?: string): string {
  // پیش‌فرض: تصویر placeholder در public (مثلاً user.webp)
  if (!imagePath) return "/images/user.webp";

  // اگر URL کامل است و localhost قدیمی نیست، همان را برگردان
  if (imagePath.startsWith("http") && !imagePath.includes("localhost:5001")) {
    return imagePath;
  }

  // پایه‌ی بک‌اند (بدون /api انتهایی)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
  const backendBase = apiBase.replace(/\/api\/?$/, "").replace(/\/+$/, "");

  // جایگزینی localhost قدیمی با دامنهٔ واقعی (Railway یا لوکال)
  if (imagePath.startsWith("http://localhost:5001")) {
    return imagePath.replace("http://localhost:5001", backendBase);
  }

  // مسیرهای نسبی (با / شروع می‌شوند)
  if (imagePath.startsWith("/")) {
    return `${backendBase}${imagePath}`;
  }

  // سایر موارد (بدون /) – پیش‌فرض همان مسیر نسبی در public
  return `/${imagePath}`;
}

/**
 * تابع کمکی برای مواردی که نیاز به URL کامل دارند (مثلاً آواتار قدیمی)
 * @deprecated به جای آن از getImageUrl استفاده کنید
 */
export function getFullImageUrl(imagePath?: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
  const backendBase = apiBase.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${backendBase}${cleanPath}`;
}