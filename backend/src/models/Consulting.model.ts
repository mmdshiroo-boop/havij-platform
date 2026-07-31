// backend/src/models/Consulting.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IConsulting extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  subject: string;
  message?: string;
  preferredDate?: Date;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const ConsultingSchema = new Schema<IConsulting>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    message: { type: String, default: "" },
    preferredDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Consulting = mongoose.model<IConsulting>(
  "Consulting",
  ConsultingSchema,
);
