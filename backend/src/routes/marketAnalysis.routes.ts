import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import {
  getMarketStats,
  getRegionStats,
  getProvinces,
  getHotZones,
  refreshMarketStats,
} from "../controllers/marketAnalysis.controller";

const router = Router();

router.get("/stats", getMarketStats); // آمار همه استان‌ها
router.get("/provinces", getProvinces); // لیست استان‌ها
router.get("/region/:regionId", getRegionStats);
router.get("/region/:regionId/hot-zones", getHotZones);
router.post("/refresh", protect, hasPermission("ads:read"), refreshMarketStats); // بازسازی آمار
export default router;
