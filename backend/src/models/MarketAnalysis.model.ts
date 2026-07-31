// backend/src/models/MarketAnalysis.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMarketAnalysis extends Document {
  provinceId: string;
  provinceName: string;
  provinceCode: number;
  totalDeals: number;
  avgPrice: number;
  growth: number;
  hotZones: string[];
  propertyTypes: {
    apartment: number;
    villa: number;
    commercial: number;
    office: number;
  };
  monthlyStats: {
    month: string;
    deals: number;
    avgPrice: number;
  }[];
  yearOverYear: number;
  quarterOverQuarter: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MarketAnalysisSchema = new Schema<IMarketAnalysis>(
  {
    provinceId: { type: String, required: true, unique: true, index: true },
    provinceName: { type: String, required: true },
    provinceCode: { type: Number, required: true },
    totalDeals: { type: Number, default: 0 },
    avgPrice: { type: Number, default: 0 },
    growth: { type: Number, default: 0 },
    hotZones: [{ type: String }],
    propertyTypes: {
      apartment: { type: Number, default: 25 },
      villa: { type: Number, default: 25 },
      commercial: { type: Number, default: 25 },
      office: { type: Number, default: 25 },
    },
    monthlyStats: [
      {
        month: { type: String, required: true },
        deals: { type: Number, default: 0 },
        avgPrice: { type: Number, default: 0 },
      },
    ],
    yearOverYear: { type: Number, default: 0 },
    quarterOverQuarter: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// ایندکس‌ها برای جستجوی سریع
MarketAnalysisSchema.index({ provinceId: 1 });
MarketAnalysisSchema.index({ provinceCode: 1 });
MarketAnalysisSchema.index({ lastUpdated: -1 });

export const MarketAnalysis = mongoose.model<IMarketAnalysis>(
  "MarketAnalysis",
  MarketAnalysisSchema,
);
