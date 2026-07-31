import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  lastActive: Date;
  isCurrent: boolean;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    device: { type: String, default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    lastActive: { type: Date, default: Date.now },
    isCurrent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model<ISession>("Session", SessionSchema);
