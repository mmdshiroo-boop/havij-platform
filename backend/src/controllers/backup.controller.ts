// backend/src/controllers/backup.controller.ts
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";
import { notifySuperAdmins } from "../services/notification.service";
const BACKUP_DIR = path.join(__dirname, "../../backups");

export const getBackups = async (req: AuthRequest, res: Response) => {
  try {
    if (!fs.existsSync(BACKUP_DIR))
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const files = fs.readdirSync(BACKUP_DIR).map((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: `${(stats.size / 1024).toFixed(1)} KB`,
        createdAt: stats.birthtime.toISOString(),
      };
    });
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در دریافت بکاپ‌ها" });
  }
};

export const createBackup = async (req: AuthRequest, res: Response) => {
  try {
    if (!fs.existsSync(BACKUP_DIR))
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const db = mongoose.connection.db;
    const collections = [
      "users",
      "ads",
      "settings",
      "transactions",
      "vipplans",
      "subscriptionplans",
    ];
    const backupData: any = {};
    for (const colName of collections) {
      try {
        const docs = await db.collection(colName).find({}).toArray();
        backupData[colName] = docs;
      } catch {}
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Backup",
      resourceId: filename,
      description: `ادمین ${req.user?.firstName || req.user?.phone || "ناشناس"} یک بکاپ جدید با نام ${filename} ایجاد کرد.`,
      req,
    });

    // 🆕 اعلان به سوپرادمین‌ها
    await notifySuperAdmins(
      "💾 بکاپ جدید ایجاد شد",
      `بکاپ با نام ${filename} توسط ${req.user?.firstName || req.user?.phone || "ناشناس"} ایجاد شد.`,
      "backup_created",
      "/super-admin/backup",
      { filename },
    );

    res.json({ success: true, message: "بکاپ با موفقیت ایجاد شد", filename });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در ایجاد بکاپ" });
  }
};

export const deleteBackup = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ تبدیل به رشته
    const filename = String(req.params.filename);
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "فایل بکاپ یافت نشد" });
    }
    fs.unlinkSync(filePath);

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Backup",
      resourceId: filename,
      description: `ادمین ${req.user?.firstName || req.user?.phone || "ناشناس"} بکاپ ${filename} را حذف کرد.`,
      req,
    });

    // 🆕 اعلان به سوپرادمین‌ها
    await notifySuperAdmins(
      "🗑️ بکاپ حذف شد",
      `بکاپ ${filename} توسط ${req.user?.firstName || req.user?.phone || "ناشناس"} حذف شد.`,
      "system_alert",
      "/super-admin/backup",
      { filename },
    );

    res.json({ success: true, message: "بکاپ حذف شد" });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در حذف بکاپ" });
  }
};

export const downloadBackup = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ تبدیل به رشته
    const filename = String(req.params.filename);
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "فایل بکاپ یافت نشد" });
    }

    // Audit log (اختیاری)
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Backup",
      resourceId: filename,
      description: `ادمین ${req.user?.firstName || req.user?.phone || "ناشناس"} بکاپ ${filename} را دانلود کرد.`,
      req,
    });

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در دانلود" });
  }
};
