// backend/src/models/AgentReport.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAgentReport extends Document {
  agentId: mongoose.Types.ObjectId;
  type: "daily" | "weekly" | "monthly" | "custom";
  period: {
    start: Date;
    end: Date;
  };
  stats: {
    properties: {
      total: number;
      active: number;
      sold: number;
      pending: number;
      expired: number;
    };
    views: {
      total: number;
      averagePerProperty: number;
    };
    leads: {
      total: number;
      new: number;
      converted: number;
      conversionRate: number;
    };
    revenue: {
      total: number;
      commission: number;
      averagePerSale: number;
    };
  };
  topProperties: Array<{
    propertyId: mongoose.Types.ObjectId;
    title: string;
    views: number;
    leads: number;
    status: string;
  }>;
  createdAt: Date;
}

const AgentReportSchema = new Schema<IAgentReport>(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom"],
      required: true,
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    stats: {
      properties: {
        total: { type: Number, default: 0 },
        active: { type: Number, default: 0 },
        sold: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        expired: { type: Number, default: 0 },
      },
      views: {
        total: { type: Number, default: 0 },
        averagePerProperty: { type: Number, default: 0 },
      },
      leads: {
        total: { type: Number, default: 0 },
        new: { type: Number, default: 0 },
        converted: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
      },
      revenue: {
        total: { type: Number, default: 0 },
        commission: { type: Number, default: 0 },
        averagePerSale: { type: Number, default: 0 },
      },
    },
    topProperties: [
      {
        propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
        title: { type: String },
        views: { type: Number, default: 0 },
        leads: { type: Number, default: 0 },
        status: { type: String },
      },
    ],
  },
  { timestamps: true },
);

export const AgentReport = mongoose.model<IAgentReport>(
  "AgentReport",
  AgentReportSchema,
);
