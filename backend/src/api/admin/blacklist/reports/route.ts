import { Request, Response, NextFunction } from "express";
import BlacklistKeyword, {
  IBlacklistKeyword,
  BlacklistCategory,
  BlacklistSeverity,
  SEVERITY_WEIGHTS,
} from "../../../../models/blacklist.model";
import { Ad } from "../../../../models";

// ──────────────────────────────────────────────────────────────────────────
// 🇮🇷 کنترلر لیست سیاه کلمات کلیدی — سیستم نظارت بر آگهی‌های املاک
// ──────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────
// بخش ۱: لیست سیاه پیش‌فرض
// کلمات و عبارات پرکاربرد فارسی که در آگهی‌های املاک مشکلاتی ایجاد می‌کنند
// ──────────────────────────────────────────────

interface DefaultBlacklistItem {
  keyword: string;
  category: BlacklistCategory;
  severity: BlacklistSeverity;
  note: string;
}

/** لیست پیش‌فرض کلمات سیاه — هنگام اولین اجرا وارد دیتابیس می‌شوند */
const DEFAULT_BLACKLIST: DefaultBlacklistItem[] = [
  // ── عبارات کلاهبرداری ──
  {
    keyword: "فوری",
    category: "scam",
    severity: "medium",
    note: "ایجاد فشار احساسی برای تصمیم سریع",
  },
  {
    keyword: "فقط امروز",
    category: "scam",
    severity: "high",
    note: "تاکتیک فشار زمانی برای کلاهبرداری",
  },
  {
    keyword: "تخفیف ویژه",
    category: "scam",
    severity: "medium",
    note: "عبارت تبلیغاتی فریبنده",
  },
  {
    keyword: "فرصت استثنایی",
    category: "scam",
    severity: "high",
    note: "جلب توجه با ایجاد حس فوریت کاذب",
  },
  {
    keyword: "فرصت طلایی",
    category: "scam",
    severity: "medium",
    note: "عبارت تبلیغاتی اغراق‌آمیز",
  },
  {
    keyword: "قیمت رویایی",
    category: "scam",
    severity: "medium",
    note: "قیمت غیرمنطقی و فریبنده",
  },
  {
    keyword: "بدون پیش‌پرداخت",
    category: "scam",
    severity: "high",
    note: "شاید کلاهبرداری باشد",
  },
  {
    keyword: "گارانتی بازگشت وجه",
    category: "scam",
    severity: "medium",
    note: "ادعای بدون پشتوانه قانونی",
  },
  {
    keyword: "سود تضمینی",
    category: "scam",
    severity: "high",
    note: "وعده سود غیرمنطقی",
  },
  {
    keyword: "صد در صد تضمینی",
    category: "scam",
    severity: "high",
    note: "ادعای قطعی مشکوک",
  },
  {
    keyword: "خرید بی‌واسطه",
    category: "scam",
    severity: "low",
    note: "شاید معتبر باشد ولی نیاز به بررسی",
  },
  {
    keyword: "مستقیم از مالک",
    category: "scam",
    severity: "low",
    note: "نیاز به احراز هویت مالک",
  },
  {
    keyword: "آخرین فرصت",
    category: "scam",
    severity: "medium",
    note: "ایجاد فشار زمانی",
  },
  {
    keyword: "قیمت شکسته",
    category: "scam",
    severity: "medium",
    note: "عبارت اغراق‌آمیز",
  },

  // ── الگوهای هرزنامه ──
  {
    keyword: "تماس بگیرید",
    category: "spam",
    severity: "low",
    note: "درخواست تماس بدون اطلاعات کافی",
  },
  {
    keyword: "واتساپ",
    category: "spam",
    severity: "low",
    note: "انتقال کاربر به پیام‌رسان خارجی",
  },
  {
    keyword: "تلگرام من",
    category: "spam",
    severity: "medium",
    note: "هدایت به کانال تلگرام",
  },
  {
    keyword: "عضویت در کانال",
    category: "spam",
    severity: "medium",
    note: "تبلیغ کانال",
  },
  {
    keyword: "ایمیل ما",
    category: "spam",
    severity: "low",
    note: "هدایت به ایمیل",
  },
  {
    keyword: "اینستاگرام ما",
    category: "spam",
    severity: "low",
    note: "تبلیغ پیج",
  },
  {
    keyword: "لینک مستقیم",
    category: "spam",
    severity: "medium",
    note: "لینک خارجی مشکوک",
  },
  {
    keyword: "روی لینک کلیک کنید",
    category: "spam",
    severity: "medium",
    note: "فیشینگ احتمالی",
  },
  {
    keyword: "برای اطلاعات بیشتر تماس بگیر",
    category: "spam",
    severity: "low",
    note: "عدم ارائه اطلاعات کافی در آگهی",
  },
  {
    keyword: "http",
    category: "spam",
    severity: "medium",
    note: "لینک خارجی در متن آگهی",
  },
  {
    keyword: "https",
    category: "spam",
    severity: "medium",
    note: "لینک خارجی در متن آگهی",
  },
  { keyword: ".ir", category: "spam", severity: "low", note: "دامنه وب‌سایت" },
  { keyword: ".com", category: "spam", severity: "low", note: "دامنه وب‌سایت" },

  // ── کلمات اخلاقی/سیاسی پایه ──
  {
    keyword: "رشوه",
    category: "ethical",
    severity: "critical",
    note: "اشاره به فساد مالی",
  },
  {
    keyword: "زورگیری",
    category: "ethical",
    severity: "critical",
    note: "تهدید و ارعاب",
  },
  {
    keyword: "تقلب",
    category: "ethical",
    severity: "high",
    note: "اشاره به تقلب",
  },
  {
    keyword: "کلاهبرداری",
    category: "ethical",
    severity: "high",
    note: "اشاره مستقیم به کلاهبرداری",
  },

  // ── کلمات سیاسی ──
  {
    keyword: "تحریم",
    category: "political",
    severity: "high",
    note: "موضوع حساس سیاسی",
  },
  {
    keyword: "اعتراض",
    category: "political",
    severity: "high",
    note: "موضوع حساس سیاسی",
  },
  {
    keyword: "تظاهرات",
    category: "political",
    severity: "high",
    note: "موضوع حساس سیاسی",
  },
  {
    keyword: "سازمان مخفی",
    category: "political",
    severity: "critical",
    note: "محتوای مشکوک",
  },
];

