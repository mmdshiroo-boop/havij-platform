// backend/src/controllers/bulkAd.controller.ts
import { Response } from "express";
import { Ad } from "../models/Ad.model";
import fs from "fs";
import AdmZip from "adm-zip";
import path from "path";
import sharp from "sharp";
import https from "https";
import http from "http";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";
import { sendNotificationToUser } from "../services/notification.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { detectCategory } from "../services/categoryMatcher.service";
import { Category } from "../models";

// ══════════════════════════════════════════════
// ۰. تنظیمات واترمارک
// ══════════════════════════════════════════════

const adsUploadDir = path.resolve(process.cwd(), "uploads", "ads");
const watermarkPath = path.resolve(process.cwd(), "assets", "watermark.png");

/**
 * دانلود تصویر با https/http ماژول (سازگار با همه نسخه‌های Node)
 * هدرهای مرورگر واقعی + Referer صحیح برای عبور از CDN
 */
function downloadImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let referer = url;
    try {
      const parsed = new URL(url);
      referer = parsed.origin;
      if (url.includes("divarcdn.com") || url.includes("divar.ir")) {
        referer = "https://divar.ir";
      } else if (
        url.includes("sheypoor.com") ||
        url.includes("cdn.sheypoor.com")
      ) {
        referer = "https://www.sheypoor.com";
      }
    } catch {}

    const client = url.startsWith("https") ? https : http;

    const req = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: referer,
          Accept:
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
          "Accept-Encoding": "identity",
          "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "Sec-Fetch-Dest": "image",
          "Sec-Fetch-Mode": "no-cors",
          "Sec-Fetch-Site": "cross-site",
        },
        timeout: 15000,
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          downloadImageBuffer(res.headers.location).then(resolve).catch(reject);
          return;
        }

        if (!res.statusCode || res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      },
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

/**
 * دانلود تصویر از URL + اعمال واترمارک + ذخیره محلی
 */
async function downloadAndWatermarkImage(
  imageUrl: string,
  adIndex: number,
  imgIndex: number,
): Promise<string> {
  try {
    if (imageUrl.includes("/uploads/ads/")) return imageUrl;
    if (!imageUrl || typeof imageUrl !== "string") return imageUrl;

    console.log(`⬇️ دانلود تصویر: ${imageUrl.substring(0, 80)}...`);

    const imageBuffer = await downloadImageBuffer(imageUrl);

    if (!imageBuffer || imageBuffer.length < 1000) {
      console.warn(`⚠️ تصویر خیلی کوچک یا خالی: ${imageUrl}`);
      return imageUrl;
    }

    let ext = ".jpg";
    try {
      const parsed = new URL(imageUrl);
      const urlExt = path.extname(parsed.pathname).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(urlExt)) {
        ext = urlExt;
      }
    } catch {}

    if (!fs.existsSync(adsUploadDir)) {
      fs.mkdirSync(adsUploadDir, { recursive: true });
    }

    const filename = `bulk-${adIndex}-${imgIndex}-${Date.now()}${ext}`;
    const filePath = path.join(adsUploadDir, filename);

    if (fs.existsSync(watermarkPath)) {
      const metadata = await sharp(imageBuffer).metadata();
      const imgWidth = metadata.width || 800;
      const wmWidth = Math.min(500, Math.max(150, Math.floor(imgWidth * 0.3)));

      const resizedWm = await sharp(watermarkPath)
        .resize(wmWidth, null, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .toBuffer();

      const finalBuffer = await sharp(imageBuffer)
        .composite([{ input: resizedWm, gravity: "southwest" }])
        .toBuffer();

      fs.writeFileSync(filePath, finalBuffer);
      console.log(
        `✅ واترمارک bulk اعمال شد: ${filename} (اندازه واترمارک: ${wmWidth}px)`,
      );
    } else {
      console.warn("⚠️ فایل واترمارک یافت نشد:", watermarkPath);
      fs.writeFileSync(filePath, imageBuffer);
    }

    // ✅ اصلاح: استفاده از MEDIA_BASE_URL (تنظیم در Railway)
    const baseUrl = process.env.MEDIA_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
    return `${baseUrl}/uploads/ads/${filename}`;
  } catch (err: any) {
    console.error(`❌ خطا در پردازش تصویر: ${err?.message}`);
    return imageUrl;
  }
}

