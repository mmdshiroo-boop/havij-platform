import mongoose, { Document, Schema, Model, model } from "mongoose";

/**
 * ============================================
 * مدل‌های دیتابیس سیستم پیامک
 * ============================================
 * شامل دو مدل:
 * 1. SmsLog - لاگ ارسال پیامک‌ها
 * 2. SmsTemplate - قالب‌های پیامک از پیش تعریف شده
 */

// ─────────────────────────────────────────
// نوع‌های پیامک
// ─────────────────────────────────────────
export type SmsType =
  | "otp"
  | "notification"
  | "marketing"
  | "welcome"
  | "custom";

export interface ISmsTemplateData {
  name: string;
  key: string;
  content: string;
  type: SmsType;
  isActive: boolean;
  description?: string;
}

// ─────────────────────────────────────────
// وضعیت پیامک
// ─────────────────────────────────────────
export type SmsStatus = "pending" | "sent" | "delivered" | "failed";

// ─────────────────────────────────────────
// اینترفیس لاگ پیامک
// ─────────────────────────────────────────
export interface ISmsLog extends Document {
  /** شماره گیرنده */
  recipient: string;

  /** شماره فرستنده */
  sender: string;

  /** متن پیامک */
  message: string;

  /** نوع پیامک */
  type: SmsType;

  /** شناسه پیام از درگاه ملی پیامک */
  messageId: string | null;

  /** وضعیت ارسال */
  status: SmsStatus;

  /** هزینه پیامک (تعداد پیام) */
  cost: number;

  /** شناسه کاربر ادمین ارسال‌کننده */
  sentBy: mongoose.Types.ObjectId | null;

  /** ارائه‌دهنده سرویس (پیش‌فرض: ملی پیامک) */
  provider: string;

  /** زمان تحویل پیام */
  deliveredAt: Date | null;

  /** زمان ایجاد رکورد */
  createdAt: Date;
}

