// backend/src/services/adParser.service.ts
import { IAdditionalProperty } from "../models/Ad.model";

export class AdParserService {
  /**
   * متد اصلی نرمال‌سازی دیتای خام ورودی دیوار و شیپور برای ذخیره در دیتابیس
   */
  public static parse(rawInput: any, source: "divar" | "sheypoor"): any {
    const payload = rawInput.data || rawInput;

    // مقادیر اولیه و مشترک آگهی
    const result: any = {
      title: payload.title || "",
      description: payload.description || "",
      sourceType: source,
      rawData: rawInput,
      additionalProperties: [] as IAdditionalProperty[],
      images: payload.images || [],
      city: payload.city || rawInput.city || "نامشخص",
      district: payload.district || rawInput.district || "",
    };

    // ۱. هندل کردن و نرمال‌سازی قیمت
    result.price = this.extractNumericPrice(payload.price);
    if (
      payload.price === "توافقی" ||
      String(payload.price).includes("توافقی")
    ) {
      result.priceType = "negotiable";
      result.price = 0;
    } else {
      result.priceType = "fixed";
    }

    // ۲. پردازش بر اساس منبع آگهی
    if (source === "divar") {
      this.processDivar(payload, result);
    } else if (source === "sheypoor") {
      this.processSheypoor(payload, result);
    }

    return result;
  }

  /**
   * استخراج اطلاعات اختصاصی از ساختار JSON دیوار
   */
  private static processDivar(payload: any, result: any) {
    // ۱. استخراج متراژ، اتاق و سال ساخت از فیلدهای اصلی یا بخش widgets (در صورت وجود)
    if (payload.area) result.area = this.extractNumericPrice(payload.area);
    if (payload.rooms) result.rooms = this.extractNumericPrice(payload.rooms);
    if (payload.buildingAge)
      result.buildingAge = this.extractNumericPrice(payload.buildingAge);

    // ۲. پردازش ابزارک‌های داینامیک دیوار (قالب متداول ویجت‌های دیوار)
    if (payload.widgets && Array.isArray(payload.widgets)) {
      payload.widgets.forEach((widget: any) => {
        if (widget.widget_type === "DESC_ROW" && widget.data) {
          result.additionalProperties.push({
            name: widget.data.title || "ویژگی",
            value: widget.data.value || "",
          });
        }
      });
    }
    // پشتیبانی از ساختار کلید/مقدار ساده در لایه data
    else {
      const ignoreKeys = [
        "title",
        "description",
        "price",
        "images",
        "url",
        "token",
        "city",
        "district",
      ];
      Object.keys(payload).forEach((key) => {
        if (
          !ignoreKeys.includes(key) &&
          payload[key] !== null &&
          payload[key] !== undefined
        ) {
          result.additionalProperties.push({
            name: this.translateKey(key),
            value: String(payload[key]),
          });
        }
      });
    }
  }

  /**
   * استخراج اطلاعات اختصاصی از ساختار JSON شیپور
   */
  private static processSheypoor(payload: any, result: any) {
    if (payload.area) result.area = this.extractNumericPrice(payload.area);
    if (payload.rooms) result.rooms = this.extractNumericPrice(payload.rooms);

    // شیپور معمولاً مشخصات را در یک آبجکت تخت (Flat) یا آرایه‌ای از خصوصیات ارسال می‌کند
    if (payload.attributes && Array.isArray(payload.attributes)) {
      payload.attributes.forEach((attr: any) => {
        result.additionalProperties.push({
          name: attr.label || attr.name,
          value: String(attr.value),
        });
      });
    } else {
      const ignoreKeys = [
        "title",
        "description",
        "price",
        "images",
        "url",
        "id",
        "location",
        "filename",
        "extractedAt",
      ];
      Object.keys(payload).forEach((key) => {
        if (
          !ignoreKeys.includes(key) &&
          payload[key] !== null &&
          payload[key] !== undefined
        ) {
          result.additionalProperties.push({
            name: this.translateKey(key),
            value: String(payload[key]),
          });
        }
      });
    }
  }

  /**
   * تبدیل کلیدهای انگلیسی متداول به معادل فارسی (برای ساختارهای کلید/مقدار ساده)
   */
  private static translateKey(key: string): string {
    const translations: { [key: string]: string } = {
      area: "متراژ (متر مربع)",
      rooms: "تعداد اتاق",
      buildingAge: "سن بنا (سال)",
      yearBuilt: "سال ساخت",
      parking: "پارکینگ",
      elevator: "آسانسور",
      storage: "انباری",
      balcony: "بالکن",
      category: "دسته‌بندی",
      phone: "شماره تماس",
      kilometers: "کارکرد (کیلومتر)",
      color: "رنگ",
      gearbox: "گیربکس",
      brand: "برند/مدل",
    };
    return translations[key] || key;
  }

  private static extractNumericPrice(priceStr: any): number {
    if (!priceStr) return 0;
    if (typeof priceStr === "number") return priceStr;
    const englishDigits = this.toEnglishDigits(priceStr);
    const cleanNum = englishDigits.replace(/[^\d]/g, "");
    return parseInt(cleanNum) || 0;
  }

  private static toEnglishDigits(str: string): string {
    return String(str)
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
  }
}
