import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { uploadFile } from "../controllers/conversation.controller";
import {
  sendMessage,
  editMessage,
  deleteMessage,
  uploadFileMessage,
} from "../controllers/chat.controller";
import { chatRateLimiter } from "../middleware/chatSecurity";
import { validateFileType } from "../middleware/fileFilter";
import multer from "multer";

const router = Router();
router.use(protect);
const upload = multer({ dest: "uploads/chat/" });
// ─── پیام‌ها ───
router.post("/conversations/:id/messages", chatRateLimiter, sendMessage);
router.post(
  "/chat/upload/:conversationId",
  chatRateLimiter,
  validateFileType,
  uploadFileMessage,
);
router.put("/messages/:messageId", editMessage);
router.delete("/messages/:messageId", deleteMessage);
router.post("/upload/:id", protect, upload.single("file"), uploadFile);
export default router;
