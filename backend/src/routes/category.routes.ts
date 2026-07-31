// backend/src/routes/category.routes.ts
import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteCategoryWithChildren,
} from "../controllers/category.controller";
import { protect, hasPermission } from "../middleware/auth.middleware";

const router = Router();

// مسیرهای عمومی (بدون نیاز به ورود)
router.get("/", getCategories);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/:id", getCategoryById);

// مسیرهای مدیریتی (نیاز به ورود و مجوز نوشتن دسته‌بندی)
router.post("/", protect, hasPermission("categories:write"), createCategory);
router.put("/:id", protect, hasPermission("categories:write"), updateCategory);
router.delete(
  "/:id",
  protect,
  hasPermission("categories:write"),
  deleteCategory,
);
router.delete(
  "/:id/with-children",
  protect,
  hasPermission("categories:write"),
  deleteCategoryWithChildren,
);

export default router;
