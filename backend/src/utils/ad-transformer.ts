// backend/src/utils/ad-transformer.ts
import { Types } from "mongoose";

// نوع ورودی JSON شیپور
interface SheypoorJson {
  success: boolean;
  id: string;
  url: string;
  filename: string;
  extractedAt: string;
  data: {
    title: string;
    price: string;
    location: string;
    description: string;
    images: string[];
    seller: string;
    category: string;
    area: number | null;
    rooms: number | null;
    phone: string | null;
    rawJsonLd: any;
    rawMeta: any;
  };
}

// نوع خروجی برای مدل Ad
export interface TransformedAd {
  title: string;
  slug: string; // ✅ اضافه شد
  description: string;
  price: number;
  priceString: string;
  isPriceNegotiable: boolean;
  categoryName: string;
  province: string;
  city: string;
  district: string;
  neighborhood: string;
  fullAddress: string;
  area: number | null;
  rooms: number | null;
  images: string[];
  sellerName: string;
  agencyName: string;
  source: "sheypoor";
  sourceId: string;
  sourceUrl: string;
  rawData: any;
  contactPhone: string;
  contactName: string;
  latitude?: number;
  longitude?: number;
  landLength?: number;
  landWidth?: number;
  documentType?: string;
  buildingArea?: number;
}

/**
 * تولید slug یکتا از title
 */
