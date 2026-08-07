import { Router } from "express";
import {
  protect,
  hasPermission,
  requireRole,
} from "../middleware/auth.middleware";
import {
  getExpertStats,
  getExpertProfile,
  updateExpertProfile,
  getPendingAdById,
  reviewAd,
  getPendingAdsList,
} from "../controllers/expert.controller";
import { uploadBulkAds } from "../controllers/bulkAd.controller";
import { BulkTask } from "../models/BulkTask.model";   // ← جدید

const router = Router();
router.use(protect);

router.get("/stats", hasPermission("ads:read"), getExpertStats);
router.get("/profile", getExpertProfile);
router.put("/profile", updateExpertProfile);
router.get("/pending-ads", hasPermission("ads:read"), getPendingAdsList);
router.get("/pending-ads/:id", hasPermission("ads:read"), getPendingAdById);
router.post("/pending-ads/:id/review", hasPermission("ads:approve"), reviewAd);

// مسیر آپلود فله‌ای – express-fileupload خودش فایل را parse می‌کند
router.post(
  "/bulk-ads",
  requireRole("expert", "admin", "super_admin"),
  uploadBulkAds,
);

// ★ مسیر جدید برای دریافت وضعیت تسک ★
router.get(
  "/bulk-ads/:taskId/status",
  requireRole("expert", "admin", "super_admin"),
  async (req, res) => {
    try {
      const task = await BulkTask.findById(req.params.taskId);
      if (!task)
        return res.status(404).json({ success: false, message: "تسک یافت نشد" });
      return res.json({ success: true, data: task });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "خطا در دریافت وضعیت" });
    }
  },
);

export default router;