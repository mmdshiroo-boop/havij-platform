import mongoose, { Schema, Document } from "mongoose";

export interface ICookieAudit extends Document {
  userId: mongoose.Types.ObjectId | null;
  sessionId: string;
  type: "login" | "logout" | "token_refresh" | "session_check" | "suspicious";
  ip: string;
  userAgent: string;
  fingerprint: string;
  cookieName: string;
  status: "success" | "failed" | "expired" | "revoked";
  metadata?: {
    reason?: string;
  };
  createdAt: Date;
}

const CookieAuditSchema = new Schema<ICookieAudit>({
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  sessionId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ["login", "logout", "token_refresh", "session_check", "suspicious"],
    required: true,
  },
  ip: { type: String, required: true },
  userAgent: { type: String, required: true },
  fingerprint: { type: String, required: true },
  cookieName: { type: String, required: true },
  status: {
    type: String,
    enum: ["success", "failed", "expired", "revoked"],
    default: "success",
  },
  metadata: {
    reason: String,
  },
  createdAt: { type: Date, default: Date.now, expires: "90d" },
});

CookieAuditSchema.index({ userId: 1, createdAt: -1 });
CookieAuditSchema.index({ sessionId: 1, type: 1 });

export default mongoose.model<ICookieAudit>("CookieAudit", CookieAuditSchema);
