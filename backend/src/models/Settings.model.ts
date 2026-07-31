// backend/src/models/Settings.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialLinks: {
    telegram: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  adApprovalRequired: boolean;
  maxAdImages: number;
  defaultAdDuration: number;
  vipAdPrice: number;
  enableSmsNotifications: boolean;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  maintenanceMode: boolean;
  itemsPerPage: number;
  cacheDuration: number;
  pages: {
    aboutUs: string;
    aboutMission: string;
    aboutTeam: string;
    aboutSecurity: string;
    aboutSpeed: string;
    contactInfo: string;
    helpFaqs: string; // JSON stringified
    privacyText: string;
    rulesText: string;
    supportFaqs: string; // JSON stringified
    supportContactText: string;
  };
}

const SettingsSchema = new Schema<ISettings>(
  {
    siteName: { type: String, default: "پلتفرم آگهی هویج" },
    siteDescription: { type: String, default: "بزرگ‌ترین بازار کالا و خدمات" },
    siteLogo: { type: String, default: "/logo.webp" },
    favicon: { type: String, default: "/favicon.ico" },
    contactEmail: { type: String, default: "info@example.com" },
    contactPhone: { type: String, default: "021-12345678" },
    contactAddress: { type: String, default: "تهران، خیابان ولیعصر" },
    socialLinks: {
      telegram: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    adApprovalRequired: { type: Boolean, default: true },
    maxAdImages: { type: Number, default: 10 },
    defaultAdDuration: { type: Number, default: 30 },
    vipAdPrice: { type: Number, default: 50000 },
    enableSmsNotifications: { type: Boolean, default: true },
    enableEmailNotifications: { type: Boolean, default: true },
    enablePushNotifications: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    itemsPerPage: { type: Number, default: 20 },
    cacheDuration: { type: Number, default: 3600 },
    pages: {
      aboutUs: {
        type: String,
        default:
          "ما در پلتفرم جامع آگهی با هدف ایجاد بازاری امن، سریع و هوشمند برای خرید و فروش کالا و خدمات در ایران فعالیت می‌کنیم.",
      },
      aboutMission: {
        type: String,
        default:
          "ایجاد بستری شفاف، امن و بدون واسطه برای ارتباط مستقیم خریداران و فروشندگان.",
      },
      aboutTeam: {
        type: String,
        default:
          "تیمی متخصص و متعهد که همواره در حال بهبود تجربه کاربری شما هستند.",
      },
      aboutSecurity: {
        type: String,
        default:
          "امنیت اطلاعات و تراکنش‌های شما اولویت اصلی ماست. تمامی داده‌ها رمزنگاری شده‌اند.",
      },
      aboutSpeed: {
        type: String,
        default:
          "با استفاده از جدیدترین فناوری‌ها، سرعت بارگذاری و جستجوی آگهی‌ها را به حداکثر رسانده‌ایم.",
      },
      contactInfo: {
        type: String,
        default: "ما همواره آماده شنیدن نظرات، پیشنهادات و انتقادات شما هستیم.",
      },
      helpFaqs: {
        type: String,
        default: JSON.stringify([
          {
            question: "چگونه آگهی ثبت کنم؟",
            answer:
              "کافیست از منوی اصلی روی «ثبت آگهی» کلیک کرده و اطلاعات را وارد کنید.",
            category: "ads",
          },
          {
            question: "هزینه ثبت آگهی چقدر است؟",
            answer: "ثبت آگهی معمولی رایگان است.",
            category: "ads",
          },
        ]),
      },
      privacyText: {
        type: String,
        default:
          "ما اطلاعاتی مانند شماره تلفن، نام و ایمیل شما را صرفاً برای ارائه خدمات بهتر جمع‌آوری می‌کنیم. این اطلاعات نزد ما محفوظ بوده و به هیچ شخص ثالثی فروخته یا اجاره داده نمی‌شود.",
      },
      rulesText: {
        type: String,
        default:
          "درج اطلاعات صحیح و دقیق الزامی است. آگهی‌های تکراری یا مشابه حذف خواهند شد. درج هرگونه محتوای خلاف قوانین جمهوری اسلامی ایران ممنوع است.",
      },
      supportFaqs: {
        type: String,
        default: JSON.stringify([
          {
            question: "چگونه اشتراک VIP تهیه کنم؟",
            answer:
              "از منوی پنل کاربری خود به بخش «اشتراک» بروید و پلن مورد نظر را انتخاب کنید.",
          },
          {
            question: "در صورت مشکل در پرداخت چه کنم؟",
            answer: "یک تیکت با موضوع «مشکل پرداخت» ثبت کنید.",
          },
        ]),
      },
      supportContactText: {
        type: String,
        default:
          "تلفن: ۰۲۱-۱۲۳۴۵۶۷۸ | ایمیل: support@yourplatform.ir | ساعت پاسخگویی: ۹ صبح تا ۱۸",
      },
    },
  },
  { timestamps: true },
);

export const Settings = mongoose.model<ISettings>("Settings", SettingsSchema);