// ──────────────────────────────────────────────
// بخش ۲: توابع کمکی (Helper Functions)
// ──────────────────────────────────────────────

/** نتیجه تطبیق یک کلمه سیاه با متن */
export interface KeywordMatch {
  /** کلمه سیاه پیدا شده */
  keyword: string;
  /** دسته‌بندی کلمه */
  category: BlacklistCategory;
  /** سطح شدت */
  severity: BlacklistSeverity;
  /** بخشی از متن که مطابقت داشته */
  matchedText: string;
  /** موقعیت شروع تطبیق در متن (کاراکتر) */
  position: number;
}

/** نتیجه بررسی متن */
export interface TextCheckResult {
  /** آیا متنی پرچم‌گذاری شده؟ */
  flagged: boolean;
  /** لیست تطبیق‌ها */
  matches: KeywordMatch[];
  /** نمره ریسک ۰ تا ۱۰۰ */
  score: number;
}

/**
 * نرمال‌سازی متن فارسی/عربی
 * تبدیل کاراکترهای عربی به فارسی، حذف فاصله‌های اضافی و اعراب
 *
 * @param text - متن ورودی
 * @returns متن نرمال‌سازی شده
 */
export function normalizePersianText(text: string): string {
  if (!text) return "";

  return (
    text
      // حذف اعراب عربی (فتحه، کسره، ضمه، تنوین‌ها، سکون، شدّه)
      .replace(/[\u064B-\u065F\u0670]/g, "")
      // حذف تشدید و تنوین
      .replace(/\u0651/g, "")
      .replace(/\u0652/g, "")
      // تبدیل کاف عربی (ك) به کاف فارسی (ک)
      .replace(/ك/g, "ک")
      // تبدیل یای عربی (ي) به یای فارسی (ی)
      .replace(/ي/g, "ی")
      // تبدیل تای مرBNه‌شده (ة) به ه
      .replace(/ة/g, "ه")
      // تبدیل ۰-۹ عربی/هندی به فارسی
      .replace(/[٠-٩]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 16) - 0x0660] || d)
      // حذف فاصله‌های متعدد و تبدیل به فاصله واحد
      .replace(/\s+/g, " ")
      // حذف نیم‌فاصله‌های اضافی
      .replace(/\u200C{2,}/g, "\u200C")
      // حذف فاصله‌های اطراف متن
      .trim()
      // حذف خط تیره‌های اضافی
      .replace(/[-–—]{2,}/g, " - ")
      // نرمال‌سازی نقطه‌گذاری
      .replace(/[،؛؟]/g, " ")
  );
}

