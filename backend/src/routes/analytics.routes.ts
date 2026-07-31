import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import { AnalyticsController } from "../controllers/analytics.controller";

const router = Router();

router.use(protect);

router.get("/user-overview", AnalyticsController.getUserOverview);
router.get(
  "/admin-overview",
  hasPermission("ads:read", "users:read"),
  AnalyticsController.getAdminStats,
);

export default router;
