import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== تابع واحد نمایش تصویر (همه‌جا از این استفاده شود) ====================
export const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "/placeholder.jpg";

  // اگر از قبل یک URL خارجی کامل است (غیر localhost) آن را برگردان
  if (imagePath.startsWith("http") && !imagePath.includes("localhost:5001")) {
    return imagePath;
  }

  // استخراج آدرس پایه از متغیر محیطی API (بدون /api در انتها)
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api").replace(/\/api$/, "");

  // جایگزینی localhost با Railway (اگر تصاویر قدیمی با localhost ذخیره شده‌اند)
  if (imagePath.startsWith("http://localhost:5001")) {
    return imagePath.replace("http://localhost:5001", backendBase);
  }

  // مسیرهای نسبی (با / شروع می‌شوند)
  return `${backendBase}${imagePath}`;
};

// تابع کمکی برای آواتار و مواردی که نیاز به URL کامل دارند
export const getFullImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api").replace(/\/api$/, "");
  return `${backendBase}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};