// ============================================
// seo.utils.ts
// ابزارهای بهینه‌سازی موتورهای جستجو (SEO) برای پلتفرم املاک ایران
// ============================================

// جایگزین Metadata:
interface SeoMetadata {
  title?: string;
  description?: string;
  openGraph?: Record<string, unknown>;
  twitter?: Record<string, unknown>;
  alternates?: Record<string, string>;
  robots?: Record<string, unknown>;
  other?: Record<string, string>;
}
// --------------------------------------------
// انواع و اینترفیس‌ها
// --------------------------------------------

/** اطلاعات یک آگهی ملکی */
export interface AdSeoData {
  title: string;
  slug: string;
  description: string;
  city: string;
  district: string;
  price?: number | null;
  priceUnit?: string;
  images?: string[];
  status: "draft" | "pending" | "published" | "rejected" | "sold";
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  numberOfRooms?: number;
  floorSize?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
}

/** اطلاعات یک دسته‌بندی */
export interface CategorySeoData {
  name: string;
  slug: string;
  description?: string;
}

/** گزینه‌های متادیتای صفحات استاتیک */
export interface StaticMetadataOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "profile";
}

/** آیتم‌های مسیر نان‌خای (BreadCrumb) */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

// --------------------------------------------
// ثابت‌ها و تنظیمات پایه
// --------------------------------------------

/** آدرس پایه سایت - از متغیر محیطی خوانده می‌شود */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

/** نام رسمی سایت */
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "نام سایت";

/** طول حداکثر توضیحات متا */
const META_DESCRIPTION_MAX_LENGTH = 150;

/** طول حداکثر عنوان متا */
const META_TITLE_MAX_LENGTH = 70;

// --------------------------------------------
// توابع کمکی
// --------------------------------------------

/**
 * حذف تگ‌های HTML و فاصله‌های اضافی از متن
 * @param text - متن ورودی
 * @returns متن پاک‌سازی‌شده
 */
function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * قالب‌بندی قیمت به فارسی
 * @param price - قیمت عددی
 * @param unit - واحد قیمت (مثلاً تومان، میلیارد تومان)
 * @returns رشته قیمت قالب‌بندی‌شده
 */
function formatPriceForSeo(
  price: number | null | undefined,
  unit?: string,
): string {
  if (!price) return "تماس بگیرید";

  const formatted = new Intl.NumberFormat("fa-IR").format(price);
  const priceUnit = unit || "تومان";

  return `${formatted} ${priceUnit}`;
}

/**
 * محدود کردن طول متن
 * @param text - متن ورودی
 * @param maxLength - حداکثر طول
 * @returns متن محدودشده
 */
function truncateText(text: string, maxLength: number): string {
  const cleaned = stripHtml(text);
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

/**
 * محاسبه آدرس کانونیکال کامل
 * @param path - مسیر صفحه
 * @returns آدرس کامل URL
 */
function buildCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

// ============================================
// ROBOTS_DIRECTIVES
// دستورات ربات‌ها برای انواع مختلف صفحات
// ============================================

export const ROBOTS_DIRECTIVES = {
  /** صفحات عمومی - ایندکس و فالو کامل */
  public: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },

  /** صفحات دسته‌بندی - ایندکس و فالو */
  category: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },

  /** صفحات آگهی منتشرشده */
  publishedAd: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },

  /** صفحات آگهی پیش‌نویس یا تأییدنشده - بدون ایندکس */
  draftAd: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      "max-image-preview": "none" as const,
    },
  },

  /** صفحات جستجو - فالو ولی بدون ایندکس (جلوگیری از محتوای تکراری) */
  search: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },

  /** صفحات پنل کاربری و مدیریت - بدون ایندکس */
  private: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
    },
  },

  /** صفحات پاگینیشن (صفحات بعد از اول) */
  paginated: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
  },
} as const;

// ============================================
// generateAdMetadata
// تولید متادیتای صفحه آگهی ملکی
// ============================================

/**
 * تولید متادیتای Next.js برای صفحه جزئیات آگهی
 *
 * عنوان: "{title} | {city} - {district} | نام سایت"
 * توضیحات: ۱۵۰ کاراکتر اول توضیحات + اطلاعات قیمت
 *
 * @param ad - اطلاعات آگهی
 * @returns شیء Metadata برای Next.js
 */