/**
 * محاسبه فاصله لون‌اشتاین (Levenshtein distance) بین دو رشته
 * برای تطبیق فازی (fuzzy matching)
 *
 * @param a - رشته اول
 * @param b - رشته دوم
 * @returns تعداد تغییرات لازم برای تبدیل a به b
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // ماتریس DP
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  // مقداردهی اولیه
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // پر کردن ماتریس
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // حذف
            dp[i][j - 1], // درج
            dp[i - 1][j - 1], // جایگزینی
          );
      }
    }
  }

  return dp[m][n];
}

/**
 * بررسی تطبیق فازی بین دو رشته
 * درصورت نزدیکی کافی، تطبیق برقرار می‌شود
 *
 * @param source - متن منبع (نرمال‌سازی شده)
 * @param target - کلمه هدف (نرمال‌سازی شده)
 * @param threshold - آستانه تطبیق (۰ تا ۱، پیش‌فرض ۰.۸)
 * @returns آیا تطبیق وجود دارد؟
 */
function fuzzyMatch(
  source: string,
  target: string,
  threshold: number = 0.8,
): boolean {
  // تطبیق دقیق
  if (source.includes(target)) return true;

  // تطبیق فازی: اگر طول کلمه کمتر از ۳ باشد، فقط تطبیق دقیق
  if (target.length < 3) return false;

  // محاسبه شباهت بر اساس فاصله لون‌اشتاین
  const distance = levenshteinDistance(source, target);
  const maxLen = Math.max(source.length, target.length);
  const similarity = 1 - distance / maxLen;

  return similarity >= threshold;
}

/**
 * جستجوی همه موقعیت‌های یک زیررشته در متن
 *
 * @param text - متن اصلی
 * @param substring - زیررشته مورد جستجو
 * @returns آرایه‌ای از موقعیت‌های شروع
 */
function findAllOccurrences(text: string, substring: string): number[] {
  const positions: number[] = [];
  let pos = text.indexOf(substring);

  while (pos !== -1) {
    positions.push(pos);
    pos = text.indexOf(substring, pos + 1);
  }

  return positions;
}

/**
 * بررسی متن در برابر لیست سیاه
 * شامل تطبیق دقیق و فازی با نرمال‌سازی فارسی
 *
 * @param text - متن آگهی (عنوان + توضیحات)
 * @param keywords - آرایه کلمات سیاه
 * @returns نتیجه بررسی شامل تطبیق‌ها و نمره ریسک
 */
