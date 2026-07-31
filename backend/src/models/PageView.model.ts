// backend/src/models/PageView.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPageView extends Document {
  ip: string;
  path: string;
  referrer?: string;
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  userAgent?: string;
  createdAt: Date;
}

const PageViewSchema = new Schema<IPageView>({
  ip: { type: String, required: true },
  path: { type: String, required: true },
  referrer: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  sessionId: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const PageView = mongoose.model<IPageView>("PageView", PageViewSchema);
