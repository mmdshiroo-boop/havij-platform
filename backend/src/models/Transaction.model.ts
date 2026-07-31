import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number; // به تومان
  type: "subscription" | "vip" | "other";
  status: "success" | "failed" | "pending";
  reference: string; // کد پیگیری
  description: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["subscription", "vip", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },
    reference: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema,
);
