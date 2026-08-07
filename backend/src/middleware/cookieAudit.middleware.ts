import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { CookieMonitorService } from "../services/cookieMonitor.service";

export const cookieAuditMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user && req.sessionId) {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const ua = req.headers["user-agent"] || "unknown";
      const fingerprint = CookieMonitorService.generateFingerprint(ip, ua);

      await CookieMonitorService.checkSuspiciousActivity(
        req.sessionId,
        fingerprint,
        ip,
        ua,
      );

      if (req.method === "GET") {
        await CookieMonitorService.logEvent({
          userId: req.user._id?.toString() || req.user.id,
          sessionId: req.sessionId,
          type: "session_check",
          ip,
          userAgent: ua,
          cookieName: "access_token",
          status: "success",
          navigation: {                         
            currentPath: req.originalUrl,       
            referrer: (req.headers["referer"] as string) || "",
          },
          cookieData: {                  
            name: "access_token",              
          },
        });
      }
    }
  } catch (err) {
    console.error("Cookie audit middleware error:", err);
  }
  next();
};