import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notificationSetting.controller";

const router = Router();

router.get("/settings", protect, getNotificationSettings);
router.put("/settings", protect, updateNotificationSettings);

export default router;
