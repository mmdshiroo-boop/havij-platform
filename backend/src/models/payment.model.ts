import mongoose, { Document, Schema, model } from "mongoose";

// ==================== تابع کمکی: تبدیل مبلغ به فرمت فارسی ====================
/**
 * فرمت کردن مبلغ به ریال با جداکننده‌های فارسی
 * مثال: 2500000 → "۲۵,۰۰۰,۰۰۰ ریال"
 */
export function formatAmountPersian(amountRial: number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const toPersian = (num: string) =>
    num.replace(/\d/g, (d) => persianDigits[parseInt(d)]);

  const toman = Math.floor(amountRial / 10);
  const formatted = toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${toPersian(formatted)} تومان`;
}

// ==================== اینترفیس‌ها ====================

export interface IPaymentMetadata {
  /** نوع خرید: vip, ad_boost, ad_renewal, listing_fee و ... */
  type?: string;
  /** شناسه مرتبط (مثلاً شناسه آگهی) */
  relatedId?: string;
  /** مدت زمان اشتراک (برای VIP) */
  duration?: number;
  /** تعداد آگهی ویژه (برای بسته‌های تبلیغاتی) */
  count?: number;
  [key: string]: any;
}

export interface IPayment extends Document {
  /** کاربر ایجادکننده پرداخت */
  user: mongoose.Types.ObjectId;
  /** مبلغ به ریال */
  amount: number;
  /** توضیحات پرداخت */
  description: string;
  /** درگاه پرداخت */
  gateway: "zarinpal" | "idpay" | "payir";
  /** وضعیت تراکنش */
  status:
    | "pending"
    | "processing"
    | "success"
    | "failed"
    | "refunded"
    | "expired"; // ✅ "refunded" اضافه شد
  /** شناسه تراکنش درگاه (Authority در زرین‌پال، id در آیدی‌پی، token در پی‌آی‌آر) */
  transactionId: string;
  /** کد اختیار درگاه */
  authorityCode: string;
  /** شماره مرجع تراکنش (پس از موفقیت) */
  refNumber: string;
  /** شماره کارت پرداخت‌کننده (فقط ۴ رقم آخر) */
  cardPan: string;
  /** شناسه سفارش مرتبط */
  orderId?: string;
  /** متادیتای انعطاف‌پذیر درباره خرید */
  metadata?: IPaymentMetadata;
  /** آدرس بازگشت پس از پرداخت */
  callbackUrl: string;
  /** آی‌پی کاربر */
  ip: string;
  /** تاریخ تایید پرداخت */
  verifiedAt?: Date;
  /** دلیل شکست تراکنش */
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== اسکیمای Mongoose ====================

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "کاربر الزامی است"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "مبلغ الزامی است"],
      min: [10000, "حداقل مبلغ پرداخت ۱۰,۰۰۰ ریال است"],
    },
    description: {
      type: String,
      required: [true, "توضیحات پرداخت الزامی است"],
      trim: true,
      maxlength: [500, "توضیحات نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"],
    },
    gateway: {
      type: String,
      enum: ["zarinpal", "idpay", "payir"],
      required: [true, "انتخاب درگاه پرداخت الزامی است"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "success",
        "failed",
        "refunded",
        "expired",
      ], // ✅ "refunded" اضافه شد
      default: "pending",
      required: true,
    },
    transactionId: {
      type: String,
      sparse: true,
      unique: true,
    },
    authorityCode: {
      type: String,
      index: true,
    },
    refNumber: {
      type: String,
    },
    cardPan: {
      type: String,
      set: (val: string) => {
        // ذخیره فقط ۴ رقم آخر کارت برای امنیت
        if (!val) return val;
        return val.replace(/\s/g, "").slice(-4);
      },
    },
    orderId: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    callbackUrl: {
      type: String,
      required: [true, "آدرس بازگشت الزامی است"],
    },
    ip: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    // غیرفعال کردن __v در خروجی JSON
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  },
);

// ==================== ایندکس‌های ترکیبی ====================

// ایندکس ترکیبی کاربر + وضعیت برای جستجوی سریع پرداخت‌های یک کاربر
paymentSchema.index({ user: 1, status: 1 });

// ایندکس ترکیبی gateway + status برای گزارش‌گیری ادمین
paymentSchema.index({ gateway: 1, status: 1 });

// ایندکس تاریخ ایجاد برای مرتب‌سازی و تحلیل
paymentSchema.index({ createdAt: -1 });

// ==================== مجازی‌ها (Virtuals) ====================

/**
 * مبلغ به تومان (برای نمایش به کاربر)
 * ریال را بر ۱۰ تقسیم می‌کند
 */
paymentSchema.virtual("amountToman").get(function (this: IPayment) {
  return Math.floor(this.amount / 10);
});

// ==================== متدهای استاتیک ====================

/**
 * یافتن پرداخت با کد اختیار و درگاه
 * برای جلوگیری از تداخل بین درگاه‌های مختلف
 */
paymentSchema.statics.findByAuthority = async function (
  authorityCode: string,
  gateway: "zarinpal" | "idpay" | "payir", // ✅ مطابق مدل
): Promise<IPayment | null> {
  return this.findOne({ authorityCode, gateway });
};
/**
 * بررسی وضعیت پرداخت و جلوگیری از تکرار
 * (Idempotency)
 */
paymentSchema.statics.isAlreadyProcessed = async function (
  authorityCode: string,
): Promise<boolean> {
  const payment = await this.findOne({
    authorityCode,
    status: { $in: ["success", "refunded"] },
  });
  return !!payment;
};

// ==================== تایپ‌های استاتیک ====================

export interface PaymentModel extends mongoose.Model<IPayment> {
  findByAuthority(
    authorityCode: string,
    gateway: string,
  ): Promise<IPayment | null>;
  isAlreadyProcessed(authorityCode: string): Promise<boolean>;
}

// ==================== ساخت و خروج مدل ====================

const Payment = model<IPayment, PaymentModel>("Payment", paymentSchema);

export default Payment;