export function checkTextAgainstBlacklist(
  text: string,
  keywords: IBlacklistKeyword[],
): TextCheckResult {
  if (!text || !keywords || keywords.length === 0) {
    return { flagged: false, matches: [], score: 0 };
  }

  const normalizedText = normalizePersianText(text);
  const normalizedTextLower = normalizedText.toLowerCase();
  const matches: KeywordMatch[] = [];
  const seenKeywords = new Set<string>(); // جلوگیری از تطبیق تکراری

  for (const kw of keywords) {
    // فقط کلمات فعال
    if (!kw.isActive) continue;

    // نرمال‌سازی کلمه کلیدی
    const normalizedKeyword = normalizePersianText(kw.keyword);
    const normalizedKeywordLower = normalizedKeyword.toLowerCase();

    // جلوگیری از تکرار
    if (seenKeywords.has(normalizedKeywordLower)) continue;

    // ── ۱. تطبیق دقیق در متن نرمال‌سازی شده ──
    const exactPositions = findAllOccurrences(
      normalizedTextLower,
      normalizedKeywordLower,
    );

    if (exactPositions.length > 0) {
      seenKeywords.add(normalizedKeywordLower);
      // فقط اولین تطبیق را ثبت می‌کنیم
      const pos = exactPositions[0];
      // استخراج متن اطراف تطبیق (حداکثر ۵۰ کاراکتر)
      const contextStart = Math.max(0, pos - 10);
      const contextEnd = Math.min(
        normalizedText.length,
        pos + normalizedKeyword.length + 40,
      );
      const matchedText = normalizedText.slice(contextStart, contextEnd);

      matches.push({
        keyword: kw.keyword,
        category: kw.category,
        severity: kw.severity,
        matchedText,
        position: pos,
      });

      continue;
    }

    // ── ۲. تطبیق فازی برای کلمات بلند (بیشتر از ۳ کاراکتر) ──
    if (normalizedKeyword.length >= 3) {
      // تقسیم متن به کلمات و بررسی هر کلمه
      const words = normalizedTextLower.split(/\s+/);

      for (let i = 0; i < words.length; i++) {
        // تطبیق فازی تک‌کلمه‌ای
        if (fuzzyMatch(words[i], normalizedKeywordLower, 0.85)) {
          if (seenKeywords.has(normalizedKeywordLower)) break;
          seenKeywords.add(normalizedKeywordLower);

          // یافتن موقعیت در متن اصلی
          const pos = normalizedTextLower.indexOf(words[i]);
          const contextStart = Math.max(0, pos - 10);
          const contextEnd = Math.min(
            normalizedText.length,
            pos + words[i].length + 40,
          );
          const matchedText = normalizedText.slice(contextStart, contextEnd);

          matches.push({
            keyword: kw.keyword,
            category: kw.category,
            severity: kw.severity,
            matchedText,
            position: pos,
          });
          break;
        }

        // بررسی عبارات دو کلمه‌ای
        if (i < words.length - 1) {
          const twoWords = `${words[i]} ${words[i + 1]}`;
          if (fuzzyMatch(twoWords, normalizedKeywordLower, 0.8)) {
            if (seenKeywords.has(normalizedKeywordLower)) break;
            seenKeywords.add(normalizedKeywordLower);

            const pos = normalizedTextLower.indexOf(words[i]);
            const contextStart = Math.max(0, pos - 10);
            const contextEnd = Math.min(
              normalizedText.length,
              pos + twoWords.length + 40,
            );
            const matchedText = normalizedText.slice(contextStart, contextEnd);

            matches.push({
              keyword: kw.keyword,
              category: kw.category,
              severity: kw.severity,
              matchedText,
              position: pos,
            });
            break;
          }
        }

        // بررسی عبارات سه کلمه‌ای (برای عبارات طولانی‌تر)
        if (i < words.length - 2 && normalizedKeyword.includes(" ")) {
          const threeWords = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          if (fuzzyMatch(threeWords, normalizedKeywordLower, 0.75)) {
            if (seenKeywords.has(normalizedKeywordLower)) break;
            seenKeywords.add(normalizedKeywordLower);

            const pos = normalizedTextLower.indexOf(words[i]);
            const contextStart = Math.max(0, pos - 10);
            const contextEnd = Math.min(
              normalizedText.length,
              pos + threeWords.length + 40,
            );
            const matchedText = normalizedText.slice(contextStart, contextEnd);

            matches.push({
              keyword: kw.keyword,
              category: kw.category,
              severity: kw.severity,
              matchedText,
              position: pos,
            });
            break;
          }
        }
      }
    }
  }

  // مرتب‌سازی بر اساس شدت (بحرانی اول)
  const severityOrder: Record<BlacklistSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  matches.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    flagged: matches.length > 0,
    matches,
    score: calculateFlagScore(matches),
  };
}

