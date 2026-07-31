// backend/src/models/AdminReport.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAdminReport extends Document {
  type: "daily" | "weekly" | "monthly" | "custom";
  period: {
    start: Date;
    end: Date;
  };
  stats: {
    users: {
      total: number;
      new: number;
      active: number;
      banned: number;
      byRole: {
        user: number;
        vip: number;
        agent: number;
        expert: number;
        admin: number;
        super_admin: number;
        developer: number;
      };
    };
    ads: {
      total: number;
      new: number;
      active: number;
      pending: number;
      rejected: number;
      expired: number;
      byCategory: Array<{
        categoryId: string;
        categoryName: string;
        count: number;
      }>;
    };
    revenue: {
      total: number;
      vipSubscriptions: number;
      adPromotions: number;
    };
  };
  createdAt: Date;
}

const AdminReportSchema = new Schema<IAdminReport>(
  {
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
      users: {
        total: { type: Number, default: 0 },
        new: { type: Number, default: 0 },
        active: { type: Number, default: 0 },
        banned: { type: Number, default: 0 },
        byRole: {
          user: { type: Number, default: 0 },
          vip: { type: Number, default: 0 },
          agent: { type: Number, default: 0 },
          expert: { type: Number, default: 0 },
          admin: { type: Number, default: 0 },
          super_admin: { type: Number, default: 0 },
          developer: { type: Number, default: 0 },
        },
      },
      ads: {
        total: { type: Number, default: 0 },
        new: { type: Number, default: 0 },
        active: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        rejected: { type: Number, default: 0 },
        expired: { type: Number, default: 0 },
        byCategory: [
          {
            categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
            categoryName: { type: String },
            count: { type: Number, default: 0 },
          },
        ],
      },
      revenue: {
        total: { type: Number, default: 0 },
        vipSubscriptions: { type: Number, default: 0 },
        adPromotions: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true },
);

export const AdminReport = mongoose.model<IAdminReport>(
  "AdminReport",
  AdminReportSchema,
);
