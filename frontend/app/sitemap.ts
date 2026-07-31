// ============================================
// sitemap.ts
// نقشه سایت (Sitemap) پلتفرم املاک ایران
// تولید پویای sitemap.xml برای Next.js App Router
// ============================================

import type { MetadataRoute } from "next";

// --------------------------------------------
// ثابت‌ها و تنظیمات
// --------------------------------------------

/** آدرس پایه سایت از متغیر محیطی */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

/** آدرس API داخلی برای دریافت آگهی‌ها */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

// --------------------------------------------
// صفحات استاتیک سایت
// --------------------------------------------

/** لیست صفحات ثابت با اولویت و فرکانس تغییر */
const staticPages: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/search`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/auth/login`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/auth/register`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

// --------------------------------------------
// دسته‌بندی‌های اصلی املاک در ایران
// --------------------------------------------

/** دسته‌بندی‌های رایج املاک با نام فارسی و slug انگلیسی */
const categories: { name: string; slug: string }[] = [
  { name: "آپارتمان", slug: "apartment" },
  { name: "خانه ویلایی", slug: "villa" },
  { name: "زمین", slug: "land" },
  { name: "تجاری", slug: "commercial" },
  { name: "اداری", slug: "office" },
  { name: "صنتی و کارگاهی", slug: "industrial" },
  { name: "باغ و باغچه", slug: "garden" },
  { name: "مستغلات", slug: "apartment-building" },
  { name: "پروژه‌های نوسازی", slug: "renovation" },
  { name: "پیش‌فروش", slug: "presale" },
  { name: "اجاره", slug: "rent" },
  { name: "رهن و اجاره", slug: "mortgage-rent" },
];

// --------------------------------------------
// شهرهای اصلی ایران
// --------------------------------------------

/** شهرهای بزرگ ایران برای تولید صفحات شهری */
const cities: { name: string; slug: string }[] = [
  { name: "تهران", slug: "tehran" },
  { name: "اصفهان", slug: "isfahan" },
  { name: "شیراز", slug: "shiraz" },
  { name: "تبریز", slug: "tabriz" },
  { name: "مشهد", slug: "mashhad" },
  { name: "اهواز", slug: "ahvaz" },
  { name: "کرج", slug: "karaj" },
  { name: "قم", slug: "qom" },
  { name: "کرمانشاه", slug: "kermanshah" },
  { name: "ارومیه", slug: "urmia" },
  { name: "رشت", slug: "rasht" },
  { name: "زاهدان", slug: "zahedan" },
  { name: "همدان", slug: "hamedan" },
  { name: "کرمان", slug: "kerman" },
  { name: "یزد", slug: "yazd" },
  { name: "اردبیل", slug: "ardabil" },
  { name: "بندرعباس", slug: "bandar-abbas" },
  { name: "اراک", slug: "arak" },
  { name: "قم", slug: "qom" },
  { name: "زنجان", slug: "zanjan" },
  { name: "ساری", slug: "sari" },
  { name: "گرگان", slug: "gorgan" },
  { name: "قمشه", slug: "qazvin" },
  { name: "قزوین", slug: "qazvin" },
  { name: "سنندج", slug: "sanandaj" },
  { name: "بجنورد", slug: "bojnourd" },
  { name: "بوشهر", slug: "bushehr" },
  { name: "بیرجند", slug: "birjand" },
  { name: "ایلام", slug: "ilam" },
  { name: "شهرکرد", slug: "shahrekord" },
  { name: "خرم‌آباد", slug: "khorramabad" },
  { name: "یاسوج", slug: "yasuj" },
];

// --------------------------------------------
// توابع کمکی
// --------------------------------------------

/**
 * دریافت آگهی‌های منتشرشده از API
 * شامل اطلاعات لازم برای sitemap: slug, updatedAt, createdAt
 *
 * @returns آرایه آگهی‌های منتشرشده
 */
async function fetchPublishedAds(): Promise<
  Array<{
    slug: string;
    updatedAt: string;
    createdAt: string;
  }>
> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // ۵ ثانیه

    const response = await fetch(
      `${API_URL}/ads?status=published&fields=slug,updatedAt,createdAt&limit=50000`,
      {
        next: { revalidate: 3600 },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[Sitemap] خطا در دریافت آگهی‌ها: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data = await response.json();
    const ads = Array.isArray(data)
      ? data
      : data.data || data.ads || data.results || [];
    return ads;
  } catch (error) {
    // در صورت timeout یا قطعی شبکه، هشدار می‌دهیم نه خطا
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(
        "[Sitemap] درخواست دریافت آگهی‌ها به دلیل timeout متوقف شد. sitemap بدون آگهی تولید می‌شود.",
      );
    } else {
      console.warn(
        "[Sitemap] خطا در اتصال به API (احتمالاً سرور خاموش است). sitemap بدون آگهی تولید می‌شود.",
      );
    }
    return [];
  }
}
/**
 * ساخت آیتم‌های sitemap برای آگهی‌های پویا
 *
 * @param ads - لیست آگهی‌ها
 * @returns آرایه آیتم‌های sitemap
 */
function buildAdEntries(
  ads: Array<{ slug: string; updatedAt: string; createdAt: string }>,
): MetadataRoute.Sitemap {
  return ads.map((ad) => ({
    url: `${BASE_URL}/ads/${ad.slug}`,
    // اولویت‌بندی: updatedAt اگر وجود داشت، در غیر این صورت createdAt
    lastModified: ad.updatedAt
      ? new Date(ad.updatedAt)
      : new Date(ad.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}

/**
 * ساخت آیتم‌های sitemap برای صفحات دسته‌بندی
 *
 * @returns آرایه آیتم‌های sitemap دسته‌بندی‌ها
 */
function buildCategoryEntries(): MetadataRoute.Sitemap {
  return categories.map((category) => ({
    url: `${BASE_URL}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
}

