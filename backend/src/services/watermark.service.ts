import sharp from "sharp";
import path from "path";
import fs from "fs";
import {
  WatermarkSettings,
  IWatermarkSettings,
} from "../models/WatermarkSettings.model";

// ════════════════════════════════════════════════════════════════════
//  کش تنظیمات — هر ۵ دقیقه بروز می‌شود
// ════════════════════════════════════════════════════════════════════
let cachedSettings: IWatermarkSettings | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // ۵ دقیقه

/**
 * دریافت تنظیمات واترمارک (با کش)
 */
export async function getWatermarkSettings(): Promise<IWatermarkSettings> {
  const now = Date.now();

  if (cachedSettings && now < cacheExpiry) {
    return cachedSettings;
  }

  let settings = await WatermarkSettings.findOne().lean();

  // اولین بار: سند پیش‌فرض بساز
  if (!settings) {
    settings = await WatermarkSettings.create({});
    settings = settings.toObject();
  }

  cachedSettings = settings as IWatermarkSettings;
  cacheExpiry = now + CACHE_TTL;

  return cachedSettings;
}

/**
 * پاکسازی کش تنظیمات (بعد از تغییر)
 */
export function clearWatermarkCache(): void {
  cachedSettings = null;
  cacheExpiry = 0;
}

// ════════════════════════════════════════════════════════════════════
//  تبدیل رنگ hex به RGBA
// ════════════════════════════════════════════════════════════════════

function hexToRgba(hex: string, opacity: number): string {
  const cleaned = hex.replace("#", "");

  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ════════════════════════════════════════════════════════════════════
//  ساخت SVG واترمارک
// ════════════════════════════════════════════════════════════════════

/**
 * ساخت SVG متن واترمارک برای تiled
 */
function buildTiledSvg(
  width: number,
  height: number,
  settings: IWatermarkSettings,
): Buffer {
  const { text, fontSize, color, opacity, tileSize, rotation, fontWeight } =
    settings;
  const fillColor = hexToRgba(color, opacity);

  const diagonal = Math.sqrt(width * width + height * height) * 1.5;
  const cols = Math.ceil(diagonal / tileSize) + 2;
  const rows = Math.ceil(diagonal / tileSize) + 2;

  // محاسبه offset برای شروع از بیرون تصویر
  const offsetX = -diagonal / 2;
  const offsetY = -diagonal / 2;

  let textElements = "";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * tileSize + tileSize / 2;
      const y = offsetY + row * tileSize + tileSize / 2;
      textElements += `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fillColor}" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${escapeXml(text)}</text>\n`;
    }
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${width / 2}, ${height / 2}) rotate(${rotation}) translate(${-width / 2}, ${-height / 2})">
    ${textElements}
  </g>
</svg>`;

  return Buffer.from(svg);
}

/**
 * ساخت SVG واترمارک برای گوشه پایین-چپ
 */
function buildCornerSvg(
  width: number,
  height: number,
  settings: IWatermarkSettings,
): Buffer {
  const { text, fontSize, color, opacity, fontWeight } = settings;
  const fillColor = hexToRgba(color, opacity);
  const padding = 20;
  const cornerFontSize = Math.max(fontSize, 18);

  // بدون چرخش — مستقیم پایین-چپ
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${padding + 60}, ${height - padding})">
    <text font-size="${cornerFontSize}" font-weight="${fontWeight}" fill="${fillColor}" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${escapeXml(text)}</text>
  </g>
</svg>`;

  return Buffer.from(svg);
}

/**
 * ساخت SVG واترمارک برای center
 */
function buildCenterSvg(
  width: number,
  height: number,
  settings: IWatermarkSettings,
): Buffer {
  const { text, fontSize, color, opacity, rotation, fontWeight } = settings;
  const fillColor = hexToRgba(color, opacity);
  const centerFontSize = fontSize * 2.5;

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${width / 2}, ${height / 2}) rotate(${rotation})">
    <text font-size="${centerFontSize}" font-weight="${fontWeight}" fill="${fillColor}" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${escapeXml(text)}</text>
  </g>
</svg>`;

  return Buffer.from(svg);
}

/**
 * فرار کاراکترهای خاص XML
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ════════════════════════════════════════════════════════════════════
//  تابع اصلی: اعمال واترمارک روی فایل
// ════════════════════════════════════════════════════════════════════

export interface ApplyWatermarkResult {
  /** آیا واترمارک اعمال شد */
  applied: boolean;
  /** مسیر فایل نهایی (واترمارک‌شده یا اصلی) */
  filePath: string;
}

/**
 * اعمال واترمارک روی یک فایل تصویری
 *
 * @param filePath - مسیر مطلق فایل تصویر روی سرور
 * @returns نتیجه اعمال واترمارک
 *
 * @example
 * ```ts
 * const result = await applyWatermark("/uploads/ads/photo-123.jpg");
 * // result.applied === true
 * // result.filePath === "/uploads/ads/photo-123.jpg"
 * ```
 */
export async function applyWatermark(
  filePath: string,
): Promise<ApplyWatermarkResult> {
  // ۱. دریافت تنظیمات
  const settings = await getWatermarkSettings();

  // ۲. اگر غیرفعال بود، رد شو
  if (!settings.enabled) {
    return { applied: false, filePath };
  }

  // ۳. خواندن ابعاد تصویر بدون بارگذاری کامل
  const metadata = await sharp(filePath).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // ۴. بررسی حداقل ابعاد
  if (width < settings.minWidth || height < settings.minHeight) {
    return { applied: false, filePath };
  }

  try {
    // ۵. ساخت SVG بر اساس موقعیت
    let svgBuffer: Buffer;
    switch (settings.position) {
      case "corner":
        svgBuffer = buildCornerSvg(width, height, settings);
        break;
      case "center":
        svgBuffer = buildCenterSvg(width, height, settings);
        break;
      case "tiled":
      default:
        svgBuffer = buildTiledSvg(width, height, settings);
        break;
    }

    // ۶. کامپوزیت کردن واترمارک روی تصویر اصلی
    const outputBuffer = await sharp(filePath)
      .composite([
        {
          input: svgBuffer,
          // density: 72 — کیفیت پیش‌فرض مناسب برای وب
        },
      ])
      .jpeg({ quality: 92 }) // حفظ کیفیت بالا
      .toBuffer();

    // ۷. نوشتن دوباره روی همان فایل (overwrites)
    await fs.promises.writeFile(filePath, outputBuffer);

    return { applied: true, filePath };
  } catch (error) {
    console.error("❌ Watermark apply error:", error);
    // در صورت خطا، فایل اصلی بدون تغییر باقی می‌ماند
    return { applied: false, filePath };
  }
}

/**
 * اعمال واترمارک روی چندین فایل
 *
 * @param filePaths - آرایه مسیر فایل‌ها
 * @returns آرایه نتایج
 */
export async function applyWatermarkBatch(
  filePaths: string[],
): Promise<ApplyWatermarkResult[]> {
  const results = await Promise.all(filePaths.map((fp) => applyWatermark(fp)));
  return results;
}

// ════════════════════════════════════════════════════════════════════
//  تابع کمکی: ساخت مسیر کامل فایل
// ════════════════════════════════════════════════════════════════════

/**
 * دریافت مسیر مطلق فایل آپلودی
 *
 * @param filename - نام فایل (مثلاً ads/photo-123.jpg)
 * @returns مسیر مطلق فایل
 */
export function getUploadFilePath(filename: string): string {
  return path.join(process.cwd(), "uploads", filename);
}