export function generateAdMetadata(ad: AdSeoData): SeoMetadata {
  // ساخت عنوان صفحه
  const districtPart = ad.district ? ` - ${ad.district}` : "";
  const adTitle = `${ad.title} | ${ad.city}${districtPart} | ${SITE_NAME}`;

  // ساخت توضیحات متا
  const priceText = formatPriceForSeo(ad.price, ad.priceUnit);
  const descriptionPrefix = truncateText(
    ad.description,
    META_DESCRIPTION_MAX_LENGTH - priceText.length - 5,
  );
  const adDescription = `${descriptionPrefix} | ${priceText}`;

  // آدرس کانونیکال
  const canonicalUrl = buildCanonicalUrl(`/ads/${ad.slug}`);

  // آدرس تصویر اصلی
  const primaryImage =
    ad.images && ad.images.length > 0
      ? ad.images[0].startsWith("http")
        ? ad.images[0]
        : `${BASE_URL}${ad.images[0]}`
      : `${BASE_URL}/images/og-default.jpg`;

  // تشخیص وضعیت آگهی - پیش‌نویس و تأییدنشده بدون ایندکس
  const isNoindex =
    ad.status === "draft" ||
    ad.status === "pending" ||
    ad.status === "rejected" ||
    !ad.isVerified;

  // تعیین نوع محتوا بر اساس وضعیت
  const contentType = ad.status === "sold" ? "article" : "article";

  const metadata: SeoMetadata = {
    title: adTitle.slice(0, META_TITLE_MAX_LENGTH),
    description: adDescription,

    // ---------- Open Graph ----------
    openGraph: {
      title: adTitle.slice(0, META_TITLE_MAX_LENGTH),
      description: adDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: ad.title,
        },
      ],
      locale: "fa_IR",
      type: contentType,
    },

    // ---------- Twitter Card ----------
    twitter: {
      card: "summary_large_image",
      title: adTitle.slice(0, META_TITLE_MAX_LENGTH),
      description: adDescription,
      images: [primaryImage],
    },

    // ---------- کانونیکال ----------
    alternates: {
      canonical: canonicalUrl,
    },

    // ---------- Robots ----------
    robots: isNoindex
      ? ROBOTS_DIRECTIVES.draftAd
      : ROBOTS_DIRECTIVES.publishedAd,

    // ---------- اطلاعات اضافی ----------
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  };

  return metadata;
}

// ============================================
// generateCategoryMetadata
// تولید متادیتای صفحات دسته‌بندی
// ============================================

/**
 * تولید متادیتای Next.js برای صفحه لیست آگهی‌های یک دسته‌بندی
 *
 * عنوان: "آگهی‌های {categoryName} در {location} | صفحه {page}"
 * شامل تگ‌های پاگینیشن (prev/next)
 *
 * @param category - اطلاعات دسته‌بندی
 * @param page - شماره صفحه فعلی
 * @param location - نام شهر یا محله (اختیاری)
 * @param totalPages - تعداد کل صفحات (اختیاری)
 * @returns شیء Metadata برای Next.js
 */
