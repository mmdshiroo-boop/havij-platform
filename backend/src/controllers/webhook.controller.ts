// backend/src/controllers/webhook.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { WebhookService } from "../services/webhook.service";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// دریافت لیست Webhookها
export const getWebhooks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }

    const webhooks = await WebhookService.getUserWebhooks(userId.toString());
    res.json(webhooks);
  } catch (error) {
    console.error("Error getting webhooks:", error);
    res.status(500).json({ error: "خطا در دریافت Webhookها" });
  }
};

// ساخت Webhook جدید
export const createWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }

    const { name, url, events } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "نام Webhook الزامی است" });
    }

    if (!url || !url.trim()) {
      return res.status(400).json({ error: "آدرس URL الزامی است" });
    }

    if (!events || events.length === 0) {
      return res.status(400).json({ error: "حداقل یک رویداد انتخاب کنید" });
    }

    // اعتبارسنجی URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "آدرس URL نامعتبر است" });
    }

    const webhook = await WebhookService.createWebhook(
      userId.toString(),
      name.trim(),
      url.trim(),
      events,
    );

    // لاگ تجاری
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "Webhook",
      resourceId: webhook._id.toString(),
      description: `کاربر ${req.user?.firstName || req.user?.phone} یک Webhook جدید با نام "${name.trim()}" ایجاد کرد.`,
      req,
    });

    res.status(201).json({
      webhook: {
        id: webhook._id,
        name: webhook.name,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.events,
        status: webhook.status,
        createdAt: webhook.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating webhook:", error);
    res.status(500).json({ error: "خطا در ساخت Webhook" });
  }
};

// بروزرسانی Webhook
export const updateWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, url, events, status } = req.body;

    const updated = await WebhookService.updateWebhook(id, userId.toString(), {
      name,
      url,
      events,
      status,
    });

    if (!updated) {
      return res.status(404).json({ error: "Webhook یافت نشد" });
    }

    // لاگ بروزرسانی (اختیاری)
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "Webhook",
      resourceId: id,
      description: `کاربر ${req.user?.firstName || req.user?.phone} Webhook "${updated.name}" را ویرایش کرد.`,
      metadata: { changes: req.body },
      req,
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating webhook:", error);
    res.status(500).json({ error: "خطا در بروزرسانی Webhook" });
  }
};

// حذف Webhook
export const deleteWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await WebhookService.deleteWebhook(id, userId.toString());

    if (!deleted) {
      return res.status(404).json({ error: "Webhook یافت نشد" });
    }

    // لاگ تجاری
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "Webhook",
      resourceId: id,
      description: `کاربر ${req.user?.firstName || req.user?.phone} یک Webhook را حذف کرد.`,
      req,
    });

    res.json({ message: "Webhook با موفقیت حذف شد" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    res.status(500).json({ error: "خطا در حذف Webhook" });
  }
};

// بازسازی Secret
export const regenerateSecret = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const newSecret = await WebhookService.regenerateSecret(
      id,
      userId.toString(),
    );

    if (!newSecret) {
      return res.status(404).json({ error: "Webhook یافت نشد" });
    }

    // لاگ تجاری برای بازسازی secret
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "Webhook",
      resourceId: id,
      description: `کاربر ${req.user?.firstName || req.user?.phone} Secret یک Webhook را بازسازی کرد.`,
      req,
    });

    res.json({ secret: newSecret });
  } catch (error) {
    console.error("Error regenerating secret:", error);
    res.status(500).json({ error: "خطا در بازسازی Secret" });
  }
};

// تست Webhook
export const testWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const webhook = await WebhookService.getWebhookById(id, userId.toString());

    if (!webhook) {
      return res.status(404).json({ error: "Webhook یافت نشد" });
    }

    const testPayload = {
      event: "test",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook" },
    };

    const success = await WebhookService.sendWebhook(
      webhook.url,
      webhook.secret,
      "test",
      testPayload,
    );

    if (success) {
      // لاگ تست موفق
      await createAuditLog({
        userId: userId.toString(),
        action: AuditAction.SYSTEM,
        resource: "Webhook",
        resourceId: id,
        description: `تست Webhook "${webhook.name}" با موفقیت انجام شد.`,
        req,
      });
      res.json({ success: true, message: "Webhook با موفقیت ارسال شد" });
    } else {
      res
        .status(500)
        .json({ success: false, error: "ارسال Webhook ناموفق بود" });
    }
  } catch (error) {
    console.error("Error testing webhook:", error);
    res.status(500).json({ error: "خطا در تست Webhook" });
  }
};
