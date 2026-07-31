// lib/jalali.ts
import { toJalaali, toGregorian } from "jalaali-js";

export function toJalali(gregorianDate: string | Date): string {
  const d = new Date(gregorianDate);
  const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
}

export function toJalaliDateTime(gregorianDate: string | Date): string {
  const d = new Date(gregorianDate);
  const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const time = d.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")} ${time}`;
}

export function jalaliToGregorian(jalaliDate: string): string {
  const parts = jalaliDate.split("/");
  if (parts.length !== 3) return "";
  const g = toGregorian(+parts[0], +parts[1], +parts[2]);
  return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
}