export function generateCategoryMetadata(
  category: CategorySeoData,
  page: number = 1,
  location?: string,
  totalPages?: number,
): SeoMetadata {
  const locationText = location ? ` در ${location}` : "";
  const pageText = page > 1 ? ` | صفحه ${page}` : "";

  const title = `آگهی‌های ${category.name}${locationText}${pageText} | ${SITE_NAME}`;
  const description = category.description
    ? truncateText(category.description, META_DESCRIPTION_MAX_LENGTH)
    : `جستجو و مشاهده ${category.name}${locationText}. هزاران آگهی ملکی معتبر با قیمت‌های روز.`;

  const canonicalPath =
    page > 1
      ? `/category/${category.slug}${location ? `/${location}` : ""}?page=${page}`
      : `/category/${category.slug}${location ? `/${location}` : ""}`;

  const canonicalUrl = buildCanonicalUrl(canonicalPath);

  // ساخت تگ‌های پاگینیشن (prev/next)
  const alternates: SeoMetadata["alternates"] = {
    canonical: canonicalUrl,
  };

  // افزودن لینک صفحه قبلی
  if (page > 1) {
    const prevPage = page - 1;
    const prevPath =
      prevPage === 1
        ? `/category/${category.slug}${location ? `/${location}` : ""}`
        : `/category/${category.slug}${location ? `/${location}` : ""}?page=${prevPage}`;
    alternates.prev = buildCanonicalUrl(prevPath);
  }

  // افزودن لینک صفحه بعدی
  if (totalPages && page < totalPages) {
    const nextPath = `/category/${category.slug}${location ? `/${location}` : ""}?page=${page + 1}`;
    alternates.next = buildCanonicalUrl(nextPath);
  }

  // صفحات بعد از صفحه اول بدون عنوان شماره‌دار
  const robots =
    page === 1 ? ROBOTS_DIRECTIVES.category : ROBOTS_DIRECTIVES.paginated;

  return {
    title: title.slice(0, META_TITLE_MAX_LENGTH),
    description,
    alternates,
    openGraph: {
      title: title.slice(0, META_TITLE_MAX_LENGTH),
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "fa_IR",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: title.slice(0, META_TITLE_MAX_LENGTH),
      description,
    },
    robots,
  };
}

// ============================================
// generateStaticMetadata
// تولید متادیتای صفحات استاتیک
// ============================================

/**
 * تولید متادیتای Next.js برای صفحات استاتیک (درباره ما، تماس، قوانین و ...)
 *
 * @param options - گزینه‌های متادیتا شامل عنوان، توضیحات، مسیر و نوع
 * @returns شیء Metadata برای Next.js
 */
export function generateStaticMetadata(
  options: StaticMetadataOptions,
): SeoMetadata {
  const { title, description, path, image, type = "website" } = options;

  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = buildCanonicalUrl(path);
  const ogImage = image || `${BASE_URL}/images/og-default.jpg`;

  return {
    title: fullTitle.slice(0, META_TITLE_MAX_LENGTH),
    description: truncateText(description, META_DESCRIPTION_MAX_LENGTH),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle.slice(0, META_TITLE_MAX_LENGTH),
      description: truncateText(description, META_DESCRIPTION_MAX_LENGTH),
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "fa_IR",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle.slice(0, META_TITLE_MAX_LENGTH),
      description: truncateText(description, META_DESCRIPTION_MAX_LENGTH),
      images: [ogImage],
    },
    robots: ROBOTS_DIRECTIVES.public,
  };
}

// ============================================
// generateBreadcrumbJsonLd
// تولید داده ساختاریافته JSON-LD برای مسیر نان‌خای
// ============================================

/**
 * تولید ساختار JSON-LD برای BreadcrumbList
 * این داده به موتورهای جستجو کمک می‌کند مسیر صفحه را درک کنند
 *
 * @param items - آرایه‌ای از آیتم‌های مسیر {name, url}
 * @returns شیء JSON-LD استاندارد BreadcrumbList
 *
 * @example
 * ```ts
 * generateBreadcrumbJsonLd([
 *   { name: 'خانه', url: '/' },
 *   { name: 'تهران', url: '/city/tehran' },
 *   { name: 'آپارتمان', url: '/category/apartment/city/tehran' },
 * ])
 * ```
 */
export function generateBreadcrumbJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.url),
    })),
  };
}

// ============================================
// generateAdJsonLd
// تولید داده ساختاریافته JSON-LD برای آگهی ملکی
// ============================================

/**
 * تولید ساختار JSON-LD برای RealEstateListing
 * این داده به گوگل کمک می‌کند اطلاعات ملک را بهتر درک و نمایش دهد
 *
 * شامل فیلدها: name, description, image, price, address,
 * geoCoordinates, numberOfRooms, floorSize, datePosted, offers
 *
 * @param ad - اطلاعات آگهی
 * @returns شیء JSON-LD استاندارد RealEstateListing
 */
