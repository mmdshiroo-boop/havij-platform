// backend/src/routes/adBanner.routes.ts
import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware"; // حذف requireRole
import {
  getBannersByPosition,
  trackBannerView,
  trackBannerClick,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../controllers/adBanner.controller";

const router = Router();

// ─── مسیرهای عمومی (بدون نیاز به لاگین) ───
router.get("/:position", getBannersByPosition);
router.post("/:id/view", trackBannerView);
router.post("/:id/click", trackBannerClick);

// ─── مسیرهای مدیریتی (نیاز به ورود و مجوز) ───
router.get("/admin/all", protect, hasPermission("banners:read"), getAllBanners);
router.post("/admin", protect, hasPermission("banners:write"), createBanner);
router.put("/admin/:id", protect, hasPermission("banners:write"), updateBanner);
router.delete(
  "/admin/:id",
  protect,
  hasPermission("banners:write"),
  deleteBanner,
);

export default router;
