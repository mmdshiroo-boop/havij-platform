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
// ۰. تنظیمات واترمارک + کش
// ══════════════════════════════════════════════

const adsUploadDir = path.resolve(process.cwd(), "uploads", "ads");
const watermarkPath = path.resolve(process.cwd(), "assets", "watermark.png");

let cachedWatermark: Buffer | null = null;

async function getWatermark(): Promise<Buffer> {
  if (cachedWatermark) return cachedWatermark;
  if (!fs.existsSync(watermarkPath)) {
    throw new Error("فایل واترمارک یافت نشد");
  }
  cachedWatermark = await sharp(watermarkPath)
    .resize(500, null, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
  return cachedWatermark!;
}

// ══════════════════════════════════════════════
// ۰.۱ هم‌زمانی (concurrency pool)
// ══════════════════════════════════════════════

async function asyncPool<T>(
  concurrency: number,
  items: T[],
  iteratorFn: (item: T, index: number) => Promise<any>,
): Promise<any[]> {
  const ret: Promise<any>[] = [];
  const executing: Promise<any>[] = [];
  for (const [i, item] of items.entries()) {
    const p = Promise.resolve().then(() => iteratorFn(item, i));
    ret.push(p);
    if (concurrency <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1)) as any;
      executing.push(e);
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

// ══════════════════════════════════════════════
// ۰.۲ دانلود تصویر (بهینه‌شده)
// ══════════════════════════════════════════════

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 10 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 10 });

function downloadImageBuffer(url: string, attempt = 0): Promise<Buffer> {
  const maxRetries = 2;
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
        agent: url.startsWith("https") ? httpsAgent : httpAgent,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: referer,
          Accept: "image/webp,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
          "Accept-Encoding": "identity",
        },
        timeout: 20000,
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          downloadImageBuffer(res.headers.location, attempt)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (!res.statusCode || res.statusCode !== 200) {
          if (attempt < maxRetries) {
            setTimeout(() => {
              downloadImageBuffer(url, attempt + 1).then(resolve).catch(reject);
            }, 500);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", (err) => {
          if (attempt < maxRetries) {
            setTimeout(() => {
              downloadImageBuffer(url, attempt + 1).then(resolve).catch(reject);
            }, 500);
          } else {
            reject(err);
          }
        });
      },
    );

    req.on("error", (err) => {
      if (attempt < maxRetries) {
        setTimeout(() => {
          downloadImageBuffer(url, attempt + 1).then(resolve).catch(reject);
        }, 500);
      } else {
        reject(err);
      }
    });
    req.on("timeout", () => {
      req.destroy();
      if (attempt < maxRetries) {
        setTimeout(() => {
          downloadImageBuffer(url, attempt + 1).then(resolve).catch(reject);
        }, 500);
      } else {
        reject(new Error("timeout after retries"));
      }
    });
  });
}

// ══════════════════════════════════════════════
// ۰.۳ دانلود + واترمارک + ذخیره (webp, resize)
// ══════════════════════════════════════════════

async function downloadAndWatermarkImage(
  imageUrl: string,
  adIndex: number,
  imgIndex: number,
): Promise<string> {
  try {
    if (imageUrl.includes("/uploads/ads/")) return imageUrl;
    if (!imageUrl || typeof imageUrl !== "string") return imageUrl;

    const imageBuffer = await downloadImageBuffer(imageUrl);
    if (!imageBuffer || imageBuffer.length < 1000) return imageUrl;

    if (!fs.existsSync(adsUploadDir)) {
      fs.mkdirSync(adsUploadDir, { recursive: true });
    }

    const filename = `bulk-${adIndex}-${imgIndex}-${Date.now()}.webp`;
    const filePath = path.join(adsUploadDir, filename);

    const wm = await getWatermark();
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width || 800;

    const wmWidth = Math.min(300, Math.max(100, Math.floor(imgWidth * 0.2)));
    const resizedWm = await sharp(wm)
      .resize(wmWidth, null, { fit: "inside", withoutEnlargement: true })
      .toBuffer();

    await sharp(imageBuffer)
      .resize(1200, null, { fit: "inside", withoutEnlargement: true })
      .composite([{ input: resizedWm, gravity: "southwest" }])
      .webp({ quality: 80 })
      .toFile(filePath);

    const port = process.env.PORT || 5001;
    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    return `${baseUrl}/uploads/ads/${filename}`;
  } catch (err: any) {
    console.error(`❌ خطا در پردازش تصویر: ${err?.message}`);
    return imageUrl;
  }
}

