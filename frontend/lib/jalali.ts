// lib/jalali.ts
import { toJalaali, toGregorian, isValidJalaaliDate } from "jalaali-js";

/**
 * تبدیل تاریخ میلادی به شمسی (فقط تاریخ)
 * @example toJalali("2024-03-20") → "1403/01/01"
 */
export function toJalali(gregorianDate: string | Date): string {
  try {
    const d = new Date(gregorianDate);
    if (isNaN(d.getTime())) return "";
    const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

/**
 * تبدیل تاریخ میلادی به شمسی همراه با ساعت
 * @example toJalaliDateTime("2024-03-20T14:30:00") → "1403/01/01 14:30"
 */
export function toJalaliDateTime(gregorianDate: string | Date): string {
  try {
    const d = new Date(gregorianDate);
    if (isNaN(d.getTime())) return "";
    const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const time = d.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")} ${time}`;
  } catch {
    return "";
  }
}

/**
 * تبدیل تاریخ شمسی به میلادی (فرمت ISO)
 * @example jalaliToGregorian("1403/01/01") → "2024-03-20"
 */
export function jalaliToGregorian(jalaliDate: string): string {
  try {
    const parts = jalaliDate.split("/");
    if (parts.length !== 3) return "";
    const [jy, jm, jd] = parts.map(Number);
    if (!isValidJalaaliDate(jy, jm, jd)) return "";
    const g = toGregorian(jy, jm, jd);
    return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

/**
 * فرمت تاریخ شمسی به صورت خوانا
 * @example formatJalali("1403/01/01") → "۱ فروردین ۱۴۰۳"
 */
export function formatJalali(jalaliDate: string): string {
  try {
    const parts = jalaliDate.split("/");
    if (parts.length !== 3) return jalaliDate;
    const [jy, jm, jd] = parts.map(Number);
    if (!isValidJalaaliDate(jy, jm, jd)) return jalaliDate;
    
    const months = [
      "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
    
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    const toPersian = (n: number) => String(n).replace(/\d/g, d => persianDigits[+d]);
    
    return `${toPersian(jd)} ${months[jm - 1]} ${toPersian(jy)}`;
  } catch {
    return jalaliDate;
  }
}