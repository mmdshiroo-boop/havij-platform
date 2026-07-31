import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  getConversations,
  createOrGetConversation,
  getMessages,
  markAsRead,
  deleteConversation,
} from "../controllers/conversation.controller";

const router = Router();
router.use(protect);

// ─── گفتگوها ───
router.get("/", getConversations); // GET /api/conversations
router.post("/", createOrGetConversation); // POST /api/conversations
router.get("/:id/messages", getMessages); // GET /api/conversations/:id/messages
router.patch("/:id/read", markAsRead); // PATCH /api/conversations/:id/read
router.delete("/:id", deleteConversation); // DELETE /api/conversations/:id

export default router;
