import mongoose, { Schema, Document } from "mongoose";

export interface IBlacklistKeyword extends Document {
  word: string;
  category: "اخلاقی" | "سیاسی" | "کلاهبرداری" | "سایر";
  severity: "low" | "medium" | "high";
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlacklistKeywordSchema = new Schema<IBlacklistKeyword>(
  {
    word: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["اخلاقی", "سیاسی", "کلاهبرداری", "سایر"],
      default: "سایر",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

BlacklistKeywordSchema.index({ word: 1 });
BlacklistKeywordSchema.index({ category: 1 });

export const BlacklistKeyword = mongoose.model<IBlacklistKeyword>(
  "BlacklistKeyword",
  BlacklistKeywordSchema,
);
