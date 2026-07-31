/* ═══════════════════════════════════════════════════════════════════════════════
   printAds.ts — تولید PDF و چاپ حرفه‌ای آگهی‌ها (مشاوران املاک)
   نسخه بهبودیافته: رفع مشکل RTL، چیدمان دقیق A4، مدیریت صحیح تصاویر و واترمارک
   ═══════════════════════════════════════════════════════════════════════════════ */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

export interface PrintAd {
  _id: string;
  title: string;
  price: number;
  priceString?: string;
  isPriceNegotiable?: boolean;
  province?: string;
  city: string;
  district?: string;
  neighborhood?: string;
  address?: string;
  fullAddress?: string;
  propertyType?: string;
  adType?: string;
  area?: number;
  buildingArea?: number;
  rooms?: number;
  floor?: number;
  floorCount?: number;
  yearBuilt?: number;
  buildingAge?: number;
  parkingCount?: number;
  unitsPerFloor?: number;
  rentPrice?: number;
  mortgagePrice?: number;
  depositPrice?: number;
  rentalPricePerNight?: number;
  documentType?: string;
  usage?: string;
  landWidth?: number;
  landLength?: number;
  landUsage?: string;
  officeType?: string;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasStorage?: boolean;
  hasBalcony?: boolean;
  hasYard?: boolean;
  hasPool?: boolean;
  hasSauna?: boolean;
  hasFireplace?: boolean;
  hasGym?: boolean;
  hasWifi?: boolean;
  hasKitchen?: boolean;
  hasJacuzzi?: boolean;
  hasTv?: boolean;
  heatingSystem?: string;
  coolingSystem?: string;
  flooring?: string;
  buildingFacade?: string;
  buildingOrientation?: string;
  unitOrientation?: string;
  isUrgent?: boolean;
  isVerified?: boolean;
  status?: string;
  furnishingStatus?: string;
  renovationStatus?: string;
  description?: string;
  images?: string[];
  phone?: string;
  contactName?: string;
  agentName?: string;
  agencyName?: string;
  agencyPhone?: string;
  agencyAddress?: string;
  sellerName?: string;
  views?: number;
  createdAt?: string;
  additionalProperties?: { name: string; value: string }[];
}

