// backend/src/models/UserLocation.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUserLocation extends Document {
  userId?: mongoose.Types.ObjectId; // برای کاربران عضو (اختیاری)
  guestId?: string;                 // برای کاربران میهمان/ثبت‌نام نشده
  isGuest: boolean;                 // تشخیص سریع میهمان بودن
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  accuracy?: number;
  city?: string;
  province?: string;
  district?: string;
  address?: string;
  lastSeenAt: Date;
  isOnline: boolean;
  userAgent?: string;
  ip?: string;
}

const UserLocationSchema = new Schema<IUserLocation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestId: {
      type: String,
      default: null,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    accuracy: { type: Number, default: null },
    city: { type: String, default: "" },
    province: { type: String, default: "" },
    district: { type: String, default: "" },
    address: { type: String, default: "" },
    lastSeenAt: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

// ─── ایندکس‌گذاری‌های بهینه‌شده ───

// ۱. ایندکس جغرافیایی ۲D
UserLocationSchema.index({ location: "2dsphere" });

// ۲. ایندکس یکتا برای کاربران عضو (sparse باعث می‌شود مقادیر null باعث خطای تکراری نشوند)
UserLocationSchema.index(
  { userId: 1 },
  { unique: true, sparse: true }
);

// ۳. ایندکس یکتا برای میهمانان (جهت جلوگیری از ثبت تکراری یک میهمان)
UserLocationSchema.index(
  { guestId: 1 },
  { unique: true, sparse: true }
);

// ۴. ایندکس‌های جستجوی سریع پنل مدیریت
UserLocationSchema.index({ isGuest: 1 });
UserLocationSchema.index({ lastSeenAt: -1 });
UserLocationSchema.index({ isOnline: 1 });

export const UserLocation = mongoose.model<IUserLocation>(
  "UserLocation",
  UserLocationSchema
);