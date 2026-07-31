/**
 * bot.service.ts
 * لایه سرویس سیستم ربات‌ها — ارسال پیام، مدیریت اشتراک، قالب‌بندی
 * پلتفرم املاک ایرانی
 */

import axios from "axios";
import {
  BotSubscriber,
  BotMessageLog,
  BotConfig,
  IBotSubscriber,
  IBotConfig,
  BotPlatform,
} from "../models/bot.model";

// ─── تایپ‌های کمکی ────────────────────────────────────────────────────────────

/** آگهی ساده‌شده برای نمایش در ربات */
export interface BotAdResult {
  _id: string;
  title: string;
  price: number;
  city: string;
  district?: string;
  area: number;
  rooms?: number;
  url: string;
  thumbnail?: string;
  slug?: string;
  adType?: string;
  [key: string]: any;
}

/** دکمه شیشه‌ای (اینلاین کیبورد) */
export interface BotButton {
  text: string;
  url?: string;
  callback_data?: string;
}

/** خروجی فرمت‌شده برای ارسال به کاربر */
export interface BotFormattedMessage {
  text: string;
  buttons?: BotButton[][];
  photoUrl?: string;
}

/** اطلاعات کاربر استخراج‌شده از آپدیت */
export interface BotUserInfo {
  chatId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

// ─── آدرس‌های API هر پلتفرم ─────────────────────────────────────────────────

const PLATFORM_API_URLS: Record<BotPlatform, string> = {
  telegram: "https://api.telegram.org/bot",
  bale: "https://tapi.bale.ai/bot",
  aita: "https://api.aita.ir/bot",
};

// ─── پیام‌های فارسی پیش‌فرض ──────────────────────────────────────────────────

const PERSIAN_MESSAGES = {
  welcome:
    "🏠 به ربات جستجوی املاک خوش آمدید!\n\n" +
    "با من می‌توانید آگهی‌های املاک را جستجو کنید.\n\n" +
    "📋 دستورات:\n" +
    "/search [کلمه] — جستجوی آگهی\n" +
    "/categories — مشاهده دسته‌بندی‌ها\n" +
    "/ad [شناسه] — جزئیات آگهی\n" +
    "/help — راهنما\n" +
    "/contact — ارتباط با ما",
  help:
    "📖 راهنمای استفاده:\n\n" +
    "🔍 جستجو:\n" +
    "  /search آپارتمان تهران\n" +
    "  /search ویلایی شمال\n\n" +
    "📄 جزئیات آگهی:\n" +
    "  /ad 6507a1b2c3d4e5f6a7b8c9d0\n\n" +
    "📂 دسته‌بندی‌ها:\n" +
    "  /categories\n\n" +
    "📞 ارتباط با ما:\n" +
    "  /contact",
  categories:
    "📂 دسته‌بندی آگهی‌ها:\n\n" +
    "🏠 آپارتمان\n" +
    "🏡 ویلایی\n" +
    "🏢 تجاری و اداری\n" +
    "🏭 انبار و کارگاه\n" +
    "🌾 زمین و کلنگی\n" +
    "🏨 سوئیت و هتل آپارتمان",
  contact:
    "📞 ارتباط با ما:\n\n" +
    "🌐 وب‌سایت: https://melk-site.com\n" +
    "📧 ایمیل: support@melk-site.com\n" +
    "📱 تلفن: ۰۲۱-۱۲۳۴۵۶۷۸",
  noResults: "❌ نتیجه‌ای یافت نشد. لطفاً عبارت دیگری را جستجو کنید.",
  error: "⚠️ خطایی رخ داد. لطفاً دوباره تلاش کنید.",
  notFound: "❌ آگهی مورد نظر یافت نشد.",
};

// ─── کلاس سرویس ──────────────────────────────────────────────────────────────

export class BotService {
  // ─── ارسال پیام متنی ─────────────────────────────────────────────────────

  /**
   * ارسال پیام متنی به کاربر در پلتفرم مشخص‌شده
   * @param chatId شناسه چت
   * @param text متن پیام
   * @param platform پلتفرم مقصد
   * @param options دکمه‌ها و تنظیمات اضافی
   */
  async sendMessage(
    chatId: string,
    text: string,
    platform: BotPlatform,
    options?: {
      buttons?: BotButton[][];
      parseMode?: string;
      disableWebPagePreview?: boolean;
    },
  ): Promise<boolean> {
    try {
      const config = await this.getConfig(platform);
      if (!config || !config.isActive) {
        console.error(`[BotService] تنظیمات ${platform} فعال نیست`);
        return false;
      }

      const apiUrl = `${PLATFORM_API_URLS[platform]}${config.botToken}/sendMessage`;
      const payload: Record<string, any> = {
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode || "HTML",
        disable_web_page_preview: options?.disableWebPagePreview ?? true,
      };

      // ساخت اینلاین کیبورد اگر دکمه‌ای وجود داشته باشد
      if (options?.buttons && options.buttons.length > 0) {
        payload.reply_markup = {
          inline_keyboard: options.buttons,
        };
      }

      const response = await axios.post(apiUrl, payload, {
        timeout: 10_000,
      });

      // ثبت لاگ خروجی
      await this.logMessage(chatId, platform, text, "outbound").catch(() => {});

      return response.status === 200;
    } catch (error: any) {
      console.error(
        `[BotService] خطا در ارسال پیام به ${platform}:`,
        error?.response?.data || error.message,
      );
      return false;
    }
  }

