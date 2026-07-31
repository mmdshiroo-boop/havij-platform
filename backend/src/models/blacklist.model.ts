import mongoose, { Document, Schema, Model, model } from 'mongoose';

// ──────────────────────────────────────────────
// 🇮🇷 مدل لیست سیاه کلمات کلیدی - سیستم نظارت بر آگهی‌ها
// ──────────────────────────────────────────────

/** دسته‌بندی‌های مجاز برای کلمات سیاه */
export type BlacklistCategory = 'ethical' | 'political' | 'scam' | 'spam' | 'custom';

/** سطوح شدت کلمه سیاه */
export type BlacklistSeverity = 'low' | 'medium' | 'high' | 'critical';

/** برچسب‌های فارسی دسته‌بندی‌ها */
export const CATEGORY_LABELS: Record<BlacklistCategory, string> = {
  ethical: 'اخلاقی',
  political: 'سیاسی',
  scam: 'کلاهبرداری',
  spam: 'هرزنامه',
  custom: 'سفارشی',
};

/** برچسب‌های فارسی سطوح شدت */
export const SEVERITY_LABELS: Record<BlacklistSeverity, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
};

/** وزن امتیاز هر سطح شدت (برای محاسبه نمره ریسک) */
export const SEVERITY_WEIGHTS: Record<BlacklistSeverity, number> = {
  low: 10,
  medium: 25,
  high: 50,
  critical: 80,
};

/** رنگ‌های مرتبط با هر سطح شدت */
export const SEVERITY_COLORS: Record<BlacklistSeverity, string> = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
};

/** رابط TypeScript برای سند لیست سیاه */
export interface IBlacklistKeyword extends Document {
  /** کلمه یا عبارت کلیدی */
  keyword: string;
  /** دسته‌بندی کلمه */
  category: BlacklistCategory;
  /** سطح شدت */
  severity: BlacklistSeverity;
  /** توضیحات اختیاری ادمین */
  note: string;
  /** شناسه کاربری که کلمه را اضافه کرده */
  addedBy: mongoose.Types.ObjectId | string;
  /** تعداد دفعاتی که این کلمه در آگهی‌ها پیدا شده */
  matchCount: number;
  /** آیا کلمه فعال است؟ (می‌توان بدون حذف غیرفعالش کرد) */
  isActive: boolean;
  /** تاریخ ایجاد */
  createdAt: Date;
  /** تاریخ بروزرسانی */
  updatedAt: Date;
}

/** شمای Mongoose برای لیست سیاه */
const BlacklistKeywordSchema = new Schema<IBlacklistKeyword>(
  {
    keyword: {
      type: String,
      required: [true, 'کلمه کلیدی الزامی است'],
      trim: true,
      unique: true,
      index: true,
      // حداکثر طول عبارت
      maxlength: [200, 'کلمه کلیدی نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'],
    },
    category: {
      type: String,
      enum: {
        values: ['ethical', 'political', 'scam', 'spam', 'custom'],
        message: 'دسته‌بندی باید یکی از مقادیر ethical, political, scam, spam, custom باشد',
      },
      required: [true, 'دسته‌بندی الزامی است'],
      index: true,
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'سطح شدت باید یکی از مقادیر low, medium, high, critical باشد',
      },
      required: [true, 'سطح شدت الزامی است'],
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'توضیحات نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد'],
      default: '',
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'شناسه اضافه‌کننده الزامی است'],
    },
    matchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    // فعال‌سازی خودکار timestamp
    timestamps: true,
    // تبدیل JSON به Persian-friendly
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // حذف فیلدهای حساس از خروجی
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ──────────────────────────────────────────────
// ایندکس‌های ترکیبی برای جستجوی بهینه
// ──────────────────────────────────────────────

// ایندکس ترکیبی: دسته‌بندی + وضعیت فعال (برای فیلترینگ سریع)
BlacklistKeywordSchema.index({ category: 1, isActive: 1 });

// ایندکس ترکیبی: شدت + وضعیت فعال (برای گزارش‌گیری)
BlacklistKeywordSchema.index({ severity: 1, isActive: 1 });

// ایندکس متن کامل برای جستجوی فازی
BlacklistKeywordSchema.index({ keyword: 'text' });

/** مدل Mongoose نهایی */
const BlacklistKeyword: Model<IBlacklistKeyword> =
  mongoose.models.BlacklistKeyword || model<IBlacklistKeyword>('BlacklistKeyword', BlacklistKeywordSchema);

export default BlacklistKeyword;