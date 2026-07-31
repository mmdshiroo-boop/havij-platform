// backend/src/models/VipPlan.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IVipPlan extends Document {
  name: string;
  nameEn: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  discount: number;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const VipPlanSchema = new Schema<IVipPlan>(
  {
    name: { type: String, required: true },
    nameEn: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true, default: 30 },
    features: { type: [String], default: [] },
    discount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const VipPlan = mongoose.model<IVipPlan>("VipPlan", VipPlanSchema);
