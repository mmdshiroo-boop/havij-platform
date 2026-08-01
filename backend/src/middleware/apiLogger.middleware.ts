import { Request, Response, NextFunction } from "express";
import { ApiLog } from "../models/ApiLog.model";

// مسیرهایی که نباید لاگ بشن
const SKIP_PATHS = [
  "/api/health",
  "/api-docs",
  "/api/developer/logs",
  "/api/developer/logs/analytics",
];

export const apiLogger = (req: Request, res: Response, next: NextFunction) => {
  // skip non-API paths
  if (!req.originalUrl.startsWith("/api/")) return next();

  // skip specific paths
  if (SKIP_PATHS.some((p) => req.originalUrl.startsWith(p))) return next();

  const start = Date.now();
  const method = req.method;
  const endpoint = simplifyEndpoint(req.originalUrl);
  // ✅ استفاده از req.ip (Express پس از trust proxy آن را از x-forwarded-for استخراج می‌کند)
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "";

  // intercept res.json to capture status + body errors
  const originalJson = res.json.bind(res);
  let responseBody: any = null;

  res.json = (body: any) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // extract userId from request (set by protect middleware)
    const userId = (req as any).user?._id;

    // extract apiKey info from headers
    const authHeader = req.headers.authorization || "";
    const apiKeyName = req.headers["x-api-key-name"] as string | undefined;

    // check if request was made via API key (no Bearer token but has x-api-key header)
    const hasApiKey = !!req.headers["x-api-key"];

    // don't log static assets or websocket upgrades
    if (method === "OPTIONS") return;

    // build error message for 4xx/5xx
    let error: string | undefined;
    if (statusCode >= 400) {
      error =
        typeof responseBody === "object"
          ? responseBody?.error || responseBody?.message || ""
          : "";
      // truncate long errors
      if (error && error.length > 500) error = error.substring(0, 500);
    }

    // fire-and-forget — don't block the response
    ApiLog.create({
      method,
      endpoint,
      statusCode,
      responseTime: duration,
      userId: userId || undefined,
      apiKeyId: hasApiKey ? undefined : undefined,
      apiKeyName: apiKeyName || (hasApiKey ? "API Key" : undefined),
      ip,
      userAgent,
      error,
      timestamp: new Date(),
    }).catch(() => {
      // silently fail — logging should never break the app
    });
  });

  next();
};

/**
 * Simplifies URLs like /api/ads/654321a.../comments → /api/ads/:id/comments
 */
function simplifyEndpoint(url: string): string {
  // remove query string
  const path = url.split("?")[0];

  return path
    .split("/")
    .map((segment) => {
      // MongoDB ObjectId pattern (24 hex chars)
      if (/^[0-9a-f]{24}$/i.test(segment)) return ":id";
      // Numeric IDs
      if (/^\d+$/.test(segment)) return ":id";
      return segment;
    })
    .join("/");
}