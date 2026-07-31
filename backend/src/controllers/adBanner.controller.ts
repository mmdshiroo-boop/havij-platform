// backend/src/controllers/adBanner.controller.ts
import { Request, Response } from "express";
import { AdBanner } from "../models/AdBanner.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// دریافت بنرها بر اساس موقعیت
export const getBannersByPosition = async (req: Request, res: Response) => {
  try {
    const position = String(req.params.position); // ✅ تبدیل به رشته

    // ✅ استفاده از as any برای دور زدن strict تایپینگ Mongoose
    const banners = await (AdBanner as any)
      .find({
        position,
        isActive: true,
      })
      .sort({ priority: 1 });

    res.json({ success: true, data: banners });
  } catch (error) {
    console.error("Error getting banners:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت بنرها" });
  }
};

// ثبت بازدید بنر
export const trackBannerView = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id); // ✅ تبدیل به رشته
    await (AdBanner as any).findByIdAndUpdate(id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({ success: false });
  }
};

// ثبت کلیک روی بنر
export const trackBannerClick = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id); // ✅ تبدیل به رشته
    await (AdBanner as any).findByIdAndUpdate(id, { $inc: { clicks: 1 } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({ success: false });
  }
};

// ============ مدیریت (فقط ادمین) ============

// دریافت همه بنرها
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const banners = await AdBanner.find().sort({ createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error("Error getting all banners:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت بنرها" });
  }
};

// ایجاد بنر جدید
export const createBanner = async (req: AuthRequest, res: Response) => {
  try {
    const banner = await AdBanner.create(req.body);

    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "AdBanner",
      resourceId: banner._id.toString(),
      description: `ادمین ${req.user?.firstName || req.user?.phone || "ناشناس"} یک بنر تبلیغاتی جدید ایجاد کرد (موقعیت: ${(banner as any).position}).`,
      req,
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ success: false, message: "خطا در ایجاد بنر" });
  }
};

// ویرایش بنر
export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id); // ✅ تبدیل به رشته

    // ✅ استفاده از as any برای رفع خطای overload ناسازگار
    const banner = await (AdBanner as any).findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: "بنر یافت نشد" });
    }

    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "AdBanner",
      resourceId: banner._id.toString(),
      description: `ادمین ${req.user?.firstName || req.user?.phone || "ناشناس"} بنر "${banner.title || banner._id}" را ویرایش کرد.`,
      metadata: { changes: req.body },
      req,
    });

    res.json({ success: true, data: banner });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ success: false, message: "خطا در ویرایش بنر" });
  }
};

// حذف بنر
export const deleteBanner = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id); // ✅ تبدیل به رشته

    // ✅ استفاده از as any برای رفع خطای overload ناسازگار
    const banner = await (AdBanner as any).findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "بنر یافت نشد" });
    }

    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "AdBanner",
      resourceId: id,
      description: `ادمین ${req.user?.firstName || req.user?.phone || "ناشناس"} بنر "${banner.title || banner._id}" را حذف کرد.`,
      req,
    });

    res.json({ success: true, message: "بنر حذف شد" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ success: false, message: "خطا در حذف بنر" });
  }
};
