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

export default router;
