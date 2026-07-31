// src/utils/queryHelpers.ts
import { ParsedQs } from "qs";

/**
 * تبدیل مقدار query به رشتهٔ امن
 * مشکل TypeScript با req.query.city و req.query.district را حل می‌کند
 */
export function getQueryStr(
  value: string | ParsedQs | (string | ParsedQs)[] | undefined,
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return String(value[0] || "");
  return "";
}
