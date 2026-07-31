// subscriptionPlan.model.ts
import { Schema, model, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  title: string;
  slug: string;
  price: number; // به تومان
  durationDays: number;
  features: string[];
  targetRole: 'user' | 'vip' | 'agent';
  isActive: boolean;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    features: [{ type: String, trim: true }],
    targetRole: { 
      type: String, 
      enum: ['user', 'vip', 'agent'], 
      default: 'vip' 
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ slug: 1 });
subscriptionPlanSchema.index({ targetRole: 1, isActive: 1 });

export const SubscriptionPlan = model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);