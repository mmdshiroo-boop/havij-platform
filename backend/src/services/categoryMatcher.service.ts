import { Category } from "../models";

interface CategoryNode {
  _id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
}

let categoryCache: CategoryNode[] | null = null;

async function loadCategories(): Promise<CategoryNode[]> {
  if (categoryCache) return categoryCache;

  const cats = await Category.find({ isActive: true }).lean();
  categoryCache = cats.map((cat: any) => ({
    _id: cat._id.toString(),
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId?.toString() || null,
    level: cat.level || 0,
  }));
  return categoryCache;
}

function getKeywordMap(): Record<string, string[]> {
  return {
    املاک: [
      "ملک",
      "زمین",
      "ساختمان",
      "مسکن",
      "مستغلات",
      "خانه",
      "املاک",
      "real estate",
      "property",
      "building",
      "house",
    ],
    "فروش آپارتمان": [
      "فروش",
      "آپارتمان",
      "اپارتمان",
      "برج",
      "واحد مسکونی",
      "خرید",
      "buy",
      "sale",
      "apartment",
      "for sale",
    ],
    "اجاره آپارتمان": [
      "اجاره",
      "رهن",
      "مستاجر",
      "رهن و اجاره",
      "rent",
      "apartment",
      "for rent",
      "رهن کامل",
    ],
    "فروش ویلا": [
      "ویلا",
      "باغ",
      "کلنگی",
      "ویلایی",
      "باغچه",
      "villa",
      "garden",
      "فروش ویلا",
      "خرید ویلا",
    ],
    خودرو: [
      "ماشین",
      "اتومبیل",
      "خودرو",
      "سواری",
      "ون",
      "car",
      "vehicle",
      "automobile",
    ],
    سواری: ["سواری", "سدان", "هاچبک", "sedan", "hatchback"],
    موتورسیکلت: ["موتور", "موتورسیکلت", "موتور سیکلت", "motorcycle", "bike"],
    استخدام: [
      "استخدام",
      "کار",
      "شغل",
      "job",
      "employment",
      "استخدامی",
      "فرصت شغلی",
    ],
    برنامه‌نویسی: [
      "برنامه‌نویسی",
      "برنامه نویس",
      "developer",
      "programming",
      "کدنویسی",
      "frontend",
      "backend",
      "fullstack",
    ],
    بازاریابی: [
      "بازاریابی",
      "مارکتینگ",
      "marketing",
      "فروش",
      "تبلیغات",
      "سئو",
      "seo",
    ],
  };
}

function buildSearchText(item: any): string {
  const d = item.data || item;
  const parts: string[] = [];

  if (d.title) {
    parts.push(d.title);
    parts.push(d.title);
  }
  if (d.description) parts.push(d.description);
  if (d.category) {
    parts.push(d.category);
    parts.push(d.category);
  }
  if (Array.isArray(d.categoryBreadcrumb)) {
    d.categoryBreadcrumb.forEach((b: any) => {
      if (b.name) parts.push(b.name);
    });
  }
  if (Array.isArray(d.attributes)) {
    d.attributes.forEach((a: any) => {
      if (a.key) parts.push(a.key);
      if (a.value) parts.push(a.value);
    });
  }
  if (d.rawJsonLd) {
    const ld = d.rawJsonLd;
    if (ld.name) parts.push(ld.name);
    if (ld.description) parts.push(ld.description);
    if (ld.itemOffered?.name) parts.push(ld.itemOffered.name);
    if (ld.itemOffered?.additionalProperty) {
      ld.itemOffered.additionalProperty.forEach((p: any) => {
        if (p.name) parts.push(p.name);
        if (p.value) parts.push(p.value);
      });
    }
  }

  return parts.join(" ").toLowerCase();
}

export async function detectCategory(item: any): Promise<string | null> {
  const categories = await loadCategories();
  if (categories.length === 0) return null;

  const searchText = buildSearchText(item);
  if (!searchText.trim()) return null;

  const keywordMap = getKeywordMap();
  const scores: {
    id: string;
    name: string;
    score: number;
    level: number;
    parentId: string | null;
  }[] = [];

  for (const cat of categories) {
    let score = 0;
    const keywords = keywordMap[cat.name] || [cat.name, cat.slug];

    for (const kw of keywords) {
      if (!kw) continue;
      const lowerKw = kw.toLowerCase();
      if (searchText.includes(lowerKw)) {
        score += 2;
        const escapedKw = lowerKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|\\s)${escapedKw}(\\s|$)`, "i");
        if (regex.test(searchText)) score += 3;
        if (item.data?.title?.toLowerCase().includes(lowerKw)) score += 5;
      }
    }

    if (score > 0) {
      scores.push({
        id: cat._id,
        name: cat.name,
        score,
        level: cat.level,
        parentId: cat.parentId,
      });
    }
  }

  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.level - a.level;
  });

  const MIN_SCORE = 5;

  if (scores.length > 0 && scores[0].score >= MIN_SCORE) {
    return scores[0].id;
  }

  // 🆕 اگر هیچ زیردسته‌ای امتیاز کافی نداشت، اولین والد مرتبط را پیدا کن
  const parentMap = new Map<string, string>(); // childId -> parentId
  for (const cat of categories) {
    if (cat.parentId) parentMap.set(cat._id, cat.parentId);
  }

  // سعی کن از بالاترین امتیاز، والد را برگردانی
  for (const scoreItem of scores) {
    const parentId = parentMap.get(scoreItem.id);
    if (parentId) return parentId;
  }

  // اگر هیچ والد مرتبطی نبود، دستهٔ «املاک» را به‌عنوان پیش‌فرض برگردان (اگر وجود دارد)
  const realEstateCat = categories.find(
    (c) => c.slug === "real-estate" || c.name === "املاک",
  );
  if (realEstateCat) return realEstateCat._id;

  // اگر هیچ دسته‌ای وجود نداشت (که نباید)، null برگردان
  return null;
}
