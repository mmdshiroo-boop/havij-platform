// backend/src/routes/report.routes.ts
import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import {
  createReport, // این تابع رو بدون protect هم صدا می‌زنیم
  getPendingReports,
  getReports,
  resolveReport,
  rejectReport,
  getMyReports,
} from "../controllers/report.controller";

const router = Router();

// ⬇️ این مسیر عمومی باشه – هر کسی بتونه گزارش بده
router.post("/", createReport);
router.get("/my", protect, getMyReports);
// ⬇️ بقیه مسیرها برای ادمین‌ها با احراز هویت
router.get(
  "/pending",
  protect,
  hasPermission("reports:read"),
  getPendingReports,
);
router.get("/", protect, hasPermission("reports:read"), getReports);
router.patch(
  "/:id/resolve",
  protect,
  hasPermission("reports:handle"),
  resolveReport,
);
router.patch(
  "/:id/reject",
  protect,
  hasPermission("reports:handle"),
  rejectReport,
);

export default router;
