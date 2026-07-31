import { Schema, model, Document, Types } from "mongoose";

export interface IAdAnalytics extends Document {
  adId: Types.ObjectId;
  viewsCount: number;
  contactsCount: number;
  bookmarksCount: number;
  date: Date;
}

const AdAnalyticsSchema = new Schema<IAdAnalytics>({
  adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
  viewsCount: { type: Number, default: 0 },
  contactsCount: { type: Number, default: 0 },
  bookmarksCount: { type: Number, default: 0 },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0),
  }, // ذخیره به صورت روزانه
});

// ایندکس‌گذاری برای سرعت بسیار بالا در فیلترهای زمانی و آگهی
AdAnalyticsSchema.index({ adId: 1, date: -1 });

export const AdAnalytics = model<IAdAnalytics>(
  "AdAnalytics",
  AdAnalyticsSchema,
);
