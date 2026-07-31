// backend/src/routes/vip.routes.ts
import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getPlans,
  getCurrentPlan,
  getVipStats,
  upgradeRequest,
  verifyPayment,
  getVipAnalytics,
  getDashboard,
} from "../controllers/vip.controller";

const router = Router();

// تمام مسیرها نیاز به ورود دارند (هر کاربر احراز هویت‌شده)
router.use(protect);

router.get("/plans", getPlans);
router.get("/current-plan", getCurrentPlan);
router.get("/stats", getVipStats);
router.post("/upgrade", upgradeRequest);
router.get("/dashboard", getDashboard);
router.get("/upgrade/verify", verifyPayment);
router.get("/analytics", getVipAnalytics);

export default router;
