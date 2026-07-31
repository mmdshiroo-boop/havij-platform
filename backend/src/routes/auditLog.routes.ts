// backend/src/auditLog.routes.ts
import { Router, Request, Response } from "express";
import { hasPermission, protect } from "../middleware/auth.middleware";
import { AuditAction, AuditLog } from "../models/AuditLog.model";

const router = Router();

// دریافت لاگ‌ها (مخصوص ادمین‌ها و سوپرادمین‌ها)
router.get(
  "/",
  protect,
  hasPermission("logs:read"),
  async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 25,
        action,
        userId,
        resource,
        startDate,
        endDate,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      const filter: any = {};
      if (action) filter.action = { $in: (action as string).split(",") };
      if (userId) filter.user = userId;
      if (resource) filter.resource = resource;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }
      if (search) filter.description = { $regex: search, $options: "i" };
      const sort: any = { [sortBy as string]: sortOrder === "asc" ? 1 : -1 };

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .populate("user", "firstName lastName phone role")
          .sort(sort)
          .skip((+page - 1) * +limit)
          .limit(+limit)
          .lean(),
        AuditLog.countDocuments(filter),
      ]);
      res.json({
        success: true,
        data: logs,
        meta: {
          total,
          page: +page,
          limit: +limit,
          totalPages: Math.ceil(total / +limit),
          actions: Object.values(AuditAction),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "خطا در دریافت لاگ‌ها" });
    }
  },
);
export default router;
