/**
 * bot.model.ts
 * مدل‌های مانگوس برای سیستم ربات‌های تلگرام، بله و آیتا
 * پلتفرم املاک ایرانی
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── نوع‌های شمارشی ───────────────────────────────────────────────────────────

/** پلتفرم‌های پشتیبانی‌شده */
export type BotPlatform = 'telegram' | 'bale' | 'aita';

/** جهت پیام */
export type MessageDirection = 'inbound' | 'outbound';

// ─── اینترفیس‌ها ───────────────────────────────────────────────────────────────

export interface IBotSubscriber extends Document {
  chatId: string;
  platform: BotPlatform;
  firstName?: string;
  lastName?: string;
  username?: string;
  isActive: boolean;
  lastActivity: Date;
  subscribedAt: Date;
  unsubscribedAt?: Date;
}

export interface IBotMessageLog extends Document {
  chatId: string;
  platform: BotPlatform;
  messageText: string;
  direction: MessageDirection;
  command?: string;
  createdAt: Date;
}

export interface IBotConfig extends Document {
  platform: BotPlatform;
  botToken: string;
  webhookUrl?: string;
  isActive: boolean;
  updatedAt: Date;
}

// ─── اسکیمای مشترک سنج (BotPlatform را تأیید می‌کند) ─────────────────────────

const botPlatformEnum: BotPlatform[] = ['telegram', 'bale', 'aita'];

// ─── BotSubscriber ────────────────────────────────────────────────────────────

const BotSubscriberSchema = new Schema<IBotSubscriber>(
  {
    chatId: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: botPlatformEnum,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    // برای جلوگیری از ثبت تکراری یک کاربر در یک پلتفرم
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ایندکس ترکیبی: هر کاربر فقط یک بار در هر پلتفرم
BotSubscriberSchema.index({ chatId: 1, platform: 1 }, { unique: true });
// ایندکس برای جستجوی سریع بر اساس پلتفرم
BotSubscriberSchema.index({ platform: 1, isActive: 1 });
// ایندکس برای آمار
BotSubscriberSchema.index({ lastActivity: -1 });

// ─── BotMessageLog ────────────────────────────────────────────────────────────

const BotMessageLogSchema = new Schema<IBotMessageLog>(
  {
    chatId: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: botPlatformEnum,
      required: true,
    },
    messageText: {
      type: String,
      required: true,
      trim: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'] as MessageDirection[],
      required: true,
    },
    command: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ایندکس‌های آماری
BotMessageLogSchema.index({ platform: 1, direction: 1, createdAt: -1 });
BotMessageLogSchema.index({ chatId: 1, platform: 1, createdAt: -1 });

// ─── BotConfig ────────────────────────────────────────────────────────────────

const BotConfigSchema = new Schema<IBotConfig>(
  {
    platform: {
      type: String,
      enum: botPlatformEnum,
      required: true,
      unique: true, // هر پلتفرم فقط یک تنظیم دارد
    },
    botToken: {
      type: String,
      required: true,
      trim: true,
    },
    webhookUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// ─── ساخت مدل‌ها ──────────────────────────────────────────────────────────────

/**
 * مدل اشتراک‌دهندگان ربات
 * هر کاربر که ربات را استارت زده در این مجموعه ذخیره می‌شود
 */
export const BotSubscriber: Model<IBotSubscriber> =
  mongoose.models.BotSubscriber ||
  mongoose.model<IBotSubscriber>('BotSubscriber', BotSubscriberSchema);

/**
 * مدل لاگ پیام‌های ربات
 * تمامی پیام‌های ورودی و خروجی برای تحلیل و آمار ثبت می‌شوند
 */
export const BotMessageLog: Model<IBotMessageLog> =
  mongoose.models.BotMessageLog ||
  mongoose.model<IBotMessageLog>('BotMessageLog', BotMessageLogSchema);

/**
 * مدل تنظیمات ربات
 * توکن و وب‌هوک هر پلتفرم در این مجموعه ذخیره می‌شود
 */
export const BotConfig: Model<IBotConfig> =
  mongoose.models.BotConfig ||
  mongoose.model<IBotConfig>('BotConfig', BotConfigSchema);