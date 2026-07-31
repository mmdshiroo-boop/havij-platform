import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== تابع تبدیل مسیر تصویر ====================
export const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "/placeholder.jpg";

  // اگر آدرس کامل (http یا https) است
  if (imagePath.startsWith("http")) return imagePath;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5001";

  // اگر آدرس با /uploads شروع می‌شود
  if (imagePath.startsWith("/uploads")) {
    return `${baseUrl}${imagePath}`;
  }

  // اگر فقط نام فایل است
  return `${baseUrl}/uploads/ads/${imagePath}`;
};

// تابع دریافت آدرس کامل تصویر
export const getFullImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5001";

  let cleanPath = imagePath;
  if (cleanPath.startsWith("/api")) {
    cleanPath = cleanPath.replace("/api", "");
  }

  if (cleanPath.startsWith("/uploads")) {
    return `${baseUrl}${cleanPath}`;
  }

  return `${baseUrl}/uploads/${cleanPath}`;
};
