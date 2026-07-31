// backend/src/routes/developer.routes.ts
import express from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import {
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  regenerateApiKey,
  getDashboardStats,
  getSettings,
  updateSettings,
  getServicesStatus,
} from "../controllers/developer.controller";
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  regenerateSecret,
  testWebhook,
} from "../controllers/webhook.controller";
import {
  getLogs,
  getLogAnalytics,
  clearLogs,
} from "../controllers/apiLog.controller";
const router = express.Router();

// همه مسیرها نیاز به ورود دارند
router.use(protect);

// ==================== داشبورد توسعه‌دهنده ====================
router.get(
  "/dashboard/stats",
  hasPermission("api-keys:read"),
  getDashboardStats,
);

// ==================== مدیریت API Key ====================
router.get("/api-keys", hasPermission("api-keys:read"), getApiKeys);
router.post("/api-keys", hasPermission("api-keys:write"), createApiKey);
router.patch("/api-keys/:id", hasPermission("api-keys:write"), updateApiKey);
router.delete("/api-keys/:id", hasPermission("api-keys:write"), deleteApiKey);
router.post(
  "/api-keys/:id/regenerate",
  hasPermission("api-keys:write"),
  regenerateApiKey,
);
router.get("/settings", protect, getSettings);
router.put("/settings", protect, updateSettings);
// ==================== مدیریت Webhook ====================
router.get("/webhooks", hasPermission("webhooks:read"), getWebhooks);
router.post("/webhooks", hasPermission("webhooks:write"), createWebhook);
router.patch("/webhooks/:id", hasPermission("webhooks:write"), updateWebhook);
router.delete("/webhooks/:id", hasPermission("webhooks:write"), deleteWebhook);
router.post(
  "/webhooks/:id/regenerate-secret",
  hasPermission("webhooks:write"),
  regenerateSecret,
);
router.post("/webhooks/:id/test", hasPermission("webhooks:write"), testWebhook);

// ==================== لاگ‌ها و آنالیتیکس ====================
router.get("/logs", getLogs);
router.get("/logs/analytics", getLogAnalytics);
router.delete("/logs", clearLogs);
router.get("/services-status", protect, getServicesStatus);
export default router;
