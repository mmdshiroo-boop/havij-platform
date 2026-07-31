// backend/src/routes/property.routes.ts
import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import {
  getAgentProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImage,
  getAllProperties,
  updatePropertyStatus,
  getMarketAnalysis,
} from "../controllers/property.controller";

const router = Router();

// ─── مسیرهای کاملاً عمومی (بدون هیچ احراز هویتی) ───
router.get("/market-analysis", getMarketAnalysis);

// ─── املاک آژانس (مشاهده) - نیاز به نقش agent ───
router.get("/agent", protect, requireRole("agent"), getAgentProperties); // 🆕 مسیر اصلاح شد

// ─── مشاهده همه املاک (ادمین) ───
router.get("/admin/all", protect, hasPermission("ads:read"), getAllProperties);

// ─── آپلود تصویر ───
router.post(
  "/upload-image",
  protect,
  hasPermission("ads:write"),
  uploadPropertyImage,
);

// ─── ایجاد ملک جدید ───
router.post("/", protect, hasPermission("ads:write"), createProperty);

// ─── تغییر وضعیت ملک (ادمین/کارشناس) ───
router.patch(
  "/admin/:id/status",
  protect,
  hasPermission("ads:approve"),
  updatePropertyStatus,
);

// ─── ویرایش ملک ───
router.put("/:id", protect, hasPermission("ads:write"), updateProperty);

// ─── حذف ملک ───
router.delete("/:id", protect, hasPermission("ads:delete"), deleteProperty);

// ─── دریافت یک ملک (عمومی) - باید آخرین مسیر GET باشد ───
router.get("/:id", getPropertyById);

export default router;