/**
 * محاسبه نمره ریسک بر اساس تطبیق‌های پیدا شده
 * نمره بین ۰ تا ۱۰۰
 *
 * الگوریتم:
 * - هر تطبیق وزنی بر اساس شدت دارد
 * - امتیاز نهایی = min(Σ وزن‌ها, 100)
 * - اگر تطبیق بحرانی وجود داشته باشد، حداقل ۸۰ امتیاز
 *
 * @param matches - آرایه تطبیق‌ها
 * @returns نمره ریسک (۰ تا ۱۰۰)
 */
export function calculateFlagScore(matches: KeywordMatch[]): number {
  if (!matches || matches.length === 0) return 0;

  let totalScore = 0;
  let hasCritical = false;

  for (const match of matches) {
    const weight = SEVERITY_WEIGHTS[match.severity];

    // اولین تطبیق از هر نوع وزن کامل را می‌گیرد
    // تطبیق‌های تکراری وزن کمتری دارند
    totalScore += weight;

    if (match.severity === "critical") {
      hasCritical = true;
    }
  }

  // اگر حداقل یک تطبیق بحرانی وجود دارد، حداقل نمره ۸۰
  if (hasCritical && totalScore < 80) {
    totalScore = 80;
  }

  // اعمال ضریب تعداد: هرچه تطبیق‌های بیشتری باشد، نمره بالاتر
  const multiplier = 1 + (matches.length - 1) * 0.1;
  totalScore = totalScore * multiplier;

  // محدود کردن به ۱۰۰
  return Math.min(Math.round(totalScore), 100);
}

/**
 * اعمال اولیه لیست سیاه پیش‌فرض
 * در صورت خالی بودن دیتابیس، کلمات پیش‌فرض اضافه می‌شوند
 *
 * @param adminUserId - شناسه کاربر ادمین برای فیلد addedBy
 */
export async function seedDefaultBlacklist(adminUserId: string): Promise<void> {
  const count = await BlacklistKeyword.countDocuments();

  if (count === 0) {
    console.log("📂 در حال بارگذاری لیست سیاه پیش‌فرض...");

    const docs = DEFAULT_BLACKLIST.map((item) => ({
      keyword: item.keyword,
      category: item.category,
      severity: item.severity,
      note: item.note,
      addedBy: adminUserId,
      isActive: true,
      matchCount: 0,
    }));

    await BlacklistKeyword.insertMany(docs);
    console.log(`✅ ${docs.length} کلمه سیاه پیش‌فرض اضافه شد`);
  }
}

// ──────────────────────────────────────────────
// بخش ۳: Middleware — بررسی دسترسی ادمین
// ──────────────────────────────────────────────

/**
 * میان‌افزار بررسی نقش ادمین
 * فقط کاربران با نقش admin یا super_admin اجازه دسترسی دارند
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: "احراز هویت نشده‌اید",
    });
    return;
  }

  if (!["admin", "super_admin"].includes(user.role)) {
    res.status(403).json({
      success: false,
      message: "فقط ادمین‌ها دسترسی دارند",
    });
    return;
  }

  next();
}

// ──────────────────────────────────────────────
// بخش ۴: کنترلرهای API
// ──────────────────────────────────────────────

/**
 * POST /api/admin/blacklist
 * افزودن کلمه/عبارت جدید به لیست سیاه
 */
export async function addKeyword(req: Request, res: Response): Promise<void> {
  try {
    const { keyword, category, severity, note } = req.body;
    const userId = (req as any).user?._id;

    // اعتبارسنجی ورودی‌ها
    if (
      !keyword ||
      typeof keyword !== "string" ||
      keyword.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "کلمه کلیدی الزامی است",
      });
      return;
    }

    if (
      !["ethical", "political", "scam", "spam", "custom"].includes(category)
    ) {
      res.status(400).json({
        success: false,
        message: "دسته‌بندی نامعتبر است",
      });
      return;
    }

    if (!["low", "medium", "high", "critical"].includes(severity)) {
      res.status(400).json({
        success: false,
        message: "سطح شدت نامعتبر است",
      });
      return;
    }

    // بررسی تکراری نبودن کلمه (با نرمال‌سازی)
    const normalizedKeyword = normalizePersianText(keyword.trim());
    const existing = await BlacklistKeyword.findOne({
      keyword: normalizedKeyword,
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: "این کلمه قبلاً در لیست سیاه وجود دارد",
        data: { existingId: existing._id },
      });
      return;
    }

    // ایجاد رکورد جدید
    const newKeyword = await BlacklistKeyword.create({
      keyword: normalizedKeyword,
      category,
      severity,
      note: note?.trim() || "",
      addedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: "کلمه سیاه با موفقیت اضافه شد",
      data: newKeyword,
    });
  } catch (error: any) {
    // خطای تکراری بودن (duplicate key)
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "این کلمه قبلاً در لیست سیاه وجود دارد",
      });
      return;
    }

    console.error("خطا در افزودن کلمه سیاه:", error);
    res.status(500).json({
      success: false,
      message: "خطای سرور در افزودن کلمه سیاه",
    });
  }
}

/**
 * GET /api/admin/blacklist
 * دریافت لیست کلمات سیاه با قابلیت فیلتر و صفحه‌بندی
 */
export async function listKeywords(req: Request, res: Response): Promise<void> {
  try {
    const {
      category,
      severity,
      search,
      page = "1",
      limit = "20",
      active,
    } = req.query;

    // ساخت فیلتر
    const filter: Record<string, any> = {};

    if (category && typeof category === "string") {
      filter.category = category;
    }

    if (severity && typeof severity === "string") {
      filter.severity = severity;
    }

    if (active !== undefined) {
      filter.isActive = active === "true";
    }

    if (search && typeof search === "string") {
      const normalizedSearch = normalizePersianText(search);
      filter.keyword = { $regex: normalizedSearch, $options: "i" };
    }

    // محاسبه صفحه‌بندی
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string, 10) || 20),
    );
    const skip = (pageNum - 1) * limitNum;

    // دریافت داده‌ها
    const [keywords, total] = await Promise.all([
      BlacklistKeyword.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("addedBy", "name email")
        .lean(),
      BlacklistKeyword.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: keywords,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("خطا در دریافت لیست سیاه:", error);
    res.status(500).json({
      success: false,
      message: "خطای سرور در دریافت لیست سیاه",
    });
  }
}

/**
 * DELETE /api/admin/blacklist/:id
 * حذف کلمه از لیست سیاه
 */
export async function deleteKeyword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    // اعتبارسنجی شناسه
    if (!id || id.length !== 24) {
      res.status(400).json({
        success: false,
        message: "شناسه نامعتبر است",
      });
      return;
    }

    const deleted = await BlacklistKeyword.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "کلمه سیاه یافت نشد",
      });
      return;
    }

    res.json({
      success: true,
      message: "کلمه سیاه با موفقیت حذف شد",
      data: { deletedId: id, keyword: deleted.keyword },
    });
  } catch (error) {
    console.error("خطا در حذف کلمه سیاه:", error);
    res.status(500).json({
      success: false,
      message: "خطای سرور در حذف کلمه سیاه",
    });
  }
}

/**
 * PUT /api/admin/blacklist/:id
 * بروزرسانی کلمه سیاه
 */
export async function updateKeyword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;
    const { keyword, category, severity, note, isActive } = req.body;

    // اعتبارسنجی شناسه
    if (!id || id.length !== 24) {
      res.status(400).json({
        success: false,
        message: "شناسه نامعتبر است",
      });
      return;
    }

    // ساخت آبجکت بروزرسانی
    const updateData: Record<string, any> = {};
    if (keyword !== undefined) {
      updateData.keyword = normalizePersianText(keyword.trim());
    }
    if (
      category !== undefined &&
      ["ethical", "political", "scam", "spam", "custom"].includes(category)
    ) {
      updateData.category = category;
    }
    if (
      severity !== undefined &&
      ["low", "medium", "high", "critical"].includes(severity)
    ) {
      updateData.severity = severity;
    }
    if (note !== undefined) {
      updateData.note = typeof note === "string" ? note.trim() : "";
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: "هیچ فیلدی برای بروزرسانی ارسال نشده",
      });
      return;
    }

    // بررسی تکراری نبودن کلمه جدید
    if (updateData.keyword) {
      const existing = await BlacklistKeyword.findOne({
        keyword: updateData.keyword,
        _id: { $ne: id },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: "این کلمه قبلاً در لیست سیاه وجود دارد",
        });
        return;
      }
    }

    const updated = await BlacklistKeyword.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        message: "کلمه سیاه یافت نشد",
      });
      return;
    }

    res.json({
      success: true,
      message: "کلمه سیاه با موفقیت بروزرسانی شد",
      data: updated,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "این کلمه قبلاً در لیست سیاه وجود دارد",
      });
      return;
    }

    console.error("خطا در بروزرسانی کلمه سیاه:", error);
    res.status(500).json({
      success: false,
      message: "خطای سرور در بروزرسانی کلمه سیاه",
    });
  }
}

/**
 * POST /api/admin/blacklist/check
 * بررسی متن در برابر لیست سیاه
 * مورد استفاده: قبل از انتشار آگهی، بررسی خودکار
 */
