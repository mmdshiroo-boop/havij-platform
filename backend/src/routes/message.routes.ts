import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  sendMessage,
  editMessage,
  deleteMessage,
  uploadFileMessage,
} from "../controllers/message.controller"; // اگر این کنترلر وجود ندارد باید به chat.controller تغییر یابد
import { chatRateLimiter } from "../middleware/chatSecurity";
import { validateFileType } from "../middleware/fileFilter";

const router = Router();

// تمام مسیرها نیاز به ورود دارند
router.use(protect);

// ارسال پیام متنی (با محدودیت نرخ)
router.post("/conversations/:id/messages", chatRateLimiter, sendMessage);

// آپلود فایل در چت
router.post(
  "/chat/upload/:conversationId",
  chatRateLimiter,
  validateFileType,
  uploadFileMessage,
);

// ویرایش و حذف پیام (کاربر عادی)
router.put("/messages/:messageId", editMessage);
router.delete("/messages/:messageId", deleteMessage);

export default router;
