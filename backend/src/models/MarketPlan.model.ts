import mongoose, { Schema, Document } from "mongoose";

export interface IMarketPlan extends Document {
  name: string;
  nameEn: string;
  duration: number; // ماه
  price: number; // تومان
  features: string[];
  isActive: boolean;
  discount?: number;
  isPopular?: boolean;
}

const MarketPlanSchema = new Schema<IMarketPlan>(
  {
    name: { type: String, required: true },
    nameEn: { type: String, default: "" },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
    discount: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const MarketPlan = mongoose.model<IMarketPlan>(
  "MarketPlan",
  MarketPlanSchema,
);