export interface PrintOptions {
  agencyName?: string;
  agentName?: string;
  baseUrl?: string;
  watermarkText?: string; // متن واترمارک دلخواه
  onProgress?: (msg: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════
   MAPPER
   ═══════════════════════════════════════════════════════════════════ */

export function mapBackendAdToPrintAd(raw: any): PrintAd {
  if (!raw) return raw;
  const amenities = raw.amenities || {};
  return {
    _id: raw._id,
    title: raw.title || "",
    price: raw.price ?? 0,
    priceString: raw.priceString,
    isPriceNegotiable: raw.isPriceNegotiable,
    province: raw.province,
    city: raw.city || "",
    district: raw.district,
    neighborhood: raw.neighborhood,
    address: raw.address || raw.fullAddress,
    fullAddress: raw.fullAddress,
    propertyType: raw.propertyType,
    adType: raw.adType,
    area: raw.area,
    buildingArea: raw.buildingArea,
    rooms: raw.rooms,
    floor: raw.floor,
    floorCount: raw.floorCount,
    yearBuilt: raw.yearBuilt,
    buildingAge: raw.buildingAge,
    parkingCount: raw.parkingCount,
    unitsPerFloor: raw.unitsPerFloor,
    rentPrice: raw.rentPrice,
    mortgagePrice: raw.mortgagePrice,
    depositPrice: raw.depositPrice,
    rentalPricePerNight: raw.rentalPricePerNight,
    documentType: raw.documentType,
    usage: raw.usage,
    landWidth: raw.landWidth,
    landLength: raw.landLength,
    landUsage: raw.landUsage,
    officeType: raw.officeType,
    hasElevator: !!amenities.elevator,
    hasParking: !!amenities.parking,
    hasStorage: !!amenities.storage,
    hasBalcony: !!amenities.balcony,
    hasYard: !!amenities.yard,
    hasPool: !!amenities.pool,
    hasSauna: !!amenities.sauna,
    hasFireplace: !!amenities.fireplace,
    hasGym: !!amenities.gym,
    hasWifi: !!amenities.wifi,
    hasKitchen: !!amenities.kitchen,
    hasJacuzzi: !!amenities.jacuzzi,
    hasTv: !!amenities.tv,
    heatingSystem: raw.heatingSystem,
    coolingSystem: raw.coolingSystem,
    flooring: raw.flooring,
    buildingFacade: raw.buildingFacade,
    buildingOrientation: raw.buildingOrientation,
    unitOrientation: raw.unitOrientation,
    isUrgent: raw.isUrgent,
    isVerified: raw.isVerified,
    status: raw.status,
    furnishingStatus: raw.furnishingStatus,
    renovationStatus: raw.renovationStatus,
    description: raw.description,
    images: raw.images,
    phone: raw.contactPhone || raw.phone,
    contactName: raw.contactName,
    agentName: raw.agentName || raw.contactName || raw.sellerName,
    agencyName: raw.agencyName,
    agencyPhone: raw.agencyPhone,
    agencyAddress: raw.agencyAddress,
    sellerName: raw.sellerName,
    views: raw.views,
    createdAt: raw.createdAt,
    additionalProperties: raw.additionalProperties,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   LABELS & FORMATTERS
   ═══════════════════════════════════════════════════════════════════ */

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toFa = (num: number | string | undefined | null): string => {
  if (num == null) return "";
  return num.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

const formatPrice = (
  price?: number,
  priceString?: string,
  negotiable?: boolean,
): string => {
  if (negotiable) return "توافقی";
  if (priceString) return priceString;
  if (price) return toFa(price.toLocaleString()) + " تومان";
  return "نامشخص";
};

const PROPERTY_LABELS: Record<string, string> = {
  apartment: "آپارتمان",
  villa: "ویلایی",
  house: "خانه حیاط‌دار",
  land: "زمین",
  suite: "سوئیت",
  office: "دفتر اداری",
  commercial: "مغازه تجاری",
  bare_land: "کلنگی",
  penthouse: "پنت‌هاوس",
  duplex: "دوبلکس",
  garden: "باغ",
  hotel: "مهمان‌پذیر",
};

const AD_TYPE_LABELS: Record<string, string> = {
  sale: "فروش",
  rent: "اجاره",
  daily_rent: "اجاره روزانه",
  exchange: "معاوضه",
  mortgage: "رهن و اجاره",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  personal: "شخصی",
  cooperative: "تعاونی",
  official: "رسمی",
  condominium: "آپارتمانی",
  agricultural: "زراعی",
  garden_doc: "باغی",
  other: "سایر",
};

const HEATING_LABELS: Record<string, string> = {
  shoofazh: "شوفاژ",
  pakage: "پکیج",
  package: "پکیج",
  dastgah_markazi: "دستگاه مرکزی",
  central: "شوفاژ مرکزی",
  heater: "بخاری",
  adeghi: "ادگهی",
  radiator: "رادیاتور",
  fireplace: "شومینه",
  floor_heating: "گرمایش از کف",
  other: "سایر",
};

const COOLING_LABELS: Record<string, string> = {
  kooler_aby: "کولر آبی",
  kooler_gazi: "کولر گازی",
  split: "اسپلیت",
  chiller: "چیلر",
  fancoil: "فن‌کوئل",
  fan_coil: "فن‌کوئل",
  other: "سایر",
};

const FLOORING_LABELS: Record<string, string> = {
  ceramic: "سرامیک",
  parket: "پارکت",
  parquet: "پارکت",
  moquet: "موکت",
  mosaic: "موزاییک",
  sang: "سنگ",
  stone: "سنگ",
  laminet: "لمینت",
  laminate: "لمینت",
  epoxy: "اپوکسی",
  pvc: "پی‌وی‌سی",
  cement: "سیمان",
  other: "سایر",
};

const FACADE_LABELS: Record<string, string> = {
  brick: "آجری",
  stone: "سنگی",
  composite: "کامپوزیت",
  ceramic: "سرامیک",
  wooden: "چوبی",
  cement: "سیمانی",
  modern: "نمای مدرن",
  other: "سایر",
};

const USAGE_LABELS: Record<string, string> = {
  maskani: "مسکونی",
  residential: "مسکونی",
  tejarati: "تجاری",
  commercial: "تجاری",
  edari: "اداری",
  office: "اداری",
  sanati: "صنعتی",
  industrial: "صنعتی",
  amozeshi: "آموزشی",
  behdashti: "بهداشتی",
  vardaneshi: "ورزشی",
  agricultural: "کشاورزی",
  mixed: "مختلط",
  other: "سایر",
};

const FURNISHING_LABELS: Record<string, string> = {
  furnished: "مبله",
  semi_furnished: "نیمه مبله",
  empty: "بدون مبله",
};

const RENOVATION_LABELS: Record<string, string> = {
  fully_renovated: "کاملاً بازسازی شده",
  partially_renovated: "بازسازی جزئی",
  needs_renovation: "نیاز به بازسازی",
};

const OFFICE_LABELS: Record<string, string> = {
  mustaqel: "مستقل",
  tabaghei: "طبقه‌ای",
  majmooe_edari: "مجتمع اداری",
  pasaazh: "پاساژ",
  bazar_sanati: "بازار صنعتی",
  other: "سایر",
};

const LAND_USAGE_LABELS: Record<string, string> = {
  maskani: "مسکونی",
  keshavarzi: "کشاورزی",
  sanati: "صنعتی",
  tejarati: "تجاری",
  bagh: "باغ",
  other: "سایر",
};

const L = (map: Record<string, string>, val: string | undefined): string =>
  val ? map[val] || val : "";

const row = (label: string, value: string): string =>
  value ? `<td class="dl">${label}</td><td class="dv">${value}</td>` : "";

const tag = (text: string): string => `<span class="ft">${text}</span>`;

const formatFloor = (floor?: number | string): string => {
  if (floor === undefined || floor === null) return "نامشخص";
  if (floor === 0 || floor === "0") return "همکف";
  return toFa(floor);
};

/* ═══════════════════════════════════════════════════════════════════
   IMAGE LOADER (Base64 با CORS اجباری)
   ═══════════════════════════════════════════════════════════════════ */

async function loadImagesAsBase64(
  images: string[],
  baseUrl: string,
): Promise<string[]> {
  const resolved = images
    .map((img) => {
      if (!img) return "";
      if (img.startsWith("data:")) return img;
      if (img.startsWith("http")) return img;
      return `${baseUrl}${img.startsWith("/") ? "" : "/"}${img.replace(/^\//, "")}`;
    })
    .filter(Boolean);

  const results = await Promise.allSettled(
    resolved.map(async (url) => {
      try {
        const resp = await fetch(url, { mode: "cors" });
        if (!resp.ok) throw new Error("fetch failed");
        const blob = await resp.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return url; // fallback to original URL
      }
    }),
  );

  return results.map((r) => (r.status === "fulfilled" ? r.value : ""));
}

/* ═══════════════════════════════════════════════════════════════════
   FONT LOADER — بارگذاری اجباری وزیرمتن
   ═══════════════════════════════════════════════════════════════════ */

async function ensureVazirmatnFont() {
  const fontUrl =
    "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css";
  try {
    if (!document.querySelector(`link[href="${fontUrl}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fontUrl;
      document.head.appendChild(link);
    }
    await document.fonts.ready;
    await document.fonts.load("14px Vazirmatn");
  } catch {
    // Fallback
  }
}

/* ═══════════════════════════════════════════════════════════════════
   BASE CSS (طراحی مدرن و کلاسیک با جدول و بوردر + استایل واترمارک)
   ═══════════════════════════════════════════════════════════════════ */

const BASE_CSS = `
  @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');

  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
    color: #1f2937;
    background: #e5e7eb;
    font-size: 11px;
    line-height: 1.8;
    direction: rtl;
    -webkit-font-smoothing: antialiased;
  }

  /* تنظیم دقیق کادر صفحه برای پرینت A4 */
  .page-container {
    width: 794px;
    background: #ffffff;
    margin: 0 auto;
    padding: 30px 40px;
    position: relative;
    overflow: hidden;
  }

  /* استایل واترمارک */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 70px;
    font-weight: 900;
    color: rgba(209, 213, 219, 0.22);
    z-index: 1000;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 4px;
  }

  /* سربرگ کلاسیک و رسمی */
  .print-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 3px double #9ca3af;
  }
  
  .agency-info h1 { font-size: 22px; font-weight: 900; color: #111827; margin-bottom: 4px; }
  .agency-info p { font-size: 11px; color: #4b5563; font-weight: 500; }
  .print-meta { text-align: right; font-size: 10px; color: #6b7280; line-height: 1.8; border-right: 2px solid #e5e7eb; padding-right: 12px; }

  /* استایل جدول‌ها (بوردر دار و منظم) */
  .styled-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    table-layout: fixed;
  }
  .styled-table td {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    font-size: 11px;
    text-align: right;
    vertical-align: middle;
  }
  .styled-table .dl {
    width: 18%;
    background-color: #f3f4f6;
    font-weight: 700;
    color: #4b5563;
  }
  .styled-table .dv {
    width: 32%;
    color: #111827;
    font-weight: 600;
  }

  /* تگ‌ها و امکانات */
  .feature-tag, .ft {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    font-size: 10px;
    font-weight: 700;
    color: #374151;
    background: #f9fafb;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  /* جعبه توضیحات */
  .desc-box {
    border: 1px solid #d1d5db;
    padding: 12px;
    border-radius: 6px;
    background: #fafafa;
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 13px;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 8px;
    display: inline-block;
    border-bottom: 2px solid #ea580c;
    padding-bottom: 4px;
  }

  /* پانویس */
  .print-footer {
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid #d1d5db;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #6b7280;
  }

  .bulk-card, .single-ad { break-inside: avoid; }

  @media print {
    body { background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-container { padding: 0; width: 100%; margin: 0; }
  }
`;

/* ═══════════════════════════════════════════════════════════════════
   SINGLE AD HTML (نمای کامل یک آگهی)
   ═══════════════════════════════════════════════════════════════════ */

function singleAdHTML(ad: PrintAd, imgSrcs: string[]): string {
  const mainImg = imgSrcs[0] || "";
  const galleryImgs = imgSrcs.slice(1, 4);

  const features: string[] = [];
  if (ad.hasElevator) features.push("آسانسور");
  if (ad.hasParking)
    features.push(
      `پارکینگ${ad.parkingCount ? ` (${toFa(ad.parkingCount)})` : ""}`,
    );
  if (ad.hasStorage) features.push("انباری");
  if (ad.hasBalcony) features.push("بالکن");
  if (ad.hasYard) features.push("حیاط / باغچه");
  if (ad.hasPool) features.push("استخر");
  if (ad.hasSauna) features.push("سونا");
  if (ad.hasFireplace) features.push("شومینه");
  if (ad.hasGym) features.push("باشگاه");
  if (ad.hasWifi) features.push("وای‌فای");
  if (ad.hasKitchen) features.push("آشپزخانه");
  if (ad.hasJacuzzi) features.push("جکوزی");

  const tableRows: string[] = [];
  tableRows.push(row("نوع ملک", L(PROPERTY_LABELS, ad.propertyType)));
  tableRows.push(row("نوع معامله", L(AD_TYPE_LABELS, ad.adType)));
  tableRows.push(row("متراژ", ad.area ? `${toFa(ad.area)} متر مربع` : ""));
  if (ad.buildingArea && ad.buildingArea !== ad.area)
    tableRows.push(row("زیربنا", `${toFa(ad.buildingArea)} متر مربع`));
  tableRows.push(row("تعداد اتاق", ad.rooms ? toFa(ad.rooms) : ""));
  tableRows.push(row("طبقه واحد", formatFloor(ad.floor)));
  tableRows.push(row("تعداد طبقات", ad.floorCount ? toFa(ad.floorCount) : ""));
  if (ad.unitsPerFloor)
    tableRows.push(row("واحد در هر طبقه", toFa(ad.unitsPerFloor)));
  tableRows.push(row("سال ساخت", ad.yearBuilt ? toFa(ad.yearBuilt) : ""));
  if (ad.buildingAge)
    tableRows.push(row("سن بنا", `${toFa(ad.buildingAge)} سال`));
  tableRows.push(row("نوع سند", L(DOC_TYPE_LABELS, ad.documentType)));
  tableRows.push(row("کاربری ملک", L(USAGE_LABELS, ad.usage)));
  tableRows.push(row("سیستم گرمایش", L(HEATING_LABELS, ad.heatingSystem)));
  tableRows.push(row("سیستم سرمایش", L(COOLING_LABELS, ad.coolingSystem)));
  tableRows.push(row("کف‌پوش", L(FLOORING_LABELS, ad.flooring)));
  tableRows.push(row("نما", L(FACADE_LABELS, ad.buildingFacade)));
  if (ad.buildingOrientation)
    tableRows.push(row("جهت ساختمان", ad.buildingOrientation));
  if (ad.unitOrientation) tableRows.push(row("جهت واحد", ad.unitOrientation));
  if (ad.furnishingStatus)
    tableRows.push(row("مبله‌سازی", L(FURNISHING_LABELS, ad.furnishingStatus)));
  if (ad.renovationStatus)
    tableRows.push(row("بازسازی", L(RENOVATION_LABELS, ad.renovationStatus)));
  if (ad.rentalPricePerNight)
    tableRows.push(row("اجاره شبانه", formatPrice(ad.rentalPricePerNight)));

  tableRows.push(row("استان", ad.province || ""));
  tableRows.push(row("شهر", ad.city || ""));
  if (ad.district) tableRows.push(row("منطقه", ad.district));
  tableRows.push(row("آدرس", ad.address || ad.fullAddress || ""));

  const validRows = tableRows.filter(Boolean);
  const combinedTableRows: string[] = [];
  for (let i = 0; i < validRows.length; i += 2) {
    const col1 = validRows[i];
    const col2 = validRows[i + 1] || '<td class="dl"></td><td class="dv"></td>';
    combinedTableRows.push(`<tr>${col1}${col2}</tr>`);
  }

  const extraProps = (ad.additionalProperties || []).filter(
    (p) => p.name && p.value,
  );
  const combinedExtraRows: string[] = [];
  const validExtra = extraProps.map((p) => row(p.name, p.value));
  for (let i = 0; i < validExtra.length; i += 2) {
    const col1 = validExtra[i];
    const col2 =
      validExtra[i + 1] || '<td class="dl"></td><td class="dv"></td>';
    combinedExtraRows.push(`<tr>${col1}${col2}</tr>`);
  }

  return `
  <div class="single-ad">
    
    <!-- عنوان و قیمت -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border: 1px solid #d1d5db; padding: 14px; border-radius: 8px; background: #f8fafc;">
      <div style="max-width: 65%;">
        <h2 style="font-size:22px; font-weight:900; color:#111827; margin-bottom:6px; line-height:1.4;">${ad.title}</h2>
        <div style="font-size:12px; color:#4b5563; display: flex; gap: 8px; align-items: center;">
          <span>📍 ${ad.province ? `${ad.province}، ` : ""}${ad.city}${ad.district ? `، ${ad.district}` : ""}</span>
        </div>
      </div>
      <div style="text-align:left; background: #fff; padding: 10px 16px; border-radius: 6px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="font-size:20px; font-weight:900; color:#ea580c;">${formatPrice(ad.price, ad.priceString, ad.isPriceNegotiable)}</div>
        ${ad.rentPrice ? `<div style="font-size:12px; color:#4b5563; margin-top:4px;">اجاره: <span style="font-weight:700;">${formatPrice(ad.rentPrice)}</span></div>` : ""}
        ${ad.mortgagePrice ? `<div style="font-size:12px; color:#4b5563; margin-top:4px;">رهن: <span style="font-weight:700;">${formatPrice(ad.mortgagePrice)}</span></div>` : ""}
        ${ad.depositPrice ? `<div style="font-size:12px; color:#4b5563; margin-top:4px;">ودیعه: <span style="font-weight:700;">${formatPrice(ad.depositPrice)}</span></div>` : ""}
      </div>
    </div>

    <!-- گالری تصاویر -->
    <div style="display:flex; gap:12px; height:240px; margin-bottom:20px;">
      ${
        mainImg
          ? `<div style="flex:3; border-radius:8px; border:1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background-image: url('${mainImg}'); background-size: cover; background-position: center;"></div>`
          : `<div style="flex:3; border-radius:8px; border:1px dashed #cbd5e1; display:flex; align-items:center; justify-content:center; background:#f8fafc; color:#94a3b8;">بدون تصویر</div>`
      }
      ${
        galleryImgs.length > 0
          ? `<div style="flex:1; display:flex; flex-direction:column; gap:10px;">
             ${galleryImgs
               .map(
                 (src) => `
               <div style="flex:1; border-radius:6px; border:1px solid #d1d5db; background-image: url('${src}'); background-size: cover; background-position: center;"></div>
             `,
               )
               .join("")}
            </div>`
          : ""
      }
    </div>

    <!-- جدول مشخصات -->
    ${
      combinedTableRows.length > 0
        ? `<div>
           <div class="section-title">مشخصات کامل ملک</div>
           <table class="styled-table">
             <tbody>${combinedTableRows.join("\n")}</tbody>
           </table>
          </div>`
        : ""
    }

    <!-- امکانات رفاهی -->
    ${
      features.length > 0
        ? `<div style="margin-bottom:18px;">
           <div class="section-title">امکانات رفاهی</div>
           <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;">${features.map(tag).join("")}</div>
          </div>`
        : ""
    }

    <!-- ویژگی‌های اضافی -->
    ${
      combinedExtraRows.length > 0
        ? `<div>
           <div class="section-title">سایر ویژگی‌ها</div>
           <table class="styled-table">
             <tbody>${combinedExtraRows.join("\n")}</tbody>
           </table>
          </div>`
        : ""
    }

    <!-- توضیحات -->
    ${
      ad.description
        ? `<div class="desc-box">
           <div class="section-title" style="margin-bottom:10px;">توضیحات تکمیلی</div>
           <p style="font-size:12px; color:#374151; line-height:2.2; text-align:justify;">${ad.description}</p>
          </div>`
        : ""
    }

  </div>`;
}

/* ═══════════════════════════════════════════════════════════════════
   BULK CARD HTML (کارت فشرده برای پرینت دسته‌ای)
   ═══════════════════════════════════════════════════════════════════ */

function bulkCardHTML(ad: PrintAd, imgSrc: string): string {
  const details: string[] = [];
  if (ad.area) details.push(`${toFa(ad.area)} م²`);
  if (ad.rooms) details.push(`${toFa(ad.rooms)} خوابه`);
  if (ad.floor != null) details.push(`طبقه ${formatFloor(ad.floor)}`);
  if (ad.yearBuilt) details.push(`ساخت ${toFa(ad.yearBuilt)}`);

  return `
    <div class="bulk-card" style="border:1px solid #d1d5db; border-radius:8px; overflow:hidden; background:#fff; display:flex; flex-direction:column;">
      ${
        imgSrc
          ? `<div style="width:100%; height:140px; border-bottom:1px solid #e5e7eb; background-image: url('${imgSrc}'); background-size: cover; background-position: center;"></div>`
          : `<div style="width:100%; height:140px; background:#f8fafc; display:flex; align-items:center; justify-content:center; color:#94a3b8; border-bottom:1px solid #e5e7eb;">بدون تصویر</div>`
      }
      <div style="padding:12px; flex:1;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <h3 style="font-size:13px; font-weight:800; color:#111827; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:60%;">${ad.title}</h3>
          <div style="font-size:13px; font-weight:900; color:#ea580c; white-space:nowrap;">${formatPrice(ad.price, ad.priceString, ad.isPriceNegotiable)}</div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
          ${ad.propertyType ? `<span class="ft">${L(PROPERTY_LABELS, ad.propertyType)}</span>` : ""}
          ${ad.adType ? `<span class="ft">${L(AD_TYPE_LABELS, ad.adType)}</span>` : ""}
        </div>
        <div style="font-size:11px; color:#4b5563; font-weight:600; margin-bottom:6px;">${details.join(" &nbsp;|&nbsp; ")}</div>
        <div style="font-size:10px; color:#6b7280;">📍 ${ad.province ? `${ad.province}، ` : ""}${ad.city}${ad.district ? `، ${ad.district}` : ""}</div>
      </div>
      <div style="display:flex; justify-content:space-between; padding:8px 12px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:10px; color:#6b7280; font-weight:600;">
        <span>کد: ${ad._id ? ad._id.slice(-6).toUpperCase() : "—"}</span>
        ${ad.phone ? `<span>تلفن: <span style="direction:ltr; display:inline-block;">${ad.phone}</span></span>` : ""}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════════
   FULL PAGE BUILDER (شامل بخش واترمارک)
   ═══════════════════════════════════════════════════════════════════ */

function buildFullHTML(
  ads: PrintAd[],
  allImgSrcs: string[][],
  title: string,
  agencyName?: string,
  agentName?: string,
  watermarkText?: string,
): string {
  const today = new Date().toLocaleDateString("fa-IR");
  const now = new Date().toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const isSingle = ads.length === 1;
  const theAd = isSingle ? ads[0] : null;

  const adsHTML = isSingle
    ? singleAdHTML(ads[0], allImgSrcs[0])
    : `<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        ${ads.map((ad, i) => bulkCardHTML(ad, allImgSrcs[i]?.[0] || "")).join("")}
      </div>`;

  // تزریق متن واترمارک در صورت وجود
  const watermarkHTML = watermarkText
    ? `<div class="watermark">${watermarkText}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <div class="page-container">
      ${watermarkHTML}
      <div class="print-header">
        <div class="agency-info">
          <h1>${agencyName || "سیستم جامع املاک"}</h1>
          ${agentName ? `<p>مشاور پیگیری: <span style="font-weight:700; color:#111827;">${agentName}</span></p>` : ""}
        </div>
        <div class="print-meta">
          <div style="margin-bottom:2px;">تاریخ چاپ: <span style="font-weight:700;">${today}</span></div>
          <div style="margin-bottom:2px;">ساعت: <span style="font-weight:700;">${now}</span></div>
          <div>تعداد آگهی: <span style="font-weight:700;">${toFa(ads.length)} مورد</span></div>
        </div>
      </div>

      ${adsHTML}

      <div class="print-footer">
        <div>
          ${isSingle && theAd?.phone ? `تلفن تماس: <span style="font-weight:700; direction:ltr; display:inline-block;">${theAd.phone}</span>` : ""}
          ${isSingle && theAd?._id ? ` | کد آگهی: <span style="font-weight:700; text-transform:uppercase;">${theAd._id.slice(-8)}</span>` : ""}
        </div>
        <div>این سند توسط سیستم اتوماسیون املاک تولید شده و معتبر می‌باشد.</div>
      </div>
  </div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════════════════
   PDF GENERATOR (html2canvas + jsPDF)
   ═══════════════════════════════════════════════════════════════════ */

async function generatePDF(
  html: string,
  filename: string,
  onProgress?: (msg: string) => void,
): Promise<void> {
  onProgress?.("در حال آماده‌سازی قالب...");

  await ensureVazirmatnFont();

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "794px";
  iframe.style.height = "1123px";
  iframe.style.border = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentWindow?.document;
    if (!doc) throw new Error("عدم دسترسی به سند Iframe");

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const elementToPrint = doc.querySelector(".page-container") as HTMLElement;
    if (!elementToPrint) {
      throw new Error("عنصر صفحه (page-container) یافت نشد.");
    }

    iframe.style.height = `${elementToPrint.scrollHeight + 50}px`;

    onProgress?.("در حال تولید فایل PDF...");

    const canvas = await html2canvas(elementToPrint, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794,
      windowWidth: 794,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error(
        "خطا: محتوای تولید شده برای چاپ خالی است یا ارتفاع آن صفر است.",
      );
    }

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;

    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (isNaN(imgHeight) || imgHeight <= 0) {
      throw new Error("خطا در محاسبه ابعاد تصویر PDF.");
    }

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = position - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
    onProgress?.("عملیات موفق! PDF دانلود شد.");
  } catch (error) {
    console.error("PDF Generation Error: ", error);
    alert("خطا در تولید PDF: " + (error as Error).message);
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PRINT WINDOW (مرورگر)
   ═══════════════════════════════════════════════════════════════════ */

function openPrintWindow(html: string) {
  const w = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
  if (!w) {
    alert("لطفاً پاپ‌آپ مرورگر را غیرفعال کنید و دوباره تلاش کنید.");
    return;
  }
  w.document.write(html);
  w.document.close();
}

/* ═══════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════ */

export async function printSingleAd(ad: PrintAd, options?: PrintOptions) {
  const baseUrl = options?.baseUrl || "http://localhost:5001";
  options?.onProgress?.("در حال بارگذاری تصاویر...");

  const imgSrcs = await loadImagesAsBase64(ad.images || [], baseUrl);
  const html = buildFullHTML(
    [ad],
    [imgSrcs],
    `چاپ آگهی: ${ad.title}`,
    options?.agencyName,
    options?.agentName,
    options?.watermarkText,
  );
  await generatePDF(
    html,
    `آگهی-${ad.title.slice(0, 30)}.pdf`,
    options?.onProgress,
  );
}

export async function printBulkAds(ads: PrintAd[], options?: PrintOptions) {
  if (ads.length === 0) return;
  const baseUrl = options?.baseUrl || "http://localhost:5001";

  options?.onProgress?.(`در حال بارگذاری تصاویر ${toFa(ads.length)} آگهی...`);
  const allImgSrcs = await Promise.all(
    ads.map(async (ad) => await loadImagesAsBase64(ad.images || [], baseUrl)),
  );

  const html = buildFullHTML(
    ads,
    allImgSrcs,
    `لیست ${ads.length} آگهی`,
    options?.agencyName,
    options?.agentName,
    options?.watermarkText,
  );
  await generatePDF(html, `لیست-آگهی‌ها.pdf`, options?.onProgress);
}

export async function printSingleAdBrowser(
  ad: PrintAd,
  options?: PrintOptions,
) {
  const baseUrl = options?.baseUrl || "http://localhost:5001";
  const imgSrcs = await loadImagesAsBase64(ad.images || [], baseUrl);
  const html = buildFullHTML(
    [ad],
    [imgSrcs],
    `چاپ آگهی: ${ad.title}`,
    options?.agencyName,
    options?.agentName,
    options?.watermarkText,
  );
  openPrintWindow(html);
}

export async function printBulkAdsBrowser(
  ads: PrintAd[],
  options?: PrintOptions,
) {
  if (ads.length === 0) return;
  const baseUrl = options?.baseUrl || "http://localhost:5001";
  const allImgSrcs = await Promise.all(
    ads.map(async (ad) => await loadImagesAsBase64(ad.images || [], baseUrl)),
  );
  const html = buildFullHTML(
    ads,
    allImgSrcs,
    `لیست ${ads.length} آگهی`,
    options?.agencyName,
    options?.agentName,
    options?.watermarkText,
  );
  openPrintWindow(html);
}
