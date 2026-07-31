// backend/src/routes/notification.routes.ts
import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notification.controller";

const router = Router();

// تمام مسیرها نیاز به ورود دارند (اعلان‌های شخصی کاربر)
router.use(protect);

// تنظیمات
router.get("/settings", protect, getNotificationSettings);

router.put("/settings", protect, updateNotificationSettings);

// اعلان‌ها
router.get("/unread-count", getUnreadCount);
router.get("/", getNotifications);
router.put("/read-all", markAllAsRead);
router.delete("/read/all", deleteAllReadNotifications);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