export function generateAdJsonLd(ad: AdSeoData): Record<string, unknown> {
  const primaryImage =
    ad.images && ad.images.length > 0
      ? ad.images[0].startsWith("http")
        ? ad.images[0]
        : `${BASE_URL}${ad.images[0]}`
      : `${BASE_URL}/images/og-default.jpg`;

  const allImages =
    ad.images && ad.images.length > 0
      ? ad.images.map((img) =>
          img.startsWith("http") ? img : `${BASE_URL}${img}`,
        )
      : [primaryImage];

  // ساخت شیء آدرس
  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressCountry: "IR",
    addressRegion: ad.city,
    addressLocality: ad.district || ad.city,
  };

  // افزودن آدرس خیابان در صورت وجود
  if (ad.address) {
    address.streetAddress = ad.address;
  }

  // ساخت شیء مختصات جغرافیایی
  let geo: Record<string, unknown> | undefined;
  if (ad.latitude && ad.longitude) {
    geo = {
      "@type": "GeoCoordinates",
      latitude: ad.latitude,
      longitude: ad.longitude,
    };
  }

  // ساخت شیء قیمت و پیشنهاد
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: "IRR",
    availability: "https://schema.org/InStock",
  };

  if (ad.price && ad.price > 0) {
    offer.price = ad.price;
  } else {
    // برای آگهی‌های توافقی یا تماس بگیرید
    offer.priceSpecification = {
      "@type": "PriceSpecification",
      priceCurrency: "IRR",
      price: "0",
      priceText: "تماس بگیرید",
    };
  }

  if (ad.status === "sold") {
    offer.availability = "https://schema.org/SoldOut";
  }

  // ساخت شیء نهایی
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: ad.title,
    description: stripHtml(ad.description),
    url: buildCanonicalUrl(`/ads/${ad.slug}`),
    image: allImages,
    datePosted: ad.createdAt,
    ...(ad.updatedAt && { dateModified: ad.updatedAt }),
    address,
    offers: offer,
  };

  // افزودن مختصات جغرافیایی در صورت وجود
  if (geo) {
    jsonLd.geo = geo;
  }

  // افزودن تعداد اتاق در صورت وجود
  if (ad.numberOfRooms && ad.numberOfRooms > 0) {
    jsonLd.numberOfRooms = ad.numberOfRooms;
  }

  // افزودن متراژ در صورت وجود
  if (ad.floorSize && ad.floorSize > 0) {
    jsonLd.floorSize = {
      "@type": "QuantitativeValue",
      value: ad.floorSize,
      unitCode: "MTK", // متر مربع
    };
  }

  // افزودن دسته‌بندی در صورت وجود
  if (ad.category) {
    jsonLd.category = ad.category;
  }

  return jsonLd;
}

// ============================================
// generateOrganizationJsonLd
// تولید داده ساختاریافته JSON-LD برای سازمان (صفحه اصلی)
// ============================================

/**
 * تولید ساختار JSON-LD برای Organization
 * این داده در صفحه اصلی قرار می‌گیرد و اطلاعات سازمان را
 * برای نمایش در Knowledge Panel گوگل فراهم می‌کند
 *
 * @returns شیء JSON-LD استاندارد Organization
 */
export function generateOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    image: `${BASE_URL}/images/og-default.jpg`,
    description: `${SITE_NAME} - بزرگ‌ترین پلتفرم جستجوی و خرید و فروش املاک در سراسر ایران. آپارتمان، خانه، زمین و ویلا با قیمت‌های روز.`,
    telephone: "+98-21-12345678",
    email: "info@example.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "خیابان ولیعصر، پلاک ۱۲۳",
      addressLocality: "تهران",
      addressRegion: "تهران",
      postalCode: "1234567890",
      addressCountry: "IR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 35.6892,
      longitude: 51.389,
    },
    sameAs: [
      "https://instagram.com/example",
      "https://t.me/example",
      "https://twitter.com/example",
      "https://www.linkedin.com/company/example",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+98-21-12345678",
      contactType: "customer service",
      availableLanguage: ["Persian", "English"],
      areaServed: "IR",
    },
    areaServed: {
      "@type": "Country",
      name: "Iran",
    },
    priceRange: "$$",
  };
}
