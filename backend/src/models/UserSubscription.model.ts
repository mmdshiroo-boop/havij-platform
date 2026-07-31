// userSubscription.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IUserSubscription extends Document {
  user: Types.ObjectId;
  plan: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  paymentRefId?: string;
  gateway?: string;
}

const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'active', 'expired', 'cancelled'], 
      default: 'pending' 
    },
    paymentRefId: { type: String, sparse: true },
    gateway: { type: String, enum: ['zarinpal', 'nextpay', 'manual'] },
  },
  { timestamps: true }
);

// ایندکس کامپوند برای کوئری‌های سریع بررسی اعتبار
userSubscriptionSchema.index({ user: 1, status: 1, endDate: -1 });
userSubscriptionSchema.index({ paymentRefId: 1 }, { sparse: true });

export const UserSubscription = model<IUserSubscription>('UserSubscription', userSubscriptionSchema);