// backend/src/models/AuditLog.model.ts
import mongoose, { Schema, Document } from "mongoose";

export enum AuditAction {
  // کاربری
  USER_REGISTER = "USER_REGISTER",
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  USER_UPDATE_PROFILE = "USER_UPDATE_PROFILE",
  USER_CHANGE_PASSWORD = "USER_CHANGE_PASSWORD",

  // آگهی
  AD_CREATED = "AD_CREATED",
  AD_UPDATED = "AD_UPDATED",
  AD_DELETED = "AD_DELETED",
  AD_STATUS_CHANGED = "AD_STATUS_CHANGED", // approve, reject, suspend
  AD_VIEWED = "AD_VIEWED", // در صورت نیاز به لاگ بازدید
  ADMIN_DELETED = "ADMIN_DELETED",
  USER_DELETED = "USER_DELETED",
  // کیف پول و پرداخت
  WALLET_CHARGED = "WALLET_CHARGED",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_FAILED = "PAYMENT_FAILED",

  // اشتراک
  SUBSCRIPTION_PURCHASED = "SUBSCRIPTION_PURCHASED",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",

  // تیکت
  TICKET_CREATED = "TICKET_CREATED",
  TICKET_REPLIED = "TICKET_REPLIED",

  // گزارش تخلف
  REPORT_CREATED = "REPORT_CREATED",
  REPORT_RESOLVED = "REPORT_RESOLVED",

  // ادمین
  ADMIN_USER_BAN = "ADMIN_USER_BAN",
  ADMIN_USER_UNBAN = "ADMIN_USER_UNBAN",
  ADMIN_ROLE_CHANGE = "ADMIN_ROLE_CHANGE",

  // سایر
  SYSTEM = "SYSTEM",
}

export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId; // کاربری که عملیات را انجام داده (در صورت احراز هویت)
  action: AuditAction;
  resource: string; // مثلاً 'User', 'Ad', 'Wallet'
  resourceId?: string; // آی‌دی رکورد موردنظر
  description: string; // توضیح قابل خواندن برای انسان
  changes?: Record<string, any>; // مقادیر قبل و بعد (برای ویرایش‌ها)
  metadata?: Record<string, any>; // اطلاعات اضافی مثل شماره تراکنش
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(AuditAction),
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    changes: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // فقط createdAt را خودمان مدیریت می‌کنیم
  },
);

// ایندکس‌های ترکیبی برای گزارش‌گیری سریع
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
