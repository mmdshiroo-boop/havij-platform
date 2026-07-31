// application/backend/src/controllers/subscription.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { SubscriptionService } from "../services/subscription.service";
import {
  initiatePurchaseSchema,
  verifyPaymentSchema,
} from "../validators/subscription.validator";
import { AppError } from "../utils/AppError";
import { TransactionService } from "../services/transaction.service";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";
import {
  sendNotificationToUser,
  notifyAdmins,
} from "../services/notification.service";

export class SubscriptionController {
  static async getPlans(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plans = await SubscriptionService.getActivePlans(
        req.query.role as string,
      );
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  static async initiatePurchase(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const parsed = initiatePurchaseSchema.safeParse(req.body);
      if (!parsed.success)
        throw new AppError(
          parsed.error.issues[0]?.message || "ورودی نامعتبر",
          400,
        );
      const result = await SubscriptionService.initiatePurchase(
        req.user!._id.toString(),
        parsed.data.planSlug,
        req,
      );
      await createAuditLog({
        userId: req.user!._id.toString(),
        action: AuditAction.SYSTEM,
        resource: "Subscription",
        resourceId: result?.subscriptionId?.toString() || parsed.data.planSlug, // ✅ اصلاح‌شده
        description: `کاربر ${req.user?.firstName || req.user?.phone} درخواست خرید اشتراک با slug "${parsed.data.planSlug}" را ثبت کرد.`,
        req,
      });
      await sendNotificationToUser(
        req.user!._id.toString(),
        "🔄 درخواست خرید اشتراک ثبت شد",
        "برای تکمیل فرآیند، پرداخت را انجام دهید.",
        "info",
        "/pricing",
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async verifyPayment(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const parsed = verifyPaymentSchema.safeParse(req.body);
      if (!parsed.success)
        throw new AppError(
          parsed.error.issues[0]?.message || "شناسه پرداخت نامعتبر",
          400,
        );
      const result = await SubscriptionService.verifyAndActivate(
        parsed.data.authority,
        req,
      );
      await TransactionService.record(
        result.userId,
        result.amount,
        "subscription",
        parsed.data.authority,
        `خرید اشتراک ${result.planName || ""}`,
      );
      await createAuditLog({
        userId: result.userId,
        action: AuditAction.SUBSCRIPTION_PURCHASED,
        resource: "Subscription",
        resourceId: result.planId || parsed.data.authority,
        description: `کاربر ${req.user?.firstName || req.user?.phone} اشتراک "${result.planName || ""}" را با موفقیت خریداری کرد.`,
        metadata: { amount: result.amount, authority: parsed.data.authority },
        req,
      });
      await sendNotificationToUser(
        result.userId,
        "🎉 اشتراک شما فعال شد",
        `شما با موفقیت اشتراک "${result.planName || "ویژه"}" را خریداری کردید.`,
        "vip_upgrade",
        "/panel/user/subscriptions",
      );
      await notifyAdmins(
        "💰 خرید اشتراک جدید",
        `کاربری اشتراک "${result.planName || "ویژه"}" را به مبلغ ${result.amount} تومان خریداری کرد.`,
        "revenue_milestone",
        `/admin/financial`,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async checkStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const isActive = await SubscriptionService.hasActiveSubscription(
        req.user!._id.toString(),
      );
      res.json({ success: true, data: { isActive } });
    } catch (err) {
      next(err);
    }
  }

  static async getCurrentSubscription(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const sub = await SubscriptionService.getActiveSubscription(
        req.user!._id.toString(),
      );
      if (!sub) return res.json({ success: true, data: null });
      res.json({
        success: true,
        data: { name: sub.planTitle, expiresAt: sub.endDate, isActive: true },
      });
    } catch (err) {
      next(err);
    }
  }
}
