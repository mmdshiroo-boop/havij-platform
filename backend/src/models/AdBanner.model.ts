// models/AdBanner.model.ts
import mongoose, { Schema, Document } from "mongoose";

// تعریف انواع موقعیت‌های مجاز بنر در سیستم
export type BannerPosition =
  | "home_top"
  | "home_bottom"
  | "sidebar_top"
  | "sidebar_bottom"
  | "search_top"
  | "search_bottom";

// اینترفیس اصلی سند بنر تبلیغاتی برای TypeScript
export interface IAdBanner extends Document {
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string; // تصویر اختصاصی و بهینه برای دیوایس‌های موبایل
  linkUrl?: string; // لینکی که کاربر بعد از کلیک به آن هدایت می‌شود
  position: BannerPosition;
  priority: number; // اولویت نمایش (هرچه عدد کوچک‌تر باشد، زودتر نمایش داده می‌شود)
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  clicks: number; // شمارشگر تعداد کلیک‌ها
  views: number; // شمارشگر تعداد دفعات دیده شدن
  createdAt: Date;
  updatedAt: Date;
}

// ساخت اسکیما (Schema) برای مونگودی‌بی
const AdBannerSchema = new Schema<IAdBanner>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    mobileImageUrl: { type: String },
    linkUrl: { type: String },
    position: {
      type: String,
      enum: [
        "home_top",
        "home_bottom",
        "sidebar_top",
        "sidebar_bottom",
        "search_top",
        "search_bottom",
      ],
      required: true,
    },
    priority: { type: Number, default: 0 },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    clicks: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }, // اضافه کردن اتوماتیک فیلدهای createdAt و updatedAt
);

// ساخت ایندکس‌های ترکیبی (Compound Indexes) جهت افزایش فوق‌العاده سرعت کوئری‌های فیلتر و سورت
AdBannerSchema.index({ position: 1, isActive: 1, priority: 1 });
AdBannerSchema.index({ startDate: 1, endDate: 1 });

// میدل‌ویر سراسری (موقتاً کامنت شده تا در زمان تست دیتای قدیمی یا بدون تاریخ فیلتر نشود)
/*
AdBannerSchema.pre("find", function () {
  const now = new Date();
  this.where({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
});
*/

// خروجی گرفتن از مدل جهت استفاده در کنترلرها
export const AdBanner =
  mongoose.models.AdBanner ||
  mongoose.model<IAdBanner>("AdBanner", AdBannerSchema);
