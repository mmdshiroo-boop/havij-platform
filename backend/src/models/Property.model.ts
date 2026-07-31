import mongoose, { Schema, Document } from "mongoose";

export interface IProperty extends Document {
  title: string;
  description: string;
  price: number;
  priceType: "sale" | "rent" | "mortgage";
  propertyType: "apartment" | "villa" | "office" | "commercial" | "land";
  city: string;
  district?: string; // تفکیک محلات برای تحلیل هوش صنف
  address: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  area: number;
  rooms: number;
  yearBuilt: number;
  images: string[];
  views: number;
  status: "pending" | "active" | "sold" | "rejected";
  agentId?: mongoose.Types.ObjectId; // اختیاری برای آگهی‌های اسکرپ شده
  isScraped?: boolean;
  sourceUrl?: string; // یکتا برای جلوگیری از آگهی تکراری ربات
  agentName?: string;
  rejectReason?: string;
  categoryId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    priceType: {
      type: String,
      enum: ["sale", "rent", "mortgage"],
      default: "sale",
    },
    propertyType: {
      type: String,
      enum: ["apartment", "villa", "office", "commercial", "land"],
      default: "apartment",
    },
    city: { type: String, required: true, index: true }, // اضافه شدن ایندکس مستقیم
    district: { type: String, trim: true, index: true }, // اضافه شدن ایندکس مستقیم برای تحلیل بازار
    address: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        // 🔹 اصلاح باگ: اعتبارسنجی برای اینکه مطمئن شویم آرایه خالی یا ناقص ذخیره نمی‌شود و به ایندکس 2dsphere آسیب نمیزند
        validate: {
          validator: function (val: number[]) {
            if (!val || val.length === 0) return true; // اگر کلاً لوکیشن نبود مشکلی نیست
            return val.length === 2; // اما اگر بود، حتماً باید ۲ عضو داشته باشد [lng, lat]
          },
          message:
            "مختصات جغرافیایی باید شامل طول و عرض جغرافیایی [lng, lat] باشد.",
        },
      },
    },
    area: { type: Number, default: 0, min: 0 },
    rooms: { type: Number, default: 0, min: 0 },
    yearBuilt: { type: Number, default: 0 },
    images: [{ type: String }],
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "active", "sold", "rejected"],
      default: "pending",
    },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    isScraped: { type: Boolean, default: false },
    sourceUrl: { type: String, unique: true, sparse: true },
    agentName: { type: String },
    rejectReason: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
  },
  { timestamps: true },
);

// ==================== ایندکس‌ها ====================
// ۱. ایندکس نقشه و سیستم‌های جیو-اسپشیال
PropertySchema.index({ location: "2dsphere" });

// ۲. ایندکس‌های ترکیبی برای بهینه‌سازی کوئری‌های پنل کاربری و ادمین
PropertySchema.index({ agentId: 1, createdAt: -1 });
PropertySchema.index({ status: 1, createdAt: -1 });
PropertySchema.index({ categoryId: 1 });

// ۳. 🔹 ایندکس فوق‌العاده حیاتی برای متد getMarketAnalysis شما (سرعت Aggregate را بالا می‌برد)
PropertySchema.index({ city: 1, district: 1, status: 1 });

export const Property = mongoose.model<IProperty>("Property", PropertySchema);
