// lib/getImageUrl.ts

/**
 * آدرس کامل تصویر را با توجه به محیط (Development/Production) برمی‌گرداند.
 * @param imagePath مسیر نسبی (/uploads/...) یا مطلق (http://localhost:5001/...) یا هر URL کامل.
 */
export function getImageUrl(imagePath?: string): string {
  // Fallback: اگر مسیر داده نشده، تصویر پیش‌فرض
  if (!imagePath) return "/placeholder.jpg";

  // پایهٔ بک‌اند (بدون /api انتهایی)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  // حذف /api از انتهای آدرس (با احتیاط فقط trailing /api)
  const assetBase = apiBase.replace(/\/api\/?$/, "").replace(/\/+$/, ""); // حذف /api و حذف اسلش‌های اضافی انتهایی

  // اگر آدرس، localhost قدیمی باشد، دامنه را با پایهٔ صحیح جایگزین کن
  if (imagePath.startsWith("http://localhost:5001")) {
    return imagePath.replace("http://localhost:5001", assetBase);
  }

  // اگر مسیر نسبی با /uploads شروع شود، پایه را بچسبان
  if (imagePath.startsWith("/uploads")) {
    return `${assetBase}${imagePath}`;
  }

  // هر آدرس کامل دیگری (http/https) یا مسیر نسبی دیگر را بدون تغییر برگردان
  return imagePath;
}