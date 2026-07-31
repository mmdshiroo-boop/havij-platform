// backend/src/controllers/settings.controller.ts
import { Response } from "express";
import { Settings } from "../models/Settings.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت تنظیمات" });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(updates);
      await settings.save();
    } else {
      // به‌روزرسانی تک‌تک فیلدها برای حفظ ساختارهای تو در تو مانند socialLinks و pages
      Object.keys(updates).forEach((key) => {
        if (key === "socialLinks" || key === "pages") {
          (settings as any)[key] = {
            ...(settings as any)[key],
            ...updates[key],
          };
        } else {
          (settings as any)[key] = updates[key];
        }
      });
      await settings.save();
    }

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Settings",
      description: `ادمین ${req.user?.firstName || req.user?.phone || "ناشناس"} تنظیمات سایت را تغییر داد.`,
      metadata: { changes: updates },
      req,
    });

    res.json({
      success: true,
      message: "تنظیمات با موفقیت ذخیره شد",
      data: settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ success: false, message: "خطا در ذخیره تنظیمات" });
  }
};
