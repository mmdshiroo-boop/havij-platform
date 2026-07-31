// backend/src/middleware/role.middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { User } from "../models/User.model";

// ==================== بررسی نقش کاربر (چند نقش) ====================
export const requireRole = (...roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "لطفاً وارد شوید" });
      }

      console.log("🔐 requireRole - User role:", req.user.role);
      console.log("🔐 Allowed roles:", roles);
      console.log("🔐 User ID:", req.user._id);
      console.log("🔐 User phone:", req.user.phone);

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `شما دسترسی به این بخش را ندارید. نقش شما: ${req.user.role}`,
          // برای دیباگ - در production حذف کنید
          allowedRoles: roles,
          yourRole: req.user.role,
        });
      }

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      res.status(500).json({ success: false, message: "خطا در بررسی دسترسی" });
    }
  };
};
// میدلور بررسی اینکه کاربر ادمین یا سوپرادمین باشد
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    console.log("🔐 requireAdmin - User role:", req.user.role);

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ success: false, message: "دسترسی فقط برای ادمین‌ها" });
    }

    next();
  } catch (error) {
    console.error("Require admin error:", error);
    res.status(500).json({ success: false, message: "خطا در بررسی دسترسی" });
  }
};
// میدلور بررسی اینکه کاربر سوپرادمین باشد
export const requireSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "شما وارد نشده‌اید",
      });
    }

    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "دسترسی فقط برای سوپرادمین",
      });
    }

    next();
  } catch (error) {
    console.error("Require super admin error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در بررسی دسترسی",
    });
  }
};

// میدلور بررسی اینکه کاربر آژانس باشد
export const requireAgent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "شما وارد نشده‌اید",
      });
    }

    if (
      req.user.role !== "agent" &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "دسترسی فقط برای آژانس‌ها",
      });
    }

    next();
  } catch (error) {
    console.error("Require agent error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در بررسی دسترسی",
    });
  }
};

// میدلور بررسی اینکه کاربر کارشناس باشد
export const requireExpert = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "شما وارد نشده‌اید",
      });
    }

    if (
      req.user.role !== "expert" &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "دسترسی فقط برای کارشناسان",
      });
    }

    next();
  } catch (error) {
    console.error("Require expert error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در بررسی دسترسی",
    });
  }
};

// میدلور بررسی اینکه کاربر ویژه (VIP) باشد
export const requireVip = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "شما وارد نشده‌اید",
      });
    }

    if (
      req.user.role !== "vip" &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "این بخش فقط برای کاربران ویژه است",
      });
    }

    next();
  } catch (error) {
    console.error("Require vip error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در بررسی دسترسی",
    });
  }
};

// میدلور بررسی اینکه کاربر برنامه‌نویس باشد
export const requireDeveloper = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "شما وارد نشده‌اید",
      });
    }

    if (
      req.user.role !== "developer" &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "دسترسی فقط برای برنامه‌نویسان",
      });
    }

    next();
  } catch (error) {
    console.error("Require developer error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در بررسی دسترسی",
    });
  }
};
