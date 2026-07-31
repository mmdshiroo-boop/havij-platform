// backend/src/controllers/watermark.controller.ts
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { WatermarkSettings } from "../models/WatermarkSettings.model";
import {
  getWatermarkSettings,
  clearWatermarkCache,
} from "../services/watermark.service";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// ════════════════════════════════════════════════════════════════════
//  دریافت تنظیمات (عمومی + ادمین)
// ════════════════════════════════════════════════════════════════════

/**
 * دریافت تنظیمات فعلی واترمارک
 * GET /api/watermark/settings
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getWatermarkSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Get watermark settings error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت تنظیمات واترمارک",
    });
  }
};

// ════════════════════════════════════════════════════════════════════
//  بروزرسانی تنظیمات (فقط ادمین / سوپرادمین)
// ════════════════════════════════════════════════════════════════════

/**
 * بروزرسانی تنظیمات واترمارک
 * PUT /api/watermark/settings
 */
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    const {
      enabled,
      text,
      opacity,
      fontSize,
      color,
      position,
      tileSize,
      rotation,
      fontWeight,
      minWidth,
      minHeight,
      applyTo,
    } = req.body;

    // اعتبارسنجی ساده
    if (opacity !== undefined && (opacity < 0 || opacity > 1)) {
      return res
        .status(400)
        .json({ success: false, message: "شفافیت باید بین ۰ تا ۱ باشد" });
    }
    if (fontSize !== undefined && (fontSize < 10 || fontSize > 120)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "اندازه فونت باید بین ۱۰ تا ۱۲۰ باشد",
        });
    }

    // پیدا یا ساخت سند
    let settings = await WatermarkSettings.findOne();
    if (!settings) {
      settings = await WatermarkSettings.create({});
    }

    // بروزرسانی فیلدهای ارسالی
    if (enabled !== undefined) settings.enabled = enabled;
    if (text !== undefined) settings.text = text.trim();
    if (opacity !== undefined) settings.opacity = opacity;
    if (fontSize !== undefined) settings.fontSize = fontSize;
    if (color !== undefined) settings.color = color;
    if (position !== undefined) settings.position = position;
    if (tileSize !== undefined) settings.tileSize = tileSize;
    if (rotation !== undefined) settings.rotation = rotation;
    if (fontWeight !== undefined) settings.fontWeight = fontWeight;
    if (minWidth !== undefined) settings.minWidth = minWidth;
    if (minHeight !== undefined) settings.minHeight = minHeight;
    if (applyTo !== undefined) settings.applyTo = applyTo;

    await settings.save();

    // پاکسازی کش
    clearWatermarkCache();

    // لاگ
    await createAuditLog({
      userId,
      action: AuditAction.SYSTEM,
      resource: "WatermarkSettings",
      resourceId: settings._id.toString(),
      description: `تنظیمات واترمارک بروزرسانی شد: فعال=${settings.enabled}, متن="${settings.text}", موقعیت=${settings.position}`,
      req,
    });

    res.json({
      success: true,
      data: settings,
      message: "تنظیمات واترمارک بروزرسانی شد",
    });
  } catch (error) {
    console.error("Update watermark settings error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در بروزرسانی تنظیمات واترمارک" });
  }
};

// ════════════════════════════════════════════════════════════════════
//  پیش‌نمایش واترمارک (برای ادمین)
// ════════════════════════════════════════════════════════════════════

/**
 * دریافت تنظیمات برای پیش‌نمایش فرانت‌اند
 * GET /api/watermark/preview-config
 */
export const getPreviewConfig = async (req: Request, res: Response) => {
  try {
    const settings = await getWatermarkSettings();

    // فقط فیلدهای لازم برای پیش‌نمایش فرانت‌اند
    res.json({
      success: true,
      data: {
        enabled: settings.enabled,
        text: settings.text,
        opacity: settings.opacity,
        fontSize: settings.fontSize,
        color: settings.color,
        position: settings.position,
        tileSize: settings.tileSize,
        rotation: settings.rotation,
        fontWeight: settings.fontWeight,
      },
    });
  } catch (error) {
    console.error("Get watermark preview config error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت تنظیمات پیش‌نمایش" });
  }
};
