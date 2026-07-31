// backend/src/controllers/vip.controller.ts
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { VipService } from "../services/vip.service";
import { VipPlan } from "../models/VipPlan.model";
import { VipAnalyticsService } from "../services/vipAnalytics.service";
import { User } from "../models";
import { TransactionService } from "../services/transaction.service";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";
import { sendNotificationToUser } from "../services/notification.service";

export const getPlans = async (req: AuthRequest, res: Response) => {
  try {
    const plans = await VipPlan.find({ isActive: true }).sort({ price: 1 });
    const formattedPlans = plans.map((p) => ({
      id: p._id,
      name: p.name,
      nameEn: p.nameEn,
      description: p.description,
      price: p.price,
      duration: p.duration,
      features: p.features,
      discount: p.discount,
      isPopular: p.priority === 1,
    }));
    res.json({ success: true, data: formattedPlans });
  } catch (error) {
    console.error("Error getting plans:", error);
    res.status(500).json({ error: "خطا در دریافت پلن‌ها" });
  }
};

export const getCurrentPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "احراز هویت نشده" });
    const subscription = await VipService.getCurrentSubscription(
      userId.toString(),
    );
    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error getting current plan:", error);
    res.status(500).json({ error: "خطا در دریافت اشتراک" });
  }
};

export const getVipStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "احراز هویت نشده" });
    const stats = await VipService.getVipStats(userId.toString());
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error getting VIP stats:", error);
    res.status(500).json({ error: "خطا در دریافت آمار" });
  }
};

export const upgradeRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "احراز هویت نشده" });
    const { planId } = req.body;
    const result = await VipService.createUpgradeRequest(
      userId.toString(),
      planId,
      req,
    );

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "VipPlan",
      resourceId: planId,
      description: `کاربر ${req.user?.firstName || req.user?.phone} درخواست ارتقا به پلن VIP را ثبت کرد.`,
      req,
    });

    await sendNotificationToUser(
      userId.toString(),
      "🔄 درخواست ارتقا ثبت شد",
      "درخواست شما برای ارتقا به اشتراک ویژه ثبت گردید.",
      "info",
      "/panel/user/subscriptions",
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error upgrading:", error);
    res.status(500).json({ error: error.message || "خطا در فرآیند ارتقا" });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "احراز هویت نشده" });

    const { planId, paymentId } = req.query;
    const plan = await VipPlan.findById(planId);
    if (!plan) return res.status(404).json({ error: "پلن مورد نظر یافت نشد" });

    await VipService.verifyPayment(
      userId.toString(),
      planId as string,
      paymentId as string,
      req,
    );

    await TransactionService.record(
      userId.toString(),
      plan.price,
      "vip",
      paymentId as string,
      `خرید اشتراک ویژه ${plan.name}`,
    );

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SUBSCRIPTION_PURCHASED,
      resource: "VipPlan",
      resourceId: plan._id.toString(),
      description: `کاربر ${req.user?.firstName || req.user?.phone} اشتراک VIP "${plan.name}" را با موفقیت خریداری کرد.`,
      metadata: { paymentId, amount: plan.price },
      req,
    });

    await sendNotificationToUser(
      userId.toString(),
      "🎉 اشتراک ویژه شما فعال شد",
      `شما با موفقیت اشتراک "${plan.name}" را خریداری کردید.`,
      "vip_upgrade",
      "/panel/user/subscriptions",
    );

    res.json({ success: true, message: "اشتراک VIP با موفقیت فعال شد" });
  } catch (error: any) {
    console.error("Error verifying VIP payment:", error);
    res.status(500).json({ error: error.message || "خطا در تأیید پرداخت" });
  }
};

export const getVipAnalytics = async (req: Request, res: Response) => {
  try {
    const adId = (req.query.adId as string) || "all";
    const period = parseInt(req.query.period as string) || 7;
    const data = await VipAnalyticsService.getPerformanceStats(adId, period);
    res
      .status(200)
      .json({ success: true, message: "اطلاعات آنالیتیکس دریافت شد.", data });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "خطای سرور در واکشی اطلاعات آنالیتیکس",
      });
  }
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId)
      .select("firstName lastName phone email role avatar isVerified")
      .lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "کاربر یافت نشد" });

    const subscription = await VipService.getCurrentSubscription(
      userId.toString(),
    );
    const stats = await VipService.getVipStats(userId.toString());
    let analyticsSummary = null;
    try {
      analyticsSummary = await VipAnalyticsService.getPerformanceStats(
        "all",
        7,
      );
    } catch (e) {}

    res.json({
      success: true,
      data: { user, subscription, stats, analytics: analyticsSummary },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت داشبورد" });
  }
};
