// backend/src/models/ApiLog.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IApiLog extends Document {
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number; // ms
  userId?: mongoose.Types.ObjectId;
  apiKeyId?: mongoose.Types.ObjectId;
  apiKeyName?: string;
  ip: string;
  userAgent: string;
  error?: string;
  timestamp: Date;
}

const ApiLogSchema = new Schema<IApiLog>(
  {
    method: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
    },
    responseTime: {
      type: Number,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    apiKeyId: {
      type: Schema.Types.ObjectId,
      ref: "ApiKey",
    },
    apiKeyName: {
      type: String,
    },
    ip: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    error: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // خودمون timestamp رو مدیریت می‌کنیم
  },
);

// Compound indexes for fast analytics queries
ApiLogSchema.index({ userId: 1, timestamp: -1 });
ApiLogSchema.index({ endpoint: 1, timestamp: -1 });
ApiLogSchema.index({ statusCode: 1, timestamp: -1 });

export const ApiLog = mongoose.model<IApiLog>("ApiLog", ApiLogSchema);