  // ─── ارسال عکس با کپشن ──────────────────────────────────────────────────

  /**
   * ارسال تصویر همراه با کپشن
   * @param chatId شناسه چت
   * @param photoUrl آدرس تصویر
   * @param caption کپشن تصویر
   * @param platform پلتفرم
   */
  async sendPhoto(
    chatId: string,
    photoUrl: string,
    caption: string,
    platform: BotPlatform,
  ): Promise<boolean> {
    try {
      const config = await this.getConfig(platform);
      if (!config || !config.isActive) {
        console.error(`[BotService] تنظیمات ${platform} فعال نیست`);
        return false;
      }

      const apiUrl = `${PLATFORM_API_URLS[platform]}${config.botToken}/sendPhoto`;
      const payload: Record<string, any> = {
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: "HTML",
      };

      const response = await axios.post(apiUrl, payload, {
        timeout: 15_000,
      });

      // ثبت لاگ خروجی
      await this.logMessage(chatId, platform, caption, "outbound").catch(
        () => {},
      );

      return response.status === 200;
    } catch (error: any) {
      console.error(
        `[BotService] خطا در ارسال عکس به ${platform}:`,
        error?.response?.data || error.message,
      );
      return false;
    }
  }

  // ─── ارسال کارت آگهی ────────────────────────────────────────────────────

  /**
   * ارسال آگهی به‌صورت کارت قالب‌بندی‌شده (عکس + متن + دکمه)
   * @param chatId شناسه چت
   * @param ad اطلاعات آگهی
   * @param platform پلتفرم
   */
  async sendAdCard(
    chatId: string,
    ad: BotAdResult,
    platform: BotPlatform,
  ): Promise<boolean> {
    try {
      const message = this.buildAdMessage(ad);

      // اگر تصویر وجود داشت، عکس + کپشن ارسال می‌شود
      if (ad.thumbnail) {
        return await this.sendPhoto(
          chatId,
          ad.thumbnail,
          message.text,
          platform,
        );
      }

      // در غیر این صورت فقط متن با دکمه لینک
      return await this.sendMessage(chatId, message.text, platform, {
        buttons: message.buttons,
      });
    } catch (error) {
      console.error("[BotService] خطا در ارسال کارت آگهی:", error);
      return false;
    }
  }

  // ─── مدیریت اشتراک‌دهندگان ──────────────────────────────────────────────

  /**
   * ثبت کاربر جدید یا به‌روزرسانی فعالیت کاربر موجود
   * اگر قبلاً لغو اشتراک شده باشد، دوباره فعال می‌شود
   */
  async registerSubscriber(
    chatId: string,
    platform: BotPlatform,
    userInfo?: Partial<BotUserInfo>,
  ): Promise<IBotSubscriber> {
    const existing = await BotSubscriber.findOne({
      chatId,
      platform,
    });

    if (existing) {
      // فعال‌سازی مجدد و به‌روزرسانی فعالیت
      existing.isActive = true;
      existing.lastActivity = new Date();
      existing.unsubscribedAt = undefined;
      if (userInfo?.firstName) existing.firstName = userInfo.firstName;
      if (userInfo?.lastName) existing.lastName = userInfo.lastName;
      if (userInfo?.username) existing.username = userInfo.username;
      return await existing.save();
    }

    // ایجاد اشتراک جدید
    const subscriber = await BotSubscriber.create({
      chatId,
      platform,
      firstName: userInfo?.firstName,
      lastName: userInfo?.lastName,
      username: userInfo?.username,
      isActive: true,
      lastActivity: new Date(),
    });

    return subscriber;
  }

