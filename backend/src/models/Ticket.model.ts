import mongoose, { Schema, Document } from "mongoose";

export interface ITicket extends Document {
  user: mongoose.Types.ObjectId;
  subject: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category?: string; // 🆕
  rating?: number; // 🆕
  reopenedAt?: Date; // 🆕
  messages: {
    sender: "user" | "admin";
    message: string;
    attachment?: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: { type: String }, // 🆕
    rating: { type: Number, min: 1, max: 5 }, // 🆕
    reopenedAt: { type: Date }, // 🆕
    messages: [
      {
        sender: { type: String, enum: ["user", "admin"], required: true },
        message: { type: String, default: "" },
        attachment: { type: String, default: null },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);
