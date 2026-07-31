// backend/src/routes/pageView.routes.ts
import { Router, Request, Response } from "express";
import { PageView } from "../models/PageView.model";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { path, referrer, sessionId, userId } = req.body;

    if (!path) {
      return res
        .status(400)
        .json({ success: false, message: "مسیر الزامی است" });
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "";

    await PageView.create({
      ip,
      path,
      referrer: referrer || "",
      sessionId: sessionId || "",
      userId: userId || undefined, // برای مهمان undefined می‌ماند
      userAgent,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("PageView log error:", error);
    res.status(500).json({ success: false, message: "خطا در ثبت بازدید" });
  }
});

export default router;
