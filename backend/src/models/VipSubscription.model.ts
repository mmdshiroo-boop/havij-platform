// backend/src/models/VipSubscription.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IVipSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: "active" | "expired" | "cancelled";
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentId?: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const VipSubscriptionSchema = new Schema<IVipSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: { type: Schema.Types.ObjectId, ref: "VipPlan", required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: false },
    paymentId: { type: String },
    amount: { type: Number, required: true },
  },
  { timestamps: true },
);

export const VipSubscription = mongoose.model<IVipSubscription>(
  "VipSubscription",
  VipSubscriptionSchema,
);