function generateUniqueSlug(title: string): string {
  const baseSlug = (title || "ad")
    .replace(/[^\w\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .substring(0, 60);
  const uniquePart = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return `${baseSlug}-${uniquePart}`;
}

/**
 * تبدیل قیمت از فرمت متنی به عددی
 * مثال: "15,000,000,000 تومان" => 15000000000
 * مثال: "توافقی" => 0
 */
function parsePrice(priceString: string): {
  price: number;
  isNegotiable: boolean;
} {
  if (!priceString) return { price: 0, isNegotiable: true };

  // بررسی توافقی بودن
  if (priceString.includes("توافقی")) {
    return { price: 0, isNegotiable: true };
  }

  // حذف کلمه "تومان" و فاصله‌ها
  let cleaned = priceString.replace("تومان", "").trim();

  // حذف کاماهای جداکننده اعداد
  cleaned = cleaned.replace(/,/g, "");

  // استخراج اعداد
  const numbers = cleaned.match(/\d+/g);
  if (!numbers) return { price: 0, isNegotiable: true };

  const price = parseInt(numbers.join(""), 10);
  return { price: isNaN(price) ? 0 : price, isNegotiable: false };
}

/**
 * تفکیک آدرس به استان، شهر، منطقه
 * مثال: "مازندران ساری کلیجان رستاق" => { province: "مازندران", city: "ساری", district: "کلیجان رستاق" }
 */
function parseLocation(location: string): {
  province: string;
  city: string;
  district: string;
  neighborhood: string;
} {
  if (!location) {
    return { province: "", city: "", district: "", neighborhood: "" };
  }

  const parts = location.trim().split(/\s+/);

  let province = "";
  let city = "";
  let district = "";
  let neighborhood = "";

  // استان‌های ایران
  const provinces = [
    "آذربایجان شرقی",
    "آذربایجان غربی",
    "اردبیل",
    "اصفهان",
    "البرز",
    "ایلام",
    "بوشهر",
    "تهران",
    "چهارمحال و بختیاری",
    "خراسان جنوبی",
    "خراسان رضوی",
    "خراسان شمالی",
    "خوزستان",
    "زنجان",
    "سمنان",
    "سیستان و بلوچستان",
    "فارس",
    "قزوین",
    "قم",
    "کردستان",
    "کرمان",
    "کرمانشاه",
    "کهگیلویه و بویراحمد",
    "گلستان",
    "گیلان",
    "لرستان",
    "مازندران",
    "مرکزی",
    "هرمزگان",
    "همدان",
    "یزد",
  ];

  // پیدا کردن استان
  for (const prov of provinces) {
    if (location.includes(prov)) {
      province = prov;
      break;
    }
  }

  // اگر استان پیدا شد، بقیه را پردازش کن
  if (province) {
    const afterProvince = location
      .substring(location.indexOf(province) + province.length)
      .trim();
    const cityParts = afterProvince.split(/\s+/);
    if (cityParts.length > 0) {
      city = cityParts[0];
      if (cityParts.length > 1) {
        district = cityParts.slice(1).join(" ");
      }
    }
  } else {
    // اگر استان پیدا نشد، کل آدرس را به عنوان آدرس کامل در نظر بگیر
    city = location;
  }

  return { province, city, district, neighborhood };
}

/**
 * استخراج طول و عرض بر از توضیحات
 */
function extractLandDimensions(description: string): {
  length?: number;
  width?: number;
} {
  if (!description) return {};

  let length: number | undefined;
  let width: number | undefined;

  // الگوی "طول بر: 14"
  const lengthMatch = description.match(/طول بر[:]?\s*(\d+)/i);
  if (lengthMatch) {
    length = parseInt(lengthMatch[1], 10);
  }

  // الگوی "عرض از گذر: 10"
  const widthMatch = description.match(/عرض از گذر[:]?\s*(\d+)/i);
  if (widthMatch) {
    width = parseInt(widthMatch[1], 10);
  }

  return { length, width };
}

/**
 * استخراج نوع سند از توضیحات
 */
function extractDocumentType(description: string): string | undefined {
  if (!description) return undefined;

  const match = description.match(/نوع سند[:]?\s*([^\n]+)/i);
  return match ? match[1].trim() : undefined;
}

/**
 * استخراج متراژ بنا از توضیحات (برای مرغداری، ساختمان و...)
 */
function extractBuildingArea(description: string): number | undefined {
  if (!description) return undefined;

  // الگوی "1800متربنا" یا "1800 متر بنا"
  const match = description.match(/(\d+)\s*متر\s*بنا/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  // الگوی "متراژ بنا: 1800"
  const match2 = description.match(/متراژ بنا[:]?\s*(\d+)/i);
  if (match2) {
    return parseInt(match2[1], 10);
  }

  return undefined;
}

/**
 * استخراج نام آژانس از رشته seller
 * مثال: "مشاور این آگهی املاک آرتیمانعضو شیپور از شهریور ۱۳۹۹۱۸ آگهی"
 */
function extractAgencyName(seller: string): string {
  if (!seller) return "";

  // حذف "مشاور این آگهی"
  let cleaned = seller.replace("مشاور این آگهی", "").trim();

  // حذف "عضو شیپور از ..."
  const memberIndex = cleaned.indexOf("عضو شیپور");
  if (memberIndex !== -1) {
    cleaned = cleaned.substring(0, memberIndex).trim();
  }

  // حذف اعداد و کلمات اضافه آخر
  cleaned = cleaned.replace(/\d+ آگهی$/, "").trim();

  return cleaned;
}

/**
 * استخراج نام فروشنده از رشته seller
 */
function extractSellerName(seller: string): string {
  if (!seller) return "";

  // حذف "مشاور این آگهی"
  let name = seller.replace("مشاور این آگهی", "").trim();

  // گرفتن بخش قبل از "عضو شیپور"
  const memberIndex = name.indexOf("عضو شیپور");
  if (memberIndex !== -1) {
    name = name.substring(0, memberIndex).trim();
  }

  return name;
}

/**
 * استخراج شماره تماس از توضیحات
 */
function extractPhoneFromDescription(description: string): string {
  if (!description) return "";
  const phoneMatch = description.match(/0\d{10}/);
  return phoneMatch ? phoneMatch[0] : "";
}

/**
 * تابع اصلی: تبدیل JSON شیپور به فرمت مدل Ad
 */
export function transformSheypoorToAd(
  sheypoorJson: SheypoorJson,
): TransformedAd {
  const { data, id, url } = sheypoorJson;
  const { price: priceNumber, isNegotiable } = parsePrice(data.price);

  const locationInfo = parseLocation(data.location);
  const landDims = extractLandDimensions(data.description);
  const documentType = extractDocumentType(data.description);
  const buildingArea = extractBuildingArea(data.description);

  // تولید slug یکتا
  const slug = generateUniqueSlug(data.title);

  // استخراج مختصات از rawJsonLd اگر وجود داشته باشد
  let latitude: number | undefined;
  let longitude: number | undefined;
  if (data.rawJsonLd?.geo) {
    latitude = data.rawJsonLd.geo.latitude;
    longitude = data.rawJsonLd.geo.longitude;
  }

  // شماره تماس: اول از data.phone، اگر نبود از description استخراج کنیم
  let contactPhone = data.phone || "";
  if (!contactPhone && data.description) {
    contactPhone = extractPhoneFromDescription(data.description);
  }

  return {
    title: data.title,
    slug: slug, // ✅ اضافه شد
    description: data.description,
    price: priceNumber,
    priceString: data.price,
    isPriceNegotiable: isNegotiable,
    categoryName: data.category || "متفرقه",
    province: locationInfo.province,
    city: locationInfo.city || "نامشخص",
    district: locationInfo.district,
    neighborhood: locationInfo.neighborhood,
    fullAddress: data.location || "",
    area: data.area || null,
    rooms: data.rooms || null,
    images: data.images || [],
    sellerName: extractSellerName(data.seller),
    agencyName: extractAgencyName(data.seller),
    source: "sheypoor",
    sourceId: id,
    sourceUrl: url,
    rawData: sheypoorJson,
    contactPhone: contactPhone || "نامشخص",
    contactName: extractSellerName(data.seller),
    latitude,
    longitude,
    landLength: landDims.length,
    landWidth: landDims.width,
    documentType,
    buildingArea,
  };
}

/**
 * تبدیل دسته‌جمعی چند JSON
 */
export function transformMultipleSheypoorToAd(
  jsons: SheypoorJson[],
): TransformedAd[] {
  return jsons.map((json) => transformSheypoorToAd(json));
}