/**
 * ساخت آیتم‌های sitemap برای صفحات شهرها
 *
 * @returns آرایه آیتم‌های sitemap شهرها
 */
function buildCityEntries(): MetadataRoute.Sitemap {
  return cities.map((city) => ({
    url: `${BASE_URL}/city/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
}

/**
 * ساخت آیتم‌های sitemap برای ترکیب دسته‌بندی × شهر
 * این صفحات برای سئوی بلندمدت (Long-tail SEO) بسیار مفید هستند
 *
 * @returns آرایه آیتم‌های sitemap ترکیبی
 */
function buildCategoryCityEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const category of categories) {
    for (const city of cities) {
      entries.push({
        url: `${BASE_URL}/category/${category.slug}/city/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }
  }

  return entries;
}

// ============================================
// تابع اصلی تولید Sitemap
// ============================================

/**
 * تولید نقشه سایت پویا
 *
 * شامل:
 * ۱. صفحات استاتیک (خانه، جستجو، درباره ما، تماس و ...)
 * ۲. صفحات آگهی‌ها (داینامیک - از API خوانده می‌شود)
 * ۳. صفحات دسته‌بندی‌ها
 * ۴. صفحات شهرها
 * ۵. صفحات ترکیب دسته‌بندی × شهر
 *
 * @returns آرایه کامل آیتم‌های sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ۱. دریافت آگهی‌های منتشرشده از API
  const publishedAds = await fetchPublishedAds();

  // ۲. ساخت آیتم‌های هر بخش
  const adEntries = buildAdEntries(publishedAds);
  const categoryEntries = buildCategoryEntries();
  const cityEntries = buildCityEntries();
  const categoryCityEntries = buildCategoryCityEntries();

  // ۳. ادغام همه بخش‌ها
  const allEntries: MetadataRoute.Sitemap = [
    ...staticPages,
    ...categoryEntries,
    ...cityEntries,
    ...categoryCityEntries,
    ...adEntries,
  ];

  // لاگ آماری برای بررسی
  console.log(`[Sitemap] تولید ${allEntries.length} آیتم:`, {
    staticPages: staticPages.length,
    categories: categoryEntries.length,
    cities: cityEntries.length,
    categoryCity: categoryCityEntries.length,
    ads: adEntries.length,
  });

  return allEntries;
}
