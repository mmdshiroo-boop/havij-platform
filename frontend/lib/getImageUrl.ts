// lib/getImageUrl.ts
export function getImageUrl(imagePath?: string): string {
  if (!imagePath) return "/placeholder.jpg";

  // اگر آدرس از قبل کامل و با http شروع می‌شود، بررسی می‌کنیم
  if (imagePath.startsWith("http://localhost:5001")) {
    // آدرس واقعی بک‌اند را از متغیر محیطی می‌گیریم (بدون /api)
    const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001";
    return imagePath.replace("http://localhost:5001", backendBase);
  }

  // اگر مسیر نسبی بود (مثلاً /uploads/...) دامنه بک‌اند را اضافه می‌کنیم
  if (imagePath.startsWith("/uploads")) {
    const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001";
    return backendBase + imagePath;
  }

  // در غیر این صورت همان مسیر را برگردان (مثلاً آدرس خارجی یا placeholder)
  return imagePath;
}