/**
 * پردازش تمام تصاویر یک آگهی — دانلود + واترمارک
 */
async function processAdImages(
  images: string[],
  adIndex: number,
): Promise<string[]> {
  if (!Array.isArray(images) || images.length === 0) return images;

  const processed: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const result = await downloadAndWatermarkImage(images[i], adIndex, i);
    processed.push(result);
  }
  return processed;
}

// ══════════════════════════════════════════════
// ۱. ابزارهای کمکی
// ══════════════════════════════════════════════

function parseNumber(str: any): number {
  if (!str) return 0;
  if (typeof str === "number") return str;
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  let cleaned = str.toString();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replaceAll(persianDigits[i], String(i));
    cleaned = cleaned.replaceAll(arabicDigits[i], String(i));
  }
  cleaned = cleaned.replace(/[^\d]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function parseDivarAttributes(attributes: any[]): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(attributes)) return map;
  attributes.forEach((attr) => {
    if (attr.key && attr.value !== undefined) {
      map[attr.key] = String(attr.value);
    }
  });
  return map;
}

// ══════════════════════════════════════════════
// ۲. استخراج هوشمند قیمت
// ══════════════════════════════════════════════

function extractPriceFromText(text: string): number | null {
  if (!text) return null;
  const cleaned = text
    .replace(/[\u200B-\u200F\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\-\/]/g, ",");

  const patterns = [
    /(?:قیمت\s*(?:کل|نهایی|فروش|رهن)?\s*[:\-–]?\s*)([\d,،٫]+)\s*تومان/i,
    /([\d,،٫]{5,})\s*تومان/i,
    /(?:قیمت\s*)([\d,،٫]+)\s*تومان/i,
  ];
  for (const p of patterns) {
    const m = cleaned.match(p);
    if (m) {
      const num = parseInt(m[1].replace(/[,،٫]/g, ""), 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  const billionMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*میلیارد/i);
  if (billionMatch) {
    const val = parseFloat(billionMatch[1].replace(/,/g, ""));
    if (!isNaN(val)) return Math.round(val * 1_000_000_000);
  }
  const millionMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*میلیون/i);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1].replace(/,/g, ""));
    if (!isNaN(val)) return Math.round(val * 1_000_000);
  }

  return null;
}

function detectPriceType(d: any, attrs: Record<string, string>): string {
  const priceStr = String(d.price ?? "").trim();
  if (/توافقی|negotiable|رایگان|free/i.test(priceStr)) return "negotiable";

  const attrPrice = attrs["قیمت کل"] || attrs["قیمت"] || attrs["ودیعه"];
  if (attrPrice && /توافقی|رایگان/i.test(String(attrPrice)))
    return "negotiable";

  if (parseNumber(d.price) === 0 && !extractPriceFromText(d.description)) {
    return "negotiable";
  }

  return "fixed";
}

function extractPrice(d: any, attrs: Record<string, string>): number {
  if (typeof d.price === "number" && d.price > 0) return d.price;
  if (typeof d.price === "string" && /^[\d,،٫.\s]+$/.test(d.price.trim())) {
    const n = parseNumber(d.price);
    if (n > 0) return n;
  }

  const fromAttrs =
    parseNumber(attrs["قیمت کل"]) ||
    parseNumber(attrs["قیمت"]) ||
    parseNumber(attrs["قیمت نهایی"]) ||
    parseNumber(attrs["ودیعه"]) ||
    parseNumber(attrs["اجارهٔ ماهانه"]) ||
    parseNumber(attrs["اجاره ماهانه"]) ||
    parseNumber(attrs["روزهای عادی (شنبه تا سه‌شنبه)"]) ||
    parseNumber(attrs["روزهای عادی"]) ||
    parseNumber(attrs["آخر هفته"]);
  if (fromAttrs > 0) return fromAttrs;

  const fromDesc = extractPriceFromText(d.description);
  if (fromDesc) return fromDesc;

  const fromTitle = extractPriceFromText(d.title);
  if (fromTitle) return fromTitle;

  return 0;
}

