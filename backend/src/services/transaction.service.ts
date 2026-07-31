import { Transaction } from "../models/Transaction.model";
import mongoose from "mongoose";

export class TransactionService {
  static async record(
    userId: string,
    amount: number,
    type: "subscription" | "vip" | "other",
    reference: string,
    description: string,
    status: "success" | "failed" | "pending" = "success"
  ) {
    await Transaction.create({
      userId: new mongoose.Types.ObjectId(userId),
      amount,
      type,
      status,
      reference,
      description,
    });
  }
}