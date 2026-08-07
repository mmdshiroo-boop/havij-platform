import mongoose, { Schema, Document } from "mongoose";

export interface IBulkTask extends Document {
  userId: mongoose.Types.ObjectId;
  status: "processing" | "completed" | "failed";
  totalItems: number;
  processed: number;
  results: {
    success: number;
    errors: number;
    skipped: number;
    watermarkApplied: number;
    details: any[];
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BulkTaskSchema = new Schema<IBulkTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },filePath: { type: String },
    totalItems: { type: Number, required: true },
    processed: { type: Number, default: 0 },
    results: {
      success: { type: Number, default: 0 },
      errors: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      watermarkApplied: { type: Number, default: 0 },
      details: { type: Array, default: [] },
    },
    error: { type: String },
  },
  { timestamps: true }
);

export const BulkTask = mongoose.model<IBulkTask>("BulkTask", BulkTaskSchema);