import mongoose, { Schema, Document } from "mongoose";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "rejected";
export type ReportType =
  | "spam"
  | "fraud"
  | "fake"
  | "offensive"
  | "illegal"
  | "duplicate"
  | "wrong_category"
  | "other";

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId | null;
  targetType: "ad" | "property" | "user";
  targetId: mongoose.Types.ObjectId;
  type: ReportType;
  description?: string;
  evidence?: string[];
  status: ReportStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    targetType: {
      type: String,
      enum: ["ad", "property", "user"],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    type: {
      type: String,
      enum: [
        "spam",
        "fraud",
        "fake",
        "offensive",
        "illegal",
        "duplicate",
        "wrong_category",
        "other",
      ],
      required: true,
    },
    description: { type: String, maxlength: 1000 },
    evidence: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    resolution: { type: String },
  },
  { timestamps: true },
);

// ایندکس‌ها
ReportSchema.index({ targetType: 1, targetId: 1 });
ReportSchema.index({ reporter: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ createdAt: -1 });

// ایندکس یکتا فقط برای کاربران لاگین‌کرده (reporter != null)
ReportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { reporter: { $exists: true, $ne: null } },
  },
);

// متدها بدون تغییر...
ReportSchema.methods.updateStatus = async function (
  status: ReportStatus,
  reviewedBy: string,
  resolution?: string,
) {
  this.status = status;
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  if (resolution) this.resolution = resolution;
  await this.save();
};

ReportSchema.statics.getPendingReports = function () {
  return this.find({ status: "pending" })
    .populate("reporter", "firstName lastName phone")
    .sort({ createdAt: -1 });
};

ReportSchema.statics.getStatistics = async function () {
  return this.aggregate([
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
      },
    },
  ]);
};

export const Report = mongoose.model<IReport>("Report", ReportSchema);