  /**
   * لغو اشتراک کاربر
   */
  async unregisterSubscriber(
    chatId: string,
    platform: BotPlatform,
  ): Promise<boolean> {
    try {
      const result = await BotSubscriber.updateOne(
        { chatId, platform },
        {
          isActive: false,
          unsubscribedAt: new Date(),
        },
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("[BotService] خطا در لغو اشتراک:", error);
      return false;
    }
  }

  /**
   * بررسی وضعیت اشتراک کاربر
   */
  async getSubscriber(
    chatId: string,
    platform: BotPlatform,
  ): Promise<IBotSubscriber | null> {
    return await BotSubscriber.findOne({ chatId, platform, isActive: true });
  }

  /**
   * دریافت لیست اشتراک‌دهندگان فعال یک پلتفرم
   */
  async getActiveSubscribers(
    platform?: BotPlatform,
  ): Promise<IBotSubscriber[]> {
    const filter: Record<string, any> = { isActive: true };
    if (platform) filter.platform = platform;
    return await BotSubscriber.find(filter).sort({ lastActivity: -1 });
  }

  // ─── تنظیمات ربات ───────────────────────────────────────────────────────

  /**
   * دریافت تنظیمات یک پلتفرم
   */
  async getConfig(platform: BotPlatform): Promise<IBotConfig | null> {
    return await BotConfig.findOne({ platform });
  }

  /**
   * ذخیره یا به‌روزرسانی تنظیمات ربات
   */
  async upsertConfig(
    platform: BotPlatform,
    data: { botToken: string; webhookUrl?: string; isActive?: boolean },
  ): Promise<IBotConfig> {
    const updated = await BotConfig.findOneAndUpdate(
      { platform },
      {
        botToken: data.botToken,
        webhookUrl: data.webhookUrl,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    );
    return updated;
  }

  /**
   * تنظیم وب‌هوک در پلتفرم هدف
   */
  async setWebhook(platform: BotPlatform): Promise<boolean> {
    try {
      const config = await this.getConfig(platform);
      if (!config || !config.webhookUrl) {
        console.error(`[BotService] وب‌هوک ${platform} تنظیم نشده`);
        return false;
      }

      const apiUrl = `${PLATFORM_API_URLS[platform]}${config.botToken}/setWebhook`;
      const response = await axios.post(apiUrl, {
        url: config.webhookUrl,
      });

      return response.data?.ok === true || response.status === 200;
    } catch (error: any) {
      console.error(
        `[BotService] خطا در تنظیم وب‌هوک ${platform}:`,
        error?.response?.data || error.message,
      );
      return false;
    }
  }

  // ─── لاگ پیام‌ها ────────────────────────────────────────────────────────

  /**
   * ثبت لاگ یک پیام (ورودی یا خروجی)
   */
  async logMessage(
    chatId: string,
    platform: BotPlatform,
    messageText: string,
    direction: "inbound" | "outbound",
    command?: string,
  ): Promise<void> {
    try {
      // محدودیت طول متن لاگ
      const truncatedText =
        messageText.length > 2000
          ? messageText.substring(0, 2000) + "..."
          : messageText;

      await BotMessageLog.create({
        chatId,
        platform,
        messageText: truncatedText,
        direction,
        command: command || undefined,
      });
    } catch (error) {
      // خطای لاگ نباید جریان اصلی را مختل کند
      console.error("[BotService] خطا در ثبت لاگ پیام:", error);
    }
  }

  // ─── آمار ───────────────────────────────────────────────────────────────

  /**
   * دریافت آمار استفاده از ربات‌ها
   */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // تعداد کل اشتراک‌دهندگان فعال
    const totalSubscribers = await BotSubscriber.countDocuments({
      isActive: true,
    });

    // تعداد اشتراک‌دهندگان هر پلتفرم
    const subscribersByPlatform = await BotSubscriber.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$platform", count: { $sum: 1 } } },
    ]);

    // پیام‌های امروز
    const todayMessages = await BotMessageLog.countDocuments({
      createdAt: { $gte: today },
    });

    // پیام‌های ورودی/خروجی امروز
    const todayInbound = await BotMessageLog.countDocuments({
      createdAt: { $gte: today },
      direction: "inbound",
    });
    const todayOutbound = await BotMessageLog.countDocuments({
      createdAt: { $gte: today },
      direction: "outbound",
    });

    // کل پیام‌ها
    const totalMessages = await BotMessageLog.countDocuments();
    const totalInbound = await BotMessageLog.countDocuments({
      direction: "inbound",
    });
    const totalOutbound = await BotMessageLog.countDocuments({
      direction: "outbound",
    });

    // محبوب‌ترین دستورات
    const topCommands = await BotMessageLog.aggregate([
      { $match: { command: { $exists: true, $ne: null } } },
      { $group: { _id: "$command", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // کاربران فعال (فعالیت در ۷ روز اخیر)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsersLast7Days = await BotSubscriber.countDocuments({
      isActive: true,
      lastActivity: { $gte: sevenDaysAgo },
    });

    return {
      totalSubscribers,
      subscribersByPlatform: subscribersByPlatform.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      today: {
        messages: todayMessages,
        inbound: todayInbound,
        outbound: todayOutbound,
      },
      total: {
        messages: totalMessages,
        inbound: totalInbound,
        outbound: totalOutbound,
      },
      topCommands,
      activeUsersLast7Days,
    };
  }

  // ─── ساخت پیام فارسی آگهی ──────────────────────────────────────────────

  /**
   * ساخت متن فارسی کارت آگهی
   * @param ad اطلاعات آگهی
   * @returns متن قالب‌بندی‌شده + دکمه‌های اینلاین
   */
  buildAdMessage(ad: BotAdResult): BotFormattedMessage {
    // فرمت قیمت به فارسی
    const priceText = this.formatPrice(ad.price);

    // ساخت متن
    const text =
      `🏠 <b>${this.escapeHtml(ad.title)}</b>\n` +
      `💰 قیمت: ${priceText}\n` +
      `📍 ${this.escapeHtml(ad.city)}${ad.district ? ` - ${this.escapeHtml(ad.district)}` : ""}\n` +
      `📐 متراژ: ${ad.area} متر${ad.rooms ? ` | اتاق: ${ad.rooms}` : ""}\n` +
      `🔗 <a href="${ad.url}">مشاهده آگهی</a>`;

    // دکمه‌های اینلاین
    const buttons: BotButton[][] = [
      [
        {
          text: "🌐 مشاهده در وب‌سایت",
          url: ad.url,
        },
      ],
    ];

    return { text, buttons };
  }

  /**
   * ساخت پیام نتایج جستجو
   * حداکثر ۱۰ نتیجه و دکمه‌های صفحهبندی
   */
  buildSearchResultsMessage(
    ads: BotAdResult[],
    query: string,
    page: number,
    totalPages: number,
  ): BotFormattedMessage {
    if (ads.length === 0) {
      return { text: PERSIAN_MESSAGES.noResults };
    }

    // ساخت لیست نتایج
    const lines = ads.map((ad, index) => {
      const priceText = this.formatPrice(ad.price);
      const num = (page - 1) * 10 + index + 1;
      return (
        `${num}. <b>${this.escapeHtml(ad.title)}</b>\n` +
        `   💰 ${priceText} | 📍 ${this.escapeHtml(ad.city)}${ad.district ? ` - ${this.escapeHtml(ad.district)}` : ""}\n` +
        `   📐 ${ad.area} متر${ad.rooms ? ` | ${ad.rooms} اتاق` : ""}`
      );
    });

    const header =
      `🔍 نتایج جستجوی «${this.escapeHtml(query)}»\n` +
      `📄 صفحه ${page} از ${totalPages}\n` +
      `───────────────────\n`;

    const footer =
      `\n───────────────────\n` + `برای مشاهده جزئیات:\n` + `/ad [شناسه آگهی]`;

    const text = header + lines.join("\n\n") + footer;

    // دکمه‌های صفحهبندی
    const buttons: BotButton[][] = [];

    if (totalPages > 1) {
      const paginationRow: BotButton[] = [];
      if (page > 1) {
        paginationRow.push({
          text: "◀️ قبلی",
          callback_data: `search:${query}:page:${page - 1}`,
        });
      }
      paginationRow.push({
        text: `${page} / ${totalPages}`,
        callback_data: "search:noop",
      });
      if (page < totalPages) {
        paginationRow.push({
          text: "▶️ بعدی",
          callback_data: `search:${query}:page:${page + 1}`,
        });
      }
      buttons.push(paginationRow);
    }

    return { text, buttons: buttons.length > 0 ? buttons : undefined };
  }

  // ─── متدهای کمکی ───────────────────────────────────────────────────────

  /**
   * فرمت قیمت به فارسی
   * مقادیر بزرگتر از ۱ میلیارد به میلیارد و بقیه به تومان نمایش داده می‌شوند
   */
  private formatPrice(price: number): string {
    if (!price || price <= 0) return "توافقی";
    if (price >= 1_000_000_000) {
      const billions = price / 1_000_000_000;
      return `${billions.toFixed(billions % 1 === 0 ? 0 : 1)} میلیارد تومان`;
    }
    if (price >= 1_000_000) {
      const millions = price / 1_000_000;
      return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} میلیون تومان`;
    }
    return `${price.toLocaleString("fa-IR")} تومان`;
  }

  /**
   * فرار کاراکترهای HTML برای جلوگیری از مشکل در parse_mode
   */
  private escapeHtml(text: string): string {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

// ─── نمونه Singleton ──────────────────────────────────────────────────────────

export const botService = new BotService();
