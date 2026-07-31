// backend/src/services/webhook.service.ts
import crypto from "crypto";
import { Webhook, IWebhook } from "../models/Webhook.model";
import mongoose from "mongoose";
import axios from "axios";

export class WebhookService {
  // تولید secret تصادفی
  private static generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // ایجاد Webhook جدید
  static async createWebhook(
    userId: string,
    name: string,
    url: string,
    events: string[],
  ): Promise<IWebhook> {
    const secret = this.generateSecret();

    const webhook = new Webhook({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      url,
      secret,
      events,
      status: "active",
    });

    await webhook.save();
    return webhook;
  }

  // دریافت لیست Webhook های کاربر
  static async getUserWebhooks(userId: string): Promise<any[]> {
    const webhooks = await Webhook.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return webhooks.map((w) => ({
      id: w._id.toString(),
      name: w.name,
      url: w.url,
      secret: w.secret,
      events: w.events,
      status: w.status,
      lastTriggeredAt: w.lastTriggeredAt,
      lastError: w.lastError,
      deliveryCount: w.deliveryCount,
      successCount: w.successCount,
      failureCount: w.failureCount,
      createdAt: w.createdAt,
    }));
  }

  // دریافت یک Webhook
  static async getWebhookById(id: string, userId: string): Promise<any | null> {
    const webhook = await Webhook.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!webhook) return null;

    return {
      id: webhook._id.toString(),
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret,
      events: webhook.events,
      status: webhook.status,
      lastTriggeredAt: webhook.lastTriggeredAt,
      lastError: webhook.lastError,
      deliveryCount: webhook.deliveryCount,
      successCount: webhook.successCount,
      failureCount: webhook.failureCount,
      createdAt: webhook.createdAt,
      
    };
  }

  // بروزرسانی Webhook
  static async updateWebhook(
    id: string,
    userId: string,
    updates: {
      name?: string;
      url?: string;
      events?: string[];
      status?: string;
    },
  ): Promise<any | null> {
    const updated = await Webhook.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: updates },
      { new: true, lean: true },
    );

    if (!updated) return null;

    return {
      id: updated._id.toString(),
      name: updated.name,
      url: updated.url,
      events: updated.events,
      status: updated.status,
      lastTriggeredAt: updated.lastTriggeredAt,
      lastError: updated.lastError,
      deliveryCount: updated.deliveryCount,
      successCount: updated.successCount,
      failureCount: updated.failureCount,
      createdAt: updated.createdAt,
    };
  }

  // حذف Webhook
  static async deleteWebhook(id: string, userId: string): Promise<boolean> {
    const result = await Webhook.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
    return result.deletedCount > 0;
  }

  // بازسازی secret
  static async regenerateSecret(
    id: string,
    userId: string,
  ): Promise<string | null> {
    const newSecret = this.generateSecret();

    const updated = await Webhook.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: { secret: newSecret } },
      { new: true, lean: true },
    );

    if (!updated) return null;
    return newSecret;
  }

  // ارسال Webhook (برای رویدادها)
  static async sendWebhook(
    url: string,
    secret: string,
    event: string,
    payload: any,
  ): Promise<boolean> {
    try {
      const signature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
          "X-Webhook-Signature": signature,
        },
        timeout: 10000,
      });

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error(`Webhook delivery failed for ${url}:`, error);
      return false;
    }
  }

  // ثبت نتیجه ارسال
  static async recordDelivery(
    webhookId: string,
    success: boolean,
    error?: string,
  ) {
    const update: any = {
      $inc: { deliveryCount: 1 },
      $set: { lastTriggeredAt: new Date() },
    };

    if (success) {
      update.$inc.successCount = 1;
      update.$set.lastError = null;
    } else {
      update.$inc.failureCount = 1;
      update.$set.lastError = error || "Unknown error";
      if (Math.random() > 0.7) {
        update.$set.status = "failed";
      }
    }

    await Webhook.updateOne(
      { _id: new mongoose.Types.ObjectId(webhookId) },
      update,
    );
  }

  // در کلاس WebhookService

  /**
   * پردازش یک رویداد و ارسال به همه وب‌هوک‌های فعال مرتبط
   * این متد را در هر جایی که رویداد رخ می‌دهد صدا بزنید.
   */
  /**
   * ارسال یک رویداد به تمام وب‌هوک‌های فعال
   */
  static async dispatchEvent(event: string, payload: any): Promise<void> {
    try {
      const webhooks = await Webhook.find({
        status: "active",
        events: event,
      }).lean();

      if (webhooks.length === 0) {
        console.log(`ℹ️ No active webhooks for event: ${event}`);
        return;
      }

      console.log(
        `📡 Dispatching ${event} to ${webhooks.length} webhook(s)...`,
      );

      for (const webhook of webhooks) {
        const success = await this.sendWebhook(
          webhook.url,
          webhook.secret,
          event,
          payload,
        );

        await this.recordDelivery(
          webhook._id.toString(),
          success,
          success ? undefined : "Delivery failed",
        );

        if (success) {
          console.log(`✅ Webhook ${webhook.name} delivered`);
        } else {
          console.log(`❌ Webhook ${webhook.name} failed`);
        }
      }
    } catch (error) {
      console.error("dispatchEvent error:", error);
    }
  }
}