function formatPrice(n: number): string {
  if (!n || n <= 0) return "";
  if (n >= 1_000_000_000)
    return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} میلیارد تومان`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} میلیون تومان`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} هزار تومان`;
  return `${n.toLocaleString("fa-IR")} تومان`;
}

// ══════════════════════════════════════════════
// ۳. اعتبارسنجی
// ══════════════════════════════════════════════

function isAdValid(payload: any): boolean {
  if (
    !payload.title ||
    payload.title === "بدون عنوان" ||
    payload.title.trim().length < 3
  )
    return false;
  const hasDesc =
    payload.description &&
    payload.description !== "توضیحات" &&
    payload.description.trim().length > 10;
  const hasImages = Array.isArray(payload.images) && payload.images.length > 0;
  const hasPrice = payload.price > 0;
  return hasDesc || hasImages || hasPrice;
}

// ══════════════════════════════════════════════
// ۴. نگاشت نهایی
// ══════════════════════════════════════════════

function mapToAdPayload(
  item: any,
  uploaderId: string,
  categoryId: string,
  expertPhone: string,
  expertName: string,
) {
  const d = item.data || item;
  const isDivar = !!d.rawData;
  const isSheypoor = !!d.rawJsonLd;

  let title = (d.title || "").substring(0, 200) || "بدون عنوان";

  let description = d.description || "";
  if (isDivar && description === "توضیحات") {
    try {
      const descWidgets = d.rawData?.sections?.DESCRIPTION;
      if (Array.isArray(descWidgets)) {
        const real = descWidgets
          .filter((w: any) => w.widgetType === "DESCRIPTION_ROW")
          .map((w: any) => w.dto?.data?.text)
          .join("\n")
          .trim();
        if (real) description = real;
      }
    } catch {
      /* ignore */
    }
  }

  let city = d.city || d.location || "نامشخص";
  let province = d.province || "";
  let district = d.district || "";
  let images = Array.isArray(d.images) ? d.images : [];

  let lat: number | undefined;
  let lng: number | undefined;
  if (isSheypoor) {
    const geo = d.rawJsonLd?.itemOffered?.geo;
    if (geo) {
      lat = geo.latitude;
      lng = geo.longitude;
    }
  }
  if (isDivar && d.coordinates) {
    lat = d.coordinates.lat;
    lng = d.coordinates.lng;
  }

  let adType = "sale";
  if (isSheypoor) adType = d.category === "forSale" ? "sale" : "rent";
  if (isDivar && d.category?.includes("اجاره")) {
    adType =
      d.category.includes("روزانه") || d.category.includes("کوتاه‌مدت")
        ? "daily_rent"
        : "rent";
  }

  const attrs = isDivar ? parseDivarAttributes(d.attributes) : {};

  const price = extractPrice(d, attrs);
  const priceType = detectPriceType(d, attrs);

  const deposit = parseNumber(attrs["ودیعه"]);
  const monthlyRent =
    parseNumber(attrs["اجارهٔ ماهانه"]) || parseNumber(attrs["اجاره ماهانه"]);

  if (
    (adType === "rent" || adType === "daily_rent") &&
    (deposit > 0 || monthlyRent > 0)
  ) {
    const priceLine = [];
    if (deposit > 0) priceLine.push(`ودیعه: ${formatPrice(deposit)}`);
    if (monthlyRent > 0)
      priceLine.push(`اجاره ماهانه: ${formatPrice(monthlyRent)}`);
    if (priceLine.length > 0) {
      description = priceLine.join(" | ") + "\n\n" + description;
    }
  }

  let rooms = 0;
  let area = 0;
  let capacity = 0;

  if (isDivar) {
    rooms = parseNumber(attrs["اتاق"]);
    area = parseNumber(attrs["متراژ"] || attrs["متراژ ویلا"]);
    capacity = parseNumber(attrs["ظرفیت استاندارد"] || attrs["ظرفیت"]);
  }
  if (isSheypoor) {
    rooms = parseNumber(d.rooms);
    area = d.area ? parseNumber(d.area) : 0;
  }

  let additionalProperties: any[] = [];
  if (isDivar) {
    additionalProperties = Object.entries(attrs).map(([name, value]) => ({
      name,
      value,
    }));
  }

  const contactPhone = d.phone || expertPhone;
  const sellerName = d.seller || d.consultant || expertName;

  return {
    title,
    description,
    priceType,
    adType,
    category: categoryId,
    price,
    city,
    province,
    district,
    images,
    source: isSheypoor ? "sheypoor" : isDivar ? "divar" : "manual",
    sourceUrl: item.url || d.url || "",
    sourceId: d.token || d.id || `bulk_${Date.now()}`,
    contactPhone,
    contactName: sellerName,
    sellerName,
    rooms,
    area,
    capacity,
    latitude: lat,
    longitude: lng,
    additionalProperties,
    rawData: d,
    status: "active",
    isUrgent: false,
    userId: uploaderId,
    uploadedBy: uploaderId,
    expiresAt: (() => {
      const exp = new Date();
      exp.setDate(exp.getDate() + 30);
      return exp;
    })(),
  };
}

// ══════════════════════════════════════════════
// ۵. کنترلر اصلی (اصلاح‌شده با پاسخ نهایی و مدیریت خطاهای JSON)
// ══════════════════════════════════════════════
export const uploadBulkAds = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    const files = (req as any).files;
    if (!files || !files.zipFile) {
      return res
        .status(400)
        .json({ success: false, message: "فایل ZIP الزامی است" });
    }

    const zipFile = files.zipFile as any;
    if (!zipFile.name.endsWith(".zip")) {
      return res
        .status(400)
        .json({ success: false, message: "فقط فایل‌های ZIP مجاز هستند" });
    }

    const tempDir = path.resolve(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `bulk-${Date.now()}.zip`);
    await zipFile.mv(tempPath);

    const zip = new AdmZip(tempPath);
    const entries = zip.getEntries();
    const jsonFiles = entries.filter(
      (e) => !e.isDirectory && e.entryName.endsWith(".json"),
    );

    if (jsonFiles.length === 0) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
      return res
        .status(400)
        .json({ success: false, message: "هیچ فایل JSON در ZIP یافت نشد" });
    }

    // استخراج همه آیتم‌ها با مدیریت خطاهای JSON
    const allItems: { item: any; fileName: string; index: number }[] = [];
    for (const entry of jsonFiles) {
      try {
        const content = entry.getData().toString("utf8");
        const parsed = JSON.parse(content);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        items.forEach((item, idx) => {
          allItems.push({ item, fileName: entry.entryName, index: idx });
        });
      } catch (parseErr: any) {
        console.error(
          `❌ خطا در تجزیه فایل ${entry.entryName}:`,
          parseErr.message,
        );
        // فایل مشکل‌دار نادیده گرفته می‌شود
      }
    }

    // حذف فایل موقت
    try {
      fs.unlinkSync(tempPath);
    } catch {}

    if (allItems.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "هیچ فایل JSON معتبری در ZIP یافت نشد",
        });
    }

    const expertPhone = req.user.phone || "09120000000";
    const expertName =
      `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
      req.user.phone;

    // پردازش کامل و دریافت نتایج
    const results = await processAndSaveAds(
      allItems,
      userId.toString(),
      expertPhone,
      expertName,
      req,
    );

    return res.status(201).json({
      success: true,
      message: `تزریق فله‌ای انجام شد: ${results.success} موفق، ${results.watermarkApplied} واترمارک، ${results.skipped} رد شده، ${results.errors} خطا`,
      data: results,
    });
  } catch (error: any) {
    console.error("❌ Bulk upload error:", error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "خطا در تزریق فله‌ای آگهی‌ها" });
    }
  }
};

