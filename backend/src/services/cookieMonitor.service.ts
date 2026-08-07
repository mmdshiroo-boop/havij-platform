import crypto from "crypto";
import CookieAudit, { ICookieAudit } from "../models/CookieAudit";

interface CookieEventParams {
  userId?: string | null;
  sessionId: string;
  type: ICookieAudit["type"];
  ip: string;
  userAgent: string;
  cookieName: string;
  status?: ICookieAudit["status"];
  reason?: string;
  navigation?: {
     currentPath?: string;
     referrer?: string;
   };
    cookieData?: {
    name?: string;
    domain?: string;
    value?: string;
    expires?: string;
  };
}

export class CookieMonitorService {
  static generateFingerprint(ip: string, userAgent: string): string {
    const salt =
      process.env.COOKIE_FINGERPRINT_SALT || "default-salt-change-me";
    return crypto
      .createHash("sha256")
      .update(`${ip}-${userAgent}-${salt}`)
      .digest("hex");
  }

  // بعد از create:
 static async logEvent(params: CookieEventParams): Promise<void> {
    try {
      const fingerprint = this.generateFingerprint(params.ip, params.userAgent);
      const newLog = await CookieAudit.create({
        userId: params.userId || null,
        sessionId: params.sessionId,
        type: params.type,
        ip: params.ip,
        userAgent: params.userAgent,
        fingerprint,
        cookieName: params.cookieName,
        status: params.status || "success",
        metadata: params.reason ? { reason: params.reason } : undefined,
        navigation: params.navigation,        // ✅ اضافه شد
        cookieData: params.cookieData,        // ✅ اضافه شد
      });

      try {
        const { getIO } = require("../socket");
        const io = getIO();
        if (io) {
          const populated = await newLog.populate(
            "userId",
            "firstName lastName phone role",
          );
          io.emit("cookie-audit:new", populated.toObject());
        }
      } catch {}
    } catch (error) {
      console.error("CookieAudit log error:", error);
    }
  }

  static async checkSuspiciousActivity(
    sessionId: string,
    currentFingerprint: string,
    ip: string,
    userAgent: string,
  ): Promise<boolean> {
    const lastEvent = await CookieAudit.findOne({
      sessionId,
      status: "success",
      type: { $in: ["login", "session_check"] },
    }).sort({ createdAt: -1 });

    if (lastEvent && lastEvent.fingerprint !== currentFingerprint) {
    await this.logEvent({
  sessionId,
  type: "suspicious",
  ip,
  userAgent,
  cookieName: "session",
  status: "failed",
  reason: "Fingerprint mismatch: possible session hijacking",
  navigation: {
    currentPath: "",   // می‌توانید undefined بفرستید
    referrer: "",
  },
  cookieData: {
    name: "session",
  },
});
      return true;
    }
    return false;
  }
}
