// backend/src/routes/watermark.routes.ts
import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import {
  getPreviewConfig,
  getSettings,
  updateSettings,
} from "../controllers/watermark.controller";

const router = Router();

// عمومی: دریافت تنظیمات (برای فرانت‌اند پیش‌نمایش)
router.get("/settings", getSettings);
router.get("/preview-config", getPreviewConfig);

// ادمین: بروزرسانی تنظیمات
router.put(
  "/settings",
  protect,
  hasPermission("settings:write"),
  updateSettings,
);

export default router;
