// backend/src/utils/watermarkUpload.ts
// ════════════════════════════════════════════════════════════════════
//  تابع کمکی: ادغام واترمارک در هر کنترلر آپلود تصویر
//  این تابع را بعد از ذخیره فایل فراخوانی کنید.
// ════════════════════════════════════════════════════════════════════
import path from "path";
import {
  applyWatermark,
  getWatermarkSettings,
} from "../services/watermark.service";

/**
 * اعمال واترمارک روی یک فایل آپلودی — نسخه ساده برای ادغام
 *
 * @param filename - نام فایل ذخیره‌شده (مثلاً ads/123-photo.jpg)
 * @returns Promise<boolean> — آیا واترمارک اعمال شد
 *
 * @example
 * ```ts
 * // داخل تابع uploadImage بعد از mv():
 * const fullPath = path.join(process.cwd(), "uploads", filename);
 * await watermarkUploadedFile(fullPath);
 * ```
 */
export async function watermarkUploadedFile(
  fullPath: string,
): Promise<boolean> {
  try {
    const settings = await getWatermarkSettings();
    if (!settings.enabled) return false;

    const result = await applyWatermark(fullPath);
    return result.applied;
  } catch (error) {
    console.error("⚠️ Watermark upload integration error:", error);
    return false;
  }
}

/**
 * اعمال واترمارک روی لیست فایل‌ها
 *
 * @param filenames - آرایه مسیر کامل فایل‌ها
 * @returns تعداد فایل‌هایی که واترمارک شدند
 */
export async function watermarkUploadedFiles(
  fullPaths: string[],
): Promise<number> {
  let count = 0;
  for (const fp of fullPaths) {
    const applied = await watermarkUploadedFile(fp);
    if (applied) count++;
  }
  return count;
}
