// src/routes/comment.routes.ts
import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import {
  addComment,
  getAdComments,
  getMyAdsComments,
  getAllComments,
  approveComment,
  rejectComment,
  deleteComment,
} from "../controllers/comment.controller";

const router = Router();

// مسیرهای عمومی
router.post("/", protect, addComment);
router.get("/ad/:adId", getAdComments);
router.get("/my-ads", protect, getMyAdsComments);

// -------------------------------------------------------------
// مسیرهای مدیریتی (ادمین / سوپرادمین)
// -------------------------------------------------------------

// اگر کاربر لاگین کرده و ادمین/سوپرادمین است، اجازه دسترسی بدهد
router.get(
  "/admin/all",
  protect,
  // در صورت تمایل می‌توانید شرط hasPermission را حذف کنید یا نقش ادمین را چک کنید:
  (req: any, res: any, next: any) => {
    if (["admin", "super_admin"].includes(req.user?.role)) {
      return next();
    }
    return hasPermission("comments:read")(req, res, next);
  },
  getAllComments,
);

router.patch(
  "/admin/:id/approve",
  protect,
  (req: any, res: any, next: any) => {
    if (["admin", "super_admin"].includes(req.user?.role)) return next();
    return hasPermission("comments:write")(req, res, next);
  },
  approveComment,
);

router.patch(
  "/admin/:id/reject",
  protect,
  (req: any, res: any, next: any) => {
    if (["admin", "super_admin"].includes(req.user?.role)) return next();
    return hasPermission("comments:write")(req, res, next);
  },
  rejectComment,
);

router.delete(
  "/admin/:id",
  protect,
  (req: any, res: any, next: any) => {
    if (["admin", "super_admin"].includes(req.user?.role)) return next();
    return hasPermission("comments:write")(req, res, next);
  },
  deleteComment,
);

export default router;
