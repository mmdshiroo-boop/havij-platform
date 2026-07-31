// backend/src/services/apiKey.service.ts
import crypto from "crypto";
import { ApiKey, IApiKey } from "../models/ApiKey.model";
import mongoose from "mongoose";

export class ApiKeyService {
  // تولید کلید یکتا (فرمت: divar_dev_xxxxx)
  private static generateApiKey(): {
    fullKey: string;
    prefix: string;
    hash: string;
  } {
    const prefix = "divar_dev";
    const randomPart = crypto.randomBytes(24).toString("hex");
    const fullKey = `${prefix}_${randomPart}`;
    const hash = crypto.createHash("sha256").update(fullKey).digest("hex");

    return {
      fullKey,
      prefix,
      hash,
    };
  }

  // ایجاد کلید جدید
  static async createApiKey(
    userId: string,
    name: string,
    scopes: string[],
    expiresInDays?: number,
  ): Promise<{ apiKey: IApiKey; plainKey: string }> {
    const { fullKey, prefix, hash } = this.generateApiKey();

    let expiresAt: Date | undefined;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const apiKey = new ApiKey({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      keyHash: hash,
      keyPrefix: prefix,
      scopes,
      status: "active",
      expiresAt,
    });

    await apiKey.save();

    return { apiKey, plainKey: fullKey };
  }

  // دریافت لیست کلیدهای کاربر
  static async getUserApiKeys(userId: string): Promise<any[]> {
    const keys = await ApiKey.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return keys.map((key) => ({
      id: key._id.toString(),
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      status: key.status,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      requestCount: key.requestCount,
    }));
  }

  // دریافت یک کلید با آیدی
  static async getApiKeyById(id: string, userId: string): Promise<any | null> {
    const key = await ApiKey.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!key) return null;

    return {
      id: key._id.toString(),
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      status: key.status,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      requestCount: key.requestCount,
    };
  }

  // بروزرسانی کلید
  static async updateApiKey(
    id: string,
    userId: string,
    updates: { name?: string; scopes?: string[]; status?: string },
  ): Promise<any | null> {
    const updated = await ApiKey.findOneAndUpdate(
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
      keyPrefix: updated.keyPrefix,
      scopes: updated.scopes,
      status: updated.status,
      lastUsedAt: updated.lastUsedAt,
      expiresAt: updated.expiresAt,
      createdAt: updated.createdAt,
      requestCount: updated.requestCount,
    };
  }

  // حذف کلید
  static async deleteApiKey(id: string, userId: string): Promise<boolean> {
    const result = await ApiKey.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
    return result.deletedCount > 0;
  }

  // بازسازی کلید (ریجنریت)
  static async regenerateApiKey(
    id: string,
    userId: string,
  ): Promise<{ newPlainKey: string; updatedKey: any } | null> {
    const existingKey = await this.getApiKeyById(id, userId);
    if (!existingKey) return null;

    const { fullKey, prefix, hash } = this.generateApiKey();

    const updated = await ApiKey.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          keyHash: hash,
          keyPrefix: prefix,
          lastUsedAt: null,
          requestCount: 0,
          status: "active",
        },
      },
      { new: true, lean: true },
    );

    if (!updated) return null;

    return {
      newPlainKey: fullKey,
      updatedKey: {
        id: updated._id.toString(),
        name: updated.name,
        keyPrefix: updated.keyPrefix,
        scopes: updated.scopes,
        status: updated.status,
        lastUsedAt: updated.lastUsedAt,
        expiresAt: updated.expiresAt,
        createdAt: updated.createdAt,
        requestCount: updated.requestCount,
      },
    };
  }

  // ثبت استفاده از کلید
  static async recordUsage(keyHash: string): Promise<void> {
    await ApiKey.findOneAndUpdate(
      { keyHash },
      {
        $inc: { requestCount: 1 },
        $set: { lastUsedAt: new Date() },
      },
    );
  }

  // بررسی اعتبار کلید
  static async validateApiKey(plainKey: string): Promise<{
    valid: boolean;
    key?: any;
    error?: string;
  }> {
    const hash = crypto.createHash("sha256").update(plainKey).digest("hex");
    const apiKey = await ApiKey.findOne({ keyHash: hash }).lean();

    if (!apiKey) {
      return { valid: false, error: "کلید API معتبر نیست" };
    }

    if (apiKey.status !== "active") {
      return { valid: false, error: "کلید API غیرفعال شده است" };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      await ApiKey.updateOne({ _id: apiKey._id }, { status: "expired" });
      return { valid: false, error: "کلید API منقضی شده است" };
    }

    return {
      valid: true,
      key: {
        id: apiKey._id.toString(),
        userId: apiKey.userId.toString(),
        scopes: apiKey.scopes,
      },
    };
  }
}