// ─────────────────────────────────────────
// اسکیمای لاگ پیامک
// ─────────────────────────────────────────
const SmsLogSchema = new Schema<ISmsLog>(
  {
    recipient: {
      type: String,
      required: [true, "شماره گیرنده الزامی است"],
      trim: true,
      index: true,
      // ذخیره شماره با پیشوند +98
      match: [/^\+98\d{10}$/, "فرمت شماره گیرنده نامعتبر است"],
    },

    sender: {
      type: String,
      required: [true, "شماره فرستنده الزامی است"],
      trim: true,
    },

    message: {
      type: String,
      required: [true, "متن پیامک الزامی است"],
      trim: true,
      maxlength: [1000, "متن پیامک نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد"],
    },

    type: {
      type: String,
      enum: {
        values: ["otp", "notification", "marketing", "welcome", "custom"],
        message: "نوع پیامک نامعتبر است",
      },
      required: [true, "نوع پیامک الزامی است"],
      index: true,
    },

    messageId: {
      type: String,
      default: null,
      index: true,
      // شناسه بازگشتی از درگاه ملی پیامک
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "sent", "delivered", "failed"],
        message: "وضعیت پیامک نامعتبر است",
      },
      default: "pending",
      required: true,
      index: true,
    },

    cost: {
      type: Number,
      default: 0,
      min: [0, "هزینه نمی‌تواند منفی باشد"],
    },

    sentBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    provider: {
      type: String,
      default: "meli_payamak",
      trim: true,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    // فعال‌سازی timestamp خودکار
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    // جمع‌آوری خودکار
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─────────────────────────────────────────
// ایندکس‌های ترکیبی برای جستجوی بهینه
// ─────────────────────────────────────────

// ایندکس ترکیبی نوع و وضعیت برای گزارش‌گیری
SmsLogSchema.index({ type: 1, status: 1 });

// ایندکس ترکیبی گیرنده و نوع برای جلوگیری از ارسال تکراری OTP
SmsLogSchema.index({ recipient: 1, type: 1, createdAt: -1 });

// ایندکس تاریخ ایجاد برای مرتب‌سازی و صفحه‌بندی
SmsLogSchema.index({ createdAt: -1 });

// ایندکس برای فیلتر بر اساس ارسال‌کننده
SmsLogSchema.index({ sentBy: 1, createdAt: -1 });

// ─────────────────────────────────────────
// مجازی‌ها (Virtuals)
// ─────────────────────────────────────────

/** نمایش فارسی نوع پیامک */
SmsLogSchema.virtual("typeLabel").get(function (this: ISmsLog): string {
  const labels: Record<SmsType, string> = {
    otp: "کد تأیید",
    notification: "اطلاع‌رسانی",
    marketing: "تبلیغاتی",
    welcome: "خوش‌آمدگویی",
    custom: "سفارشی",
  };
  return labels[this.type] || this.type;
});

/** نمایش فارسی وضعیت */
SmsLogSchema.virtual("statusLabel").get(function (this: ISmsLog): string {
  const labels: Record<SmsStatus, string> = {
    pending: "در انتظار ارسال",
    sent: "ارسال شده",
    delivered: "تحویل داده شده",
    failed: "ناموفق",
  };
  return labels[this.status] || this.status;
});

// ─────────────────────────────────────────
// اینترفیس قالب پیامک
// ─────────────────────────────────────────
export interface ISmsTemplate extends Document {
  /** نام نمایشی قالب */
  name: string;

  /** کلید یکتای قالب (مثلاً otp, welcome, ad_published) */
  key: string;

  /** محتوای قالب با متغیرهای {{variable}} */
  content: string;

  /** نوع پیامک */
  type: SmsType;

  /** آیا قالب فعال است */
  isActive: boolean;

  /** توضیحات قالب */
  description?: string;

  /** زمان ایجاد */
  createdAt: Date;

  /** زمان بروزرسانی */
  updatedAt: Date;
}

// ─────────────────────────────────────────
// اسکیمای قالب پیامک
// ─────────────────────────────────────────
const SmsTemplateSchema = new Schema<ISmsTemplate>(
  {
    name: {
      type: String,
      required: [true, "نام قالب الزامی است"],
      trim: true,
      maxlength: [100, "نام قالب نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"],
    },

    key: {
      type: String,
      required: [true, "کلید قالب الزامی است"],
      trim: true,
      unique: true,
      lowercase: true,
      maxlength: [50, "کلید قالب نمی‌تواند بیشتر از ۵۰ کاراکتر باشد"],
      match: [
        /^[a-z][a-z0-9_]*$/,
        "کلید قالب باید با حروف کوچک انگلیسی شروع شود و فقط حروف، اعداد و خط‌زیرین داشته باشد",
      ],
    },

    content: {
      type: String,
      required: [true, "محتوای قالب الزامی است"],
      trim: true,
      maxlength: [1000, "محتوای قالب نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد"],
    },

    type: {
      type: String,
      enum: {
        values: ["otp", "notification", "marketing", "welcome", "custom"],
        message: "نوع پیامک نامعتبر است",
      },
      required: [true, "نوع پیامک الزامی است"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "توضیحات نمی‌تواند بیشتر از ۳۰۰ کاراکتر باشد"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─────────────────────────────────────────
// قالب‌های پیش‌فرض
// ─────────────────────────────────────────

/** قالب‌های پیش‌فرض سیستم */
export const DEFAULT_TEMPLATES: ISmsTemplateData[] = [
  {
    name: "کد تأیید",
    key: "otp",
    content: "کد تایید شما: {{code}}\nسایت املاک\nمعتبر تا ۲ دقیقه",
    type: "otp",
    isActive: true,
    description: "ارسال کد تأیید برای ورود و ثبت‌نام",
  },
  {
    name: "خوش‌آمدگویی",
    key: "welcome",
    content: "{{name}} عزیز، به سایت املاک خوش آمدید!",
    type: "welcome",
    isActive: true,
    description: "پیامک خوش‌آمدگویی برای کاربران جدید",
  },
  {
    name: "انتشار آگهی",
    key: "ad_published",
    content: "آگهی شما «{{adTitle}}» منتشر شد.\n{{adUrl}}",
    type: "notification",
    isActive: true,
    description: "اطلاع‌رسانی انتشار آگهی به کاربر",
  },
  {
    name: "تأیید آگهی",
    key: "ad_approved",
    content: "آگهی شما «{{adTitle}}» تأیید و منتشر شد.\n{{adUrl}}",
    type: "notification",
    isActive: true,
    description: "اطلاع‌رسانی تأیید آگهی توسط ادمین",
  },
  {
    name: "رد آگهی",
    key: "ad_rejected",
    content: "آگهی شما «{{adTitle}}» تأیید نشد. لطفاً آگهی خود را ویرایش کنید.",
    type: "notification",
    isActive: true,
    description: "اطلاع‌رسانی رد آگهی توسط ادمین",
  },
  {
    name: "تمدید اشتراک",
    key: "subscription_renewal",
    content:
      "کاربر {{name}} عزیز، اشتراک ویژه شما به زودی منقضی می‌شود. لطفاً برای تمدید اقدام کنید.",
    type: "notification",
    isActive: true,
    description: "یادآوری تمدید اشتراک ویژه",
  },
  {
    name: "اعلان عمومی",
    key: "general_broadcast",
    content: "{{text}}",
    type: "marketing",
    isActive: true,
    description: "قالب عمومی برای ارسال پیامک انبوه",
  },
];

// ─────────────────────────────────────────
// متدهای استاتیک مدل لاگ پیامک
// ─────────────────────────────────────────

/**
 * دریافت آمار پیامک‌ها
 * شامل تعداد ارسال شده، موفق، ناموفق و هزینه کل
 */
SmsLogSchema.statics.getStats = async function (
  startDate?: Date,
  endDate?: Date,
): Promise<{
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  totalCost: number;
  byType: Record<string, number>;
}> {
  const matchStage: Record<string, any> = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  const stats = await this.aggregate([
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        sent: {
          $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
        },
        delivered: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        totalCost: { $sum: "$cost" },
      },
    },
  ]);

  // آمار بر اساس نوع
  const typeStats = await this.aggregate([
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
  ]);

  const byType: Record<string, number> = {};
  for (const ts of typeStats) {
    byType[ts._id] = ts.count;
  }

  return stats[0]
    ? {
        total: stats[0].total,
        sent: stats[0].sent,
        delivered: stats[0].delivered,
        failed: stats[0].failed,
        totalCost: stats[0].totalCost,
        byType,
      }
    : { total: 0, sent: 0, delivered: 0, failed: 0, totalCost: 0, byType: {} };
};

/**
 * بررسی محدودیت ارسال OTP برای یک شماره
 * جلوگیری از ارسال بیش از حد کد تأیید
 * @param recipient - شماره گیرنده
 * @param maxInMinute - حداکثر ارسال در یک دقیقه (پیش‌فرض: ۱)
 * @param maxInHour - حداکثر ارسال در یک ساعت (پیش‌فرض: ۵)
 */
SmsLogSchema.statics.checkOtpRateLimit = async function (
  recipient: string,
  maxInMinute: number = 1,
  maxInHour: number = 5,
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // بررسی ارسال در یک دقیقه اخیر
  const recentMinute = await this.countDocuments({
    recipient,
    type: "otp",
    createdAt: { $gte: oneMinuteAgo },
  });

  if (recentMinute >= maxInMinute) {
    return {
      allowed: false,
      reason: "لطفاً یک دقیقه صبر کنید و دوباره تلاش کنید",
    };
  }

  // بررسی ارسال در یک ساعت اخیر
  const recentHour = await this.countDocuments({
    recipient,
    type: "otp",
    createdAt: { $gte: oneHourAgo },
  });

  if (recentHour >= maxInHour) {
    return {
      allowed: false,
      reason:
        "تعداد درخواست کد تأیید بیش از حد مجاز است. لطفاً یک ساعت دیگر تلاش کنید",
    };
  }

  return { allowed: true };
};

// ─────────────────────────────────────────
// متدهای استاتیک مدل قالب پیامک
// ─────────────────────────────────────────

/**
 * دریافت قالب با کلید
 * فقط قالب‌های فعال را برمی‌گرداند
 * @param key - کلید قالب
 */
SmsTemplateSchema.statics.seedDefaults = async function (): Promise<number> {
  let createdCount = 0;

  for (const template of DEFAULT_TEMPLATES) {
    const exists = await this.findOne({ key: template.key }).exec();
    if (!exists) {
      await this.create(template); // اینجا می‌تواند plain object از نوع ISmsTemplateData بگیرد
      createdCount++;
    }
  }

  return createdCount;
};

/**
 * اعمال متغیرها به قالب
 * جایگذاری {{variable}} با مقادیر واقعی
 * @param templateContent - محتوای قالب
 * @param variables - متغیرها و مقادیر
 */
SmsTemplateSchema.statics.render = function (
  templateContent: string,
  variables: Record<string, string>,
): string {
  let rendered = templateContent;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return rendered;
};

/**
 * مقداردهی اولیه قالب‌های پیش‌فرض
 * قالب‌هایی که از قبل وجود ندارند را ایجاد می‌کند
 */
SmsTemplateSchema.statics.seedDefaults = async function (): Promise<number> {
  let createdCount = 0;

  for (const template of DEFAULT_TEMPLATES) {
    const exists = await this.findOne({ key: template.key }).exec();
    if (!exists) {
      await this.create(template);
      createdCount++;
    }
  }

  return createdCount;
};

// ─────────────────────────────────────────
// تعریف اینترفیس‌های متدهای استاتیک
// ─────────────────────────────────────────
export interface SmsLogModel extends Model<ISmsLog> {
  getStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    totalCost: number;
    byType: Record<string, number>;
  }>;
  checkOtpRateLimit(
    recipient: string,
    maxInMinute?: number,
    maxInHour?: number,
  ): Promise<{ allowed: boolean; reason?: string }>;
}

export interface SmsTemplateModel extends Model<ISmsTemplate> {
  findByKey(key: string): Promise<ISmsTemplate | null>;
  render(templateContent: string, variables: Record<string, string>): string;
  seedDefaults(): Promise<number>;
}

// ─────────────────────────────────────────
// ساخت و خروجی مدل‌ها
// ─────────────────────────────────────────
export const SmsLog = (mongoose.models.SmsLog ||
  model<ISmsLog, SmsLogModel>("SmsLog", SmsLogSchema)) as SmsLogModel;

export const SmsTemplate = (mongoose.models.SmsTemplate ||
  model<ISmsTemplate, SmsTemplateModel>(
    "SmsTemplate",
    SmsTemplateSchema,
  )) as SmsTemplateModel;

export default { SmsLog, SmsTemplate };
