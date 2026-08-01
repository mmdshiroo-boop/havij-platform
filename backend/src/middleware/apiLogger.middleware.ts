import { Request, Response, NextFunction } from "express";
import { ApiLog } from "../models/ApiLog.model";

const SKIP_PATHS = [
  "/api/health",
  "/api-docs",
  "/api/developer/logs",
  "/api/developer/logs/analytics",
];

export const apiLogger = (req: Request, res: Response, next: NextFunction) => {
  if (!req.originalUrl.startsWith("/api/")) return next();
  if (SKIP_PATHS.some((p) => req.originalUrl.startsWith(p))) return next();

  const start = Date.now();
  const method = req.method;
  const endpoint = simplifyEndpoint(req.originalUrl);

  // ✅ استخراج IP واقعی از هدر x-forwarded-for (Vercel → Railway)
  const forwarded = (req.headers["x-forwarded-for"] as string) || "";
  const ip = forwarded.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "";

  const originalJson = res.json.bind(res);
  let responseBody: any = null;

  res.json = (body: any) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const userId = (req as any).user?._id;
    const apiKeyName = req.headers["x-api-key-name"] as string | undefined;
    const hasApiKey = !!req.headers["x-api-key"];

    if (method === "OPTIONS") return;

    let error: string | undefined;
    if (statusCode >= 400) {
      error = typeof responseBody === "object"
        ? responseBody?.error || responseBody?.message || ""
        : "";
      if (error.length > 500) error = error.substring(0, 500);
    }

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
    }).catch(() => {});
  });

  next();
};

function simplifyEndpoint(url: string): string {
  const path = url.split("?")[0];
  return path
    .split("/")
    .map((segment) => {
      if (/^[0-9a-f]{24}$/i.test(segment)) return ":id";
      if (/^\d+$/.test(segment)) return ":id";
      return segment;
    })
    .join("/");
}