export async function checkText(req: Request, res: Response): Promise<void> {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: "متن الزامی است",
      });
      return;
    }

    // دریافت همه کلمات فعال
    const keywords = await BlacklistKeyword.find({ isActive: true }).lean();

    // بررسی متن
    const result = checkTextAgainstBlacklist(text, keywords);

    // بروزرسانی شمارنده تطبیق‌ها (بدون انتظار)
    if (result.flagged && result.matches.length > 0) {
      const matchedKeywords = result.matches.map((m) => m.keyword);

      BlacklistKeyword.updateMany(
        { keyword: { $in: matchedKeywords }, isActive: true },
        { $inc: { matchCount: 1 } },
      ).catch(() => {
        // خطا در بروزرسانی شمارنده مانع پاسخ‌دهی نمی‌شود
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("خطا در بررسی متن:", error);
    res.status(500).json({
      success: false,
      message: "خطای سرور در بررسی متن",
    });
  }
}

/**
 * GET /api/admin/blacklist/reports
 * گزارش آگهی‌های پرچم‌گذاری شده
 * آگهی‌هایی که با کلمات سیاه تطبیق داشته‌اند
 */
export async function getFlaggedAdsReport(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const category = String(req.query.category || "");
    const severity = String(req.query.severity || "");
    const startDate = String(req.query.startDate || "");
    const endDate = String(req.query.endDate || "");
    const page = String(req.query.page || "1");
    const limit = String(req.query.limit || "20");

    const filter: Record<string, any> = { moderationStatus: "flagged" };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // ✅ استفاده از Ad استاتیک
    const [ads, total] = await Promise.all([
      Ad.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "name phone")
        .lean(),
      Ad.countDocuments(filter),
    ]);

    const keywords = await BlacklistKeyword.find({ isActive: true }).lean();

    const flaggedAds = ads.map((ad: any) => {
      const fullText = `${ad.title || ""} ${ad.description || ""}`;

      let filteredKeywords = keywords;
      if (category)
        filteredKeywords = filteredKeywords.filter(
          (k) => k.category === category,
        );
      if (severity)
        filteredKeywords = filteredKeywords.filter(
          (k) => k.severity === severity,
        );

      const checkResult = checkTextAgainstBlacklist(fullText, filteredKeywords);

      return {
        _id: ad._id,
        title: ad.title,
        description: ad.description,
        userId: ad.userId,
        createdAt: ad.createdAt,
        matches: checkResult.matches,
        score: checkResult.score,
        flagged: checkResult.flagged,
      };
    });

    const filteredAds = flaggedAds.filter((ad) => ad.flagged);
    filteredAds.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: filteredAds,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredAds.length,
        totalPages: Math.ceil(filteredAds.length / limitNum),
      },
      summary: {
        total: filteredAds.length,
        criticalCount: filteredAds.filter((a) =>
          a.matches.some((m: any) => m.severity === "critical"),
        ).length,
        highCount: filteredAds.filter((a) =>
          a.matches.some((m: any) => m.severity === "high"),
        ).length,
        pendingReview: filteredAds.filter(
          (a) => (a as any).moderationStatus === "flagged",
        ).length,
      },
    });
  } catch (error) {
    console.error("خطا در دریافت گزارش آگهی‌ها:", error);
    res
      .status(500)
      .json({ success: false, message: "خطای سرور در دریافت گزارش" });
  }
}

/**
 * POST /api/admin/blacklist/bulk-approve-low
 * تایید دسته‌ای آگهی‌های کم‌شدت
 */
export async function bulkApproveLowSeverity(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    // ✅ کلید تکراری را با $and ترکیب کردیم
    const result = await Ad.updateMany(
      {
        moderationStatus: "flagged",
        $and: [
          { "flaggedKeywords.severity": { $in: ["low"] } },
          {
            "flaggedKeywords.severity": {
              $nin: ["medium", "high", "critical"],
            },
          },
        ],
      },
      { $set: { moderationStatus: "approved" } },
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} آگهی کم‌شدت تایید شد`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("خطا در تایید دسته‌ای:", error);
    res.status(500).json({ success: false, message: "خطای سرور" });
  }
}
/**
 * POST /api/admin/blacklist/bulk-reject-critical
 * رد دسته‌ای آگهی‌های بحرانی
 */
// ── تابع bulkRejectCritical اصلاح‌شده ──
export async function bulkRejectCritical(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await Ad.updateMany(
      { moderationStatus: "flagged", "flaggedKeywords.severity": "critical" },
      { $set: { moderationStatus: "rejected" } },
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} آگهی بحرانی رد شد`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("خطا در رد دسته‌ای:", error);
    res.status(500).json({ success: false, message: "خطای سرور" });
  }
}

// تابع setupBlacklistRoutes بدون تغییر باقی می‌ماند
export function setupBlacklistRoutes(router: import("express").Router): void {
  router.use("/api/admin/blacklist", requireAdmin);

  router.post("/api/admin/blacklist", addKeyword);
  router.get("/api/admin/blacklist", listKeywords);
  router.put("/api/admin/blacklist/:id", updateKeyword);
  router.delete("/api/admin/blacklist/:id", deleteKeyword);

  router.post("/api/admin/blacklist/check", checkText);
  router.get("/api/admin/blacklist/reports", getFlaggedAdsReport);

  router.post("/api/admin/blacklist/bulk-approve-low", bulkApproveLowSeverity);
  router.post("/api/admin/blacklist/bulk-reject-critical", bulkRejectCritical);
}