// ══════════════════════════════════════════════
// ۰.۴ پردازش همه تصاویر یک آگهی (۴ تایی هم‌زمان)
// ══════════════════════════════════════════════

async function processAdImages(
  images: string[],
  adIndex: number,
): Promise<string[]> {
  if (!Array.isArray(images) || images.length === 0) return images;
  return asyncPool(4, images, (url, idx) =>
    downloadAndWatermarkImage(url, adIndex, idx),
  );
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
  if (attrPrice && /توافقی|رایگان/i.test(String(attrPrice))) return "negotiable";

  const finalPrice = extractPrice(d, attrs);
  if (finalPrice === 0) return "negotiable";

  return "fixed";
}

function extractPrice(d: any, attrs: Record<string, string>): number {
  if (d.rawJsonLd?.price && typeof d.rawJsonLd.price === 'number' && d.rawJsonLd.price > 0) {
    return d.rawJsonLd.price;
  }
  if (typeof d.price === 'number' && d.price > 0) return d.price;
  if (typeof d.price === 'string' && /^[\d,،٫.\s]+$/.test(d.price.trim())) {
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
// ۲. نگاشت نهایی (با استخراج تصاویر از همه منابع)
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

  // ── استخراج تصاویر از تمام منابع ──
  let images: string[] = [];

  // ۱. آرایه images در سطح data
  if (Array.isArray(d.images) && d.images.length > 0) {
    images = d.images;
  }

  // ۲. دیوار: sections.IMAGE → IMAGE_CAROUSEL → items[].image.url
  if (images.length === 0 && d.rawData?.sections?.IMAGE) {
    const imageSection = d.rawData.sections.IMAGE;
    for (const widget of imageSection) {
      if (widget.widgetType === "IMAGE_CAROUSEL" && widget.dto?.data?.items) {
        for (const item of widget.dto.data.items) {
          if (item.image?.url) {
            images.push(item.image.url);
          }
        }
      }
    }
  }

  // ۳. شیپور قدیمی: rawMeta.image
  if (images.length === 0 && d.rawMeta?.image) {
    images = [d.rawMeta.image];
  }

  // ۴. fallback به فیلد image سطح بالا
  if (images.length === 0 && d.image) {
    images = Array.isArray(d.image) ? d.image : [d.image];
  }

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
// ۳. کنترلر اصلی
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
      }
    }

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

// ══════════════════════════════════════════════
// ۴. پردازش نهایی (۴ آگهی هم‌زمان)
// ══════════════════════════════════════════════

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
    details: [] as any[],
  };

  await asyncPool(4, items, async ({ item, fileName, index }) => {
    const identifier = `${fileName}[${index}]`;
    try {
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

      const adPayload = mapToAdPayload(
        item,
        userId,
        categoryId || "000000000000000000000000",
        expertPhone,
        expertName,
      );

      if (!isAdValid(adPayload)) {
        results.skipped++;
        results.details.push({
          row: identifier,
          index: index + 1,
          message: "آگهی به دلیل نداشتن اطلاعات کافی رد شد.",
        });
        return;
      }

      if (Array.isArray(adPayload.images) && adPayload.images.length > 0) {
        adPayload.images = await processAdImages(adPayload.images, index);
        const watermarkedCount = adPayload.images.filter((img: string) =>
          img.includes("/uploads/ads/bulk-"),
        ).length;
        results.watermarkApplied += watermarkedCount;
      }

      const ad = new Ad(adPayload);
      await ad.save();

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
  });

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

  return results;
}