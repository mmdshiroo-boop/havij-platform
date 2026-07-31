// backend/src/controllers/notification.controller.ts
import { Response } from "express";
import { Notification } from "../models/Notification.model";
import { User } from "../models/User.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// ─────────────────────────────────────────────────────────────
// تنظیمات اعلان
// ─────────────────────────────────────────────────────────────

export const getNotificationSettings = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const user = await User.findById(req.user?._id).select(
      "notificationSettings",
    );
    res.json({
      success: true,
      data: user?.notificationSettings || {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        newAdAlerts: true,
        adStatusAlerts: true,
        messageAlerts: true,
      },
    });
  } catch (error) {
    console.error("getNotificationSettings error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت تنظیمات" });
  }
};

export const updateNotificationSettings = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // فقط فیلدهای مجاز، و فقط آن‌هایی که واقعاً ارسال شده‌اند
    const allowedKeys = [
      "emailNotifications",
      "smsNotifications",
      "marketingEmails",
      "newAdAlerts",
      "adStatusAlerts",
      "messageAlerts",
      "messageAlertSchedule",
    ] as const;

    const updates: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        // dot-notation ⇒ فقط همین کلید تغییر می‌کند، بقیه دست‌نخورده می‌ماند
        updates[`notificationSettings.${key}`] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("notificationSettings");

    await createAuditLog({
      userId: req.user?._id.toString(),
      action: AuditAction.USER_UPDATE_PROFILE,
      resource: "User",
      resourceId: req.user?._id.toString(),
      description: `کاربر ${req.user?.firstName || req.user?.phone} تنظیمات اعلان‌های خود را تغییر داد.`,
      metadata: { changes: updates },
      req,
    });

    res.json({
      success: true,
      data: user?.notificationSettings,
      message: "تنظیمات ذخیره شد",
    });
  } catch (error) {
    console.error("updateNotificationSettings error:", error);
    res.status(500).json({ success: false, message: "خطا در ذخیره تنظیمات" });
  }
};

// ─────────────────────────────────────────────────────────────
// دریافت اعلان‌ها (فیلتر براساس نقش کاربر)
// ─────────────────────────────────────────────────────────────

export const getNotifications = async (req: AuthRequest, res: Response) => {
  // بدون تغییر (خواندنی)
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query: any = { userId, targetRole: userRole };
    if (unreadOnly === "true") query.isRead = false;

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({
        userId,
        targetRole: userRole,
        isRead: false,
      }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت اعلان‌ها" });
  }
};

// ─────────────────────────────────────────────────────────────
// تعداد اعلان‌های خوانده نشده
// ─────────────────────────────────────────────────────────────

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user?._id,
      targetRole: req.user?.role,
      isRead: false,
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا" });
  }
};

// ─────────────────────────────────────────────────────────────
// خواندن اعلان (بدون لاگ – بسیار پرتکرار)
// ─────────────────────────────────────────────────────────────

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { isRead: true },
      { new: true },
    );
    if (!notification)
      return res
        .status(404)
        .json({ success: false, message: "اعلان یافت نشد" });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا" });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { userId: req.user?._id, targetRole: req.user?.role, isRead: false },
      { isRead: true },
    );
    // این عملیات معمولاً لاگ نمی‌شود، ولی در صورت نیاز می‌توانید اضافه کنید
    res.json({ success: true, message: "همه اعلان‌ها خوانده شدند" });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا" });
  }
};

// ─────────────────────────────────────────────────────────────
// حذف اعلان
// ─────────────────────────────────────────────────────────────

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?._id,
    });
    if (!notification)
      return res
        .status(404)
        .json({ success: false, message: "اعلان یافت نشد" });

    // لاگ حذف یک اعلان (اختیاری)
    await createAuditLog({
      userId: req.user?._id.toString(),
      action: AuditAction.SYSTEM,
      resource: "Notification",
      resourceId: req.params.id,
      description: `کاربر ${req.user?.firstName || req.user?.phone} یک اعلان را حذف کرد.`,
      req,
    });

    res.json({ success: true, message: "اعلان حذف شد" });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا" });
  }
};

export const deleteAllReadNotifications = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    await Notification.deleteMany({
      userId: req.user?._id,
      targetRole: req.user?.role,
      isRead: true,
    });

    // لاگ پاکسازی اعلان‌های خوانده‌شده
    await createAuditLog({
      userId: req.user?._id.toString(),
      action: AuditAction.SYSTEM,
      resource: "Notification",
      description: `کاربر ${req.user?.firstName || req.user?.phone} تمام اعلان‌های خوانده‌شده خود را پاک کرد.`,
      req,
    });

    res.json({ success: true, message: "اعلان‌های خوانده شده حذف شدند" });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا" });
  }
};
