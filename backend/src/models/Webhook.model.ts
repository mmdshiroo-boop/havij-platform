// backend/src/models/Webhook.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IWebhook extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  secret: string;
  events: string[]; // ['ad.created', 'ad.updated', 'ad.deleted', 'user.registered']
  status: "active" | "inactive" | "failed";
  lastTriggeredAt?: Date;
  lastError?: string;
  deliveryCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<IWebhook>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    secret: {
      type: String,
      required: true,
    },
    events: {
      type: [String],
      required: true,
      enum: [
        "ad.created",
        "ad.updated",
        "ad.deleted",
        "ad.approved",
        "user.registered",
        "user.updated",
      ],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "failed"],
      default: "active",
    },
    lastTriggeredAt: {
      type: Date,
    },
    lastError: {
      type: String,
    },
    deliveryCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// ایندکس‌ها
WebhookSchema.index({ userId: 1, status: 1 });
WebhookSchema.index({ url: 1 });

export const Webhook = mongoose.model<IWebhook>("Webhook", WebhookSchema);
