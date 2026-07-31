// backend/src/controllers/developer.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ApiKeyService } from "../services/apiKey.service";
import { ApiKey } from "../models/ApiKey.model";
import { Webhook } from "../models/Webhook.model";
import mongoose from "mongoose";
import { Ad, User } from "../models";
import { ApiLog } from "../models/ApiLog.model";
import { getIO } from "../socket/index";
import os from "os";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";
import { sendNotificationToUser } from "../services/notification.service";

// دریافت لیست کلیدهای API
export const getApiKeys = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "کاربر یافت نشد" });
    const keys = await ApiKeyService.getUserApiKeys(userId.toString());
    res.json(keys);
  } catch (error) {
    console.error("Error getting API keys:", error);
    res.status(500).json({ error: "خطا در دریافت کلیدهای API" });
  }
};

// ساخت کلید API جدید
export const createApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "کاربر یافت نشد" });

    const { name, scopes, expiresInDays } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ error: "نام کلید الزامی است" });
    if (!scopes || scopes.length === 0)
      return res.status(400).json({ error: "حداقل یک دسترسی انتخاب کنید" });

    const { apiKey, plainKey } = await ApiKeyService.createApiKey(
      userId.toString(),
      name.trim(),
      scopes,
      expiresInDays,
    );

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "ApiKey",
      resourceId: apiKey._id.toString(),
      description: `توسعه‌دهنده ${req.user?.firstName || req.user?.phone} یک کلید API جدید با نام "${name.trim()}" ایجاد کرد.`,
      metadata: { scopes, expiresInDays },
      req,
    });

    // 🆕 اعلان
    await sendNotificationToUser(
      userId.toString(),
      "🔑 کلید API جدید ایجاد شد",
      `کلید "${name.trim()}" با دسترسی‌های ${scopes.join("، ")} ساخته شد.`,
      "info",
      "/panel/developer/api-keys",
    );

    res.status(201).json({
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        scopes: apiKey.scopes,
        status: apiKey.status,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      plainKey,
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    res.status(500).json({ error: "خطا در ساخت کلید API" });
  }
};

// بروزرسانی کلید API
export const updateApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "کاربر یافت نشد" });

    // ✅ تبدیل ایمن req.params.id به رشته
    const id = String(req.params.id);
    const { name, scopes, status } = req.body;
    const updated = await ApiKeyService.updateApiKey(id, userId.toString(), {
      name,
      scopes,
      status,
    });

    if (!updated) return res.status(404).json({ error: "کلید API یافت نشد" });

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "ApiKey",
      resourceId: id,
      description: `توسعه‌دهنده ${req.user?.firstName || req.user?.phone} کلید API "${updated.name || id}" را ویرایش کرد.`,
      metadata: { changes: req.body },
      req,
    });

    // 🆕 اعلان
    await sendNotificationToUser(
      userId.toString(),
      "✏️ کلید API ویرایش شد",
      `کلید "${updated.name || id}" با موفقیت به‌روزرسانی شد.`,
      "info",
      "/panel/developer/api-keys",
    );

    res.json(updated);
  } catch (error) {
    console.error("Error updating API key:", error);
    res.status(500).json({ error: "خطا در بروزرسانی کلید API" });
  }
};

// حذف کلید API
export const deleteApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "کاربر یافت نشد" });

    // ✅ تبدیل ایمن req.params.id به رشته
    const id = String(req.params.id);
    const deleted = await ApiKeyService.deleteApiKey(id, userId.toString());

    if (!deleted) return res.status(404).json({ error: "کلید API یافت نشد" });

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "ApiKey",
      resourceId: id,
      description: `توسعه‌دهنده ${req.user?.firstName || req.user?.phone} یک کلید API را حذف کرد.`,
      req,
    });

    // 🆕 اعلان
    await sendNotificationToUser(
      userId.toString(),
      "🗑️ کلید API حذف شد",
      "کلید API با موفقیت حذف گردید.",
      "info",
      "/panel/developer/api-keys",
    );

    res.json({ message: "کلید API با موفقیت حذف شد" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    res.status(500).json({ error: "خطا در حذف کلید API" });
  }
};

// بازسازی کلید API
export const regenerateApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "کاربر یافت نشد" });

    // ✅ تبدیل ایمن req.params.id به رشته
    const id = String(req.params.id);
    const result = await ApiKeyService.regenerateApiKey(id, userId.toString());

    if (!result) return res.status(404).json({ error: "کلید API یافت نشد" });

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "ApiKey",
      resourceId: id,
      description: `توسعه‌دهنده ${req.user?.firstName || req.user?.phone} کلید API خود را بازسازی کرد.`,
      req,
    });

    // 🆕 اعلان
    await sendNotificationToUser(
      userId.toString(),
      "🔄 کلید API بازسازی شد",
      "کلید جدید با موفقیت تولید شد. کلید قدیمی دیگر معتبر نیست.",
      "warning",
      "/panel/developer/api-keys",
    );

    res.json({
      newKey: result.newPlainKey,
      message: "کلید API با موفقیت بازسازی شد",
    });
  } catch (error) {
    console.error("Error regenerating API key:", error);
    res.status(500).json({ error: "خطا در بازسازی کلید API" });
  }
};

// دریافت آمار داشبورد توسعه‌دهنده
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalRequests = await ApiLog.countDocuments();
    const activeKeys = await ApiKey.countDocuments({ status: "active" });
    const webhooks = await Webhook.countDocuments({ status: "active" });
    const totalLogs = await ApiLog.countDocuments();
    const successLogs = await ApiLog.countDocuments({
      statusCode: { $lt: 400 },
    });
    const successRate =
      totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 100;
    const uptime = process.uptime();
    const serverUptime = Math.floor(uptime).toString();
    let databaseSize = "نامشخص";
    try {
      const stats = await mongoose.connection.db.stats();
      databaseSize = `${(stats.dataSize / 1024 / 1024).toFixed(1)} MB`;
    } catch {}
    const cpuCount = os.cpus().length;
    const loadAvg = os.loadavg()[0];
    const cpuUsage = cpuCount > 0 ? Math.round((loadAvg / cpuCount) * 100) : 0;
    const memoryUsage = Math.round(
      process.memoryUsage().heapUsed / 1024 / 1024,
    );
    let totalUsers = 0,
      totalAds = 0,
      totalViews = 0,
      pendingAds = 0;
    if (req.user?.role === "admin" || req.user?.role === "super_admin") {
      totalUsers = await User.countDocuments();
      totalAds = await Ad.countDocuments();
      totalViews =
        (
          await Ad.aggregate([
            { $group: { _id: null, total: { $sum: "$views" } } },
          ])
        )?.[0]?.total || 0;
      pendingAds = await Ad.countDocuments({ status: "pending" });
    }
    res.json({
      totalRequests,
      activeKeys,
      webhooks,
      successRate,
      serverUptime,
      databaseSize,
      cpuUsage,
      memoryUsage,
      totalUsers,
      totalAds,
      totalViews,
      pendingAds,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "خطا در دریافت آمار" });
  }
};

// دریافت تنظیمات کاربر توسعه‌دهنده
export const getSettings = async (req: AuthRequest, res: Response) => {
  // ✅ رفع خطا: استفاده از any برای دسترسی به فیلد settings (هنوز در مدل وجود ندارد)
  const user = (await User.findById(req.user._id)
    .select("settings")
    .lean()) as any;
  res.json({ settings: user?.settings || {} });
};

// ذخیره تنظیمات کاربر توسعه‌دهنده
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { settings } = req.body;
    // ✅ به‌روزرسانی تنظیمات با استفاده از any
    await User.findByIdAndUpdate(req.user._id, { settings } as any);

    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.USER_UPDATE_PROFILE,
      resource: "User",
      resourceId: req.user._id.toString(),
      description: `توسعه‌دهنده ${req.user?.firstName || req.user?.phone} تنظیمات خود را تغییر داد.`,
      metadata: { settings },
      req,
    });

    // 🆕 اعلان
    await sendNotificationToUser(
      req.user._id.toString(),
      "⚙️ تنظیمات ذخیره شد",
      "تنظیمات حساب شما با موفقیت به‌روزرسانی گردید.",
      "success",
      "/panel/developer/settings",
    );

    res.json({ message: "تنظیمات ذخیره شد" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "خطا در ذخیره تنظیمات" });
  }
};

// وضعیت سرویس‌های زیرساخت
export const getServicesStatus = async (req: AuthRequest, res: Response) => {
  try {
    const services = [];
    const mongoStatus = mongoose.connection.readyState === 1;
    services.push({
      name: "MongoDB Primary",
      status: mongoStatus ? "Connected" : "Disconnected",
      ok: mongoStatus,
    });
    services.push({ name: "Redis Cache", status: "Not configured", ok: false });
    const io = getIO();
    services.push({
      name: "Socket.io Server",
      status: io ? "Listening" : "Not running",
      ok: !!io,
    });
    res.json({ services });
  } catch (error) {
    console.error("getServicesStatus error:", error);
    res.status(500).json({ error: "خطا در بررسی وضعیت سرویس‌ها" });
  }
};
