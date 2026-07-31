import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { BlacklistKeyword } from "../models/BlacklistKeyword.model";

export const blacklistCheckMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // فقط برای POST و PUT که عنوان و توضیحات دارند
    if (!["POST", "PUT"].includes(req.method)) return next();
    const { title, description } = req.body;
    if (!title && !description) return next();

    const keywords = await BlacklistKeyword.find({ isActive: true }).lean();
    if (keywords.length === 0) return next();

    const text = `${title || ""} ${description || ""}`.toLowerCase();
    const found = keywords.filter((k) => text.includes(k.word));

    if (found.length > 0) {
      // آگهی را flagged کن
      req.body.status = "flagged";
      req.body.flagReason = `کلمات مشکوک: ${found.map((k) => k.word).join("، ")}`;
      req.body.flagSeverity = found.some((k) => k.severity === "high")
        ? "high"
        : "medium";
    }

    next();
  } catch (error) {
    console.error("Blacklist check error:", error);
    next(); // در صورت خطا، مانع ثبت آگهی نشو
  }
};
