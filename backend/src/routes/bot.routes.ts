import { Router } from "express";
import {
  handleWebhook,
  getBotStatus,
  sendTestMessage,
  searchAds,
  getCategories,
  getAdDetail,
  subscribeToNotifications,
} from "../controllers/bot.controller";

const router = Router();

// ─── وب‌هوک دریافت پیام از پلتفرم‌ها ───
router.post("/telegram/webhook", handleWebhook("telegram"));
router.post("/bale/webhook", handleWebhook("bale"));
router.post("/eitaa/webhook", handleWebhook("eitaa"));

// ─── عملیات عمومی بات ───
router.get("/status", getBotStatus);
router.post("/test-message", sendTestMessage);

// ─── جستجو و اطلاعات ───
router.get("/search", searchAds);
router.get("/categories", getCategories);
router.get("/ad/:id", getAdDetail);

// ─── اشتراک اعلان ───
router.post("/subscribe", subscribeToNotifications);

export default router;
