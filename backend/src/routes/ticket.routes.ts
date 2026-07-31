// backend/src/routes/ticket.routes.ts
import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import {
  createTicket,
  getUserTickets,
  getTicket,
  addReply,
  closeTicket,
  getAllTickets,
  getAnyTicket,
  adminReply,
  updateTicketStatus,
  reopenTicket,
  rateTicket,
  searchUserTickets,
} from "../controllers/ticket.controller";

const router = Router();

// مسیرهای ثابت (بدون پارامتر)
router.post("/", protect, createTicket);
router.get("/", protect, getUserTickets);
router.get("/search", protect, searchUserTickets);
router.get("/my", protect, getUserTickets); // ← این خط را اضافه کنید

// مسیرهای ادمین (باید قبل از /:id باشند)
router.get("/admin/all", protect, hasPermission("tickets:read"), getAllTickets);
router.get("/admin/:id", protect, hasPermission("tickets:read"), getAnyTicket);
router.post(
  "/admin/:id/reply",
  protect,
  hasPermission("tickets:write"),
  adminReply,
);
router.patch(
  "/admin/:id/status",
  protect,
  hasPermission("tickets:write"),
  updateTicketStatus,
);
// مسیرهای کاربر عادی (بعد از admin)
router.get("/:id", protect, getTicket);
router.post("/:id/reply", protect, addReply); // این خط برای کاربر عادی بود که اضافه شد
router.patch(
  "/:id/close",
  protect,
  hasPermission("tickets:write"),
  closeTicket,
);
router.post(
  "/:id/reopen",
  protect,
  hasPermission("tickets:write"),
  reopenTicket,
);
router.post("/:id/rate", protect, rateTicket);

export default router;
