// backend/src/models/ApiKey.model.ts
import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";

export interface IApiKey extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  status: "active" | "inactive" | "expired";
  lastUsedAt?: Date;
  expiresAt?: Date;
  requestCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
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
    keyHash: {
      type: String,
      required: true,
      unique: true,
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    scopes: {
      type: [String],
      enum: [
        "read",
        "write",
        "delete",
        "admin",
        "ads:read",
        "ads:write",
        "users:read",
        "users:write",
        "api-keys:read",
        "api-keys:write",
        "webhooks:read",
        "webhooks:write",
        "categories:read",
        "categories:write",
        "conversations:read",
        "conversations:write",
        "favorites:read",
        "favorites:write",
        "notifications:read",
        "reports:read",
        "reports:write",
      ],
      default: ["read"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    requestCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// ایندکس‌ها
ApiKeySchema.index({ userId: 1, status: 1 });
ApiKeySchema.index({ keyHash: 1 });
ApiKeySchema.index({ expiresAt: 1 });

export const ApiKey = mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