/**
 * پردازش نهایی آگهی‌ها (واترمارک + ذخیره) – نتایج را برمی‌گرداند
 */
async function processAndSaveAds(
  items: { item: any; fileName: string; index: number }[],
  userId: string,
  expertPhone: string,
  expertName: string,
  req: AuthRequest,
) {
  const results = {
    success: 0,
    errors: 0,
    skipped: 0,
    watermarkApplied: 0,
    details: [] as Array<{
      file?: string;
      row?: string;
      index?: number;
      message: string;
    }>,
  };

  for (const { item, fileName, index } of items) {
    const identifier = `${fileName}[${index}]`;
    try {
      // ۱. تشخیص دسته‌بندی
      let categoryId: string | undefined;
      try {
        const detected = await detectCategory(item);
        if (detected) categoryId = detected;
      } catch (detectErr) {
        console.warn("⚠️ detectCategory failed:", detectErr);
      }
      if (!categoryId) {
        const fallbackCategory = await Category.findOne({
          slug: "real-estate",
        });
        if (fallbackCategory) categoryId = fallbackCategory._id.toString();
      }

      // ۲. ساخت payload
      const adPayload = mapToAdPayload(
        item,
        userId,
        categoryId || "000000000000000000000000",
        expertPhone,
        expertName,
      );

      // ۳. اعتبارسنجی
      if (!isAdValid(adPayload)) {
        results.skipped++;
        results.details.push({
          row: identifier,
          index: index + 1,
          message: "آگهی به دلیل نداشتن اطلاعات کافی رد شد.",
        });
        continue;
      }

      // ۴. واترمارک تصاویر
      if (Array.isArray(adPayload.images) && adPayload.images.length > 0) {
        console.log(
          `🖼️ پردازش ${adPayload.images.length} تصویر برای: ${adPayload.title.substring(0, 40)}`,
        );
        adPayload.images = await processAdImages(adPayload.images, index);
        const watermarkedCount = adPayload.images.filter((img: string) =>
          img.includes("/uploads/ads/bulk-"),
        ).length;
        if (watermarkedCount > 0) {
          results.watermarkApplied += watermarkedCount;
        }
      }

      // ۵. ذخیره آگهی
      const ad = new Ad(adPayload);
      await ad.save();

      // ۶. لاگ
      await createAuditLog({
        userId,
        action: AuditAction.AD_CREATED,
        resource: "Ad",
        resourceId: ad._id.toString(),
        description: `کارشناس ${expertName} آگهی فله‌ای «${ad.title}» را ایجاد کرد.`,
        metadata: { source: adPayload.source, originalId: adPayload.sourceId },
        req,
      });

      results.success++;
    } catch (itemErr: any) {
      results.errors++;
      results.details.push({
        row: identifier,
        index: index + 1,
        message: itemErr.message,
      });
    }
  }

  // ۷. ارسال نوتیفیکیشن نهایی به کارشناس
  if (results.success > 0) {
    await sendNotificationToUser(
      userId,
      "تزریق فله‌ای انجام شد",
      `${results.success} آگهی ایجاد و فعال شد.${results.watermarkApplied > 0 ? ` (${results.watermarkApplied} تصویر واترمارک شد)` : ""}${results.errors ? ` (${results.errors} خطا)` : ""}${results.skipped ? ` (${results.skipped} رد شده)` : ""}`,
      "info",
      "/panel/expert/bulk-upload",
      {
        success: results.success,
        errors: results.errors,
        skipped: results.skipped,
        watermarkApplied: results.watermarkApplied,
      },
    );
  }

  console.log(
    `🏁 پردازش فله‌ای به پایان رسید: ${results.success} موفق، ${results.watermarkApplied} واترمارک، ${results.skipped} رد شده، ${results.errors} خطا`,
  );

  return results; // ← نتیجه را برمی‌گردانیم
}