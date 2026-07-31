import mongoose, { Schema, Document } from "mongoose";

export interface IDailyAgentReport extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  totalAds: number;
  totalViews: number;
  activeAds: number;
  soldAds: number;
  totalRevenue: number;
  createdAt: Date;
}

const DailyAgentReportSchema = new Schema<IDailyAgentReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    totalAds: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    activeAds: { type: Number, default: 0 },
    soldAds: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

// ایندکس ترکیبی برای جلوگیری از ذخیره‌ی تکراری در یک روز برای هر کاربر
DailyAgentReportSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyAgentReport =
  mongoose.models.DailyAgentReport ||
  mongoose.model<IDailyAgentReport>("DailyAgentReport", DailyAgentReportSchema);
