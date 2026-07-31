import type { CookieAuditLog } from "@/types";

// ─── ۱. تبدیل اعداد فارسی/عربی به انگلیسی ───
export function toEnglishDigits(str: string): string {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
}

// ─── ۲. تبدیل تاریخ میلادی/ISO به رشته تاریخ شمسی (مثلاً: 1403/05/12) ───
export function toJalaliDateString(dateInput: string | Date): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value || "";
  const month = parts.find((p) => p.type === "month")?.value || "";
  const day = parts.find((p) => p.type === "day")?.value || "";

  return `${year}/${month}/${day}`;
}

// ─── ۳. الگوریتم تبدیل تاریخ شمسی به میلادی (جهت مقایسه دقیق بازه زمانی) ───
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  let sal_a, gy, gm, gd, days;
  jy += 1595;
  days =
    -355 +
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  gd = days + 1;
  sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
  return new Date(gy, gm - 1, gd);
}

// تبدیل ورودی متنی شمسی (مانند "1403/05/01") به شیء Date
export function parseJalaliStringToDate(
  jalaliStr: string,
  isEndOfDay: boolean = false,
): Date | null {
  if (!jalaliStr) return null;
  const cleanStr = toEnglishDigits(jalaliStr).trim();
  const parts = cleanStr.split(/[\/\-\.]/).map(Number);

  if (parts.length < 3 || parts.some(isNaN)) return null;

  const [jy, jm, jd] = parts;
  const date = jalaliToGregorian(jy, jm, jd);

  if (isEndOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

// ─── ۴. انواعی از فیلترهای سریع (Presets) ───
export type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last7Days"
  | "last30Days"
  | "thisMonth";

export function getDateRangeFromPreset(preset: DatePreset): {
  startDate?: Date;
  endDate?: Date;
} {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  switch (preset) {
    case "today":
      return { startDate: todayStart, endDate: todayEnd };

    case "yesterday": {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return { startDate: yStart, endDate: yEnd };
    }

    case "last7Days": {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: todayEnd };
    }

    case "last30Days": {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: todayEnd };
    }

    case "thisMonth": {
      // محاسبه شروع ماه شمسی جاری
      const jalaliToday = toJalaliDateString(now); // مثلاً 1403/05/22
      const [jy, jm] = toEnglishDigits(jalaliToday).split("/").map(Number);
      const monthStart = jalaliToGregorian(jy, jm, 1);
      monthStart.setHours(0, 0, 0, 0);
      return { startDate: monthStart, endDate: todayEnd };
    }

    case "all":
    default:
      return {};
  }
}

// ─── ۵. تابع اصلی فیلتر و جستجوی هوشمند ───
export interface FilterOptions {
  searchTerm?: string; // عبارت عمومی برای جستجو (نام، IP، تاریخ و...)
  startDateFa?: string; // تاریخ شمسی شروع (مثلا "1403/05/01")
  endDateFa?: string; // تاریخ شمسی پایان (مثلا "1403/05/31")
  preset?: DatePreset; // فیلتر سریع (امروز، این ماه و...)
  eventType?: string; // نوع رویداد (login, cookie_set و...)
  status?: string; // وضعیت (success, failed و...)
}

export function filterAuditLogs(
  logs: CookieAuditLog[],
  options: FilterOptions,
): CookieAuditLog[] {
  if (!logs || logs.length === 0) return [];

  // تنظیم بازه زمانی بر اساس Preset یا تاریخ‌های دستی
  let filterStart: Date | null = null;
  let filterEnd: Date | null = null;

  if (options.preset && options.preset !== "all") {
    const range = getDateRangeFromPreset(options.preset);
    filterStart = range.startDate || null;
    filterEnd = range.endDate || null;
  } else {
    if (options.startDateFa) {
      filterStart = parseJalaliStringToDate(options.startDateFa, false);
    }
    if (options.endDateFa) {
      filterEnd = parseJalaliStringToDate(options.endDateFa, true);
    }
  }

  // نرمال‌سازی عبارت جستجو
  const search = options.searchTerm
    ? toEnglishDigits(options.searchTerm.trim()).toLowerCase()
    : "";

  return logs.filter((log) => {
    const logDate = new Date(log.createdAt);

    // ۱. فیلتر بازه زمانی (تاریخ)
    if (filterStart && logDate < filterStart) return false;
    if (filterEnd && logDate > filterEnd) return false;

    // ۲. فیلتر نوع رویداد و وضعیت
    if (options.eventType && log.type !== options.eventType) return false;
    if (options.status && log.status !== options.status) return false;

    // ۳. جستجوی متنی هوشمند (در تمام فیلدها + تاریخ شمسی)
    if (search) {
      const jalaliStr = toJalaliDateString(log.createdAt); // مثلاً 1403/05/12
      const fullName = log.userId
        ? `${log.userId.firstName || ""} ${log.userId.lastName || ""}`.toLowerCase()
        : "";
      const phone = log.userId?.phone || "";
      const email = log.userId?.email?.toLowerCase() || "";
      const ip = log.ip || "";
      const cookieName = log.cookieName?.toLowerCase() || "";
      const sessionId = log.sessionId?.toLowerCase() || "";

      const matchesText =
        fullName.includes(search) ||
        phone.includes(search) ||
        email.includes(search) ||
        ip.includes(search) ||
        cookieName.includes(search) ||
        sessionId.includes(search) ||
        jalaliStr.includes(search); // جستجوی مستقیم در تاریخ شمسی

      if (!matchesText) return false;
    }

    return true;
  });
}
