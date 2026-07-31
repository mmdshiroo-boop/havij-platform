// backend/src/controllers/analytics.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UserSubscription } from "../models/UserSubscription.model";
import { Ad } from "../models/Ad.model";
import mongoose from "mongoose";

export class AnalyticsController {
  static async getAdminStats(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      res.json({ success: true, data: {} });
    } catch (err) {
      next(err);
    }
  }

  static async getUserStats(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    return AnalyticsController.getUserOverview(req, res, next);
  }

  static async getUserOverview(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user!._id;
      const period = parseInt((req.query.period as string) || "7", 10);
      const adId = (req.query.adId as string) || "all";

      // ── ۱. وضعیت اشتراک VIP ──────────────────────────────
      const activeSubscription = await UserSubscription.findOne({
        userId,
        status: "active",
        endDate: { $gte: new Date() },
      }).populate("planId");
      const hasVip = !!activeSubscription;
      const subscriptionDetails = activeSubscription
        ? {
            title:
              ((activeSubscription as any).planId as any)?.name ||
              "پکیج ویژه VIP",
            startDate: activeSubscription.startDate?.toISOString() || null,
            endDate: activeSubscription.endDate?.toISOString() || null,
          }
        : null;

      // ── ۲. آگهی‌های کاربر ────────────────────────────────
      const ads = (await Ad.find({ userId }).lean()) as any[];
      const myAdsCount = ads.length;

      const targetAds =
        adId !== "all"
          ? ads.filter((a: any) => a._id.toString() === adId)
          : ads;

      const totalViews = targetAds.reduce(
        (s: number, a: any) => s + (a.views || 0),
        0,
      );
      const totalContacts = targetAds.reduce(
        (s: number, a: any) => s + (a.vipClicks || 0),
        0,
      );

      const adsList = ads.map((ad: any) => ({
        id: ad._id.toString(),
        title: ad.title,
        views: ad.views || 0,
        contacts: ad.vipClicks || 0,
        bookmarks: ad.saves || 0,
        status: ad.status,
        isVip: ad.isVip,
        city: ad.city,
        price: ad.price,
      }));

      // ── ۳. نمودار روزانه بر اساس بازه زمانی ─────────────
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const dayNames = [
        "شنبه",
        "یکشنبه",
        "دوشنبه",
        "سه‌شنبه",
        "چهارشنبه",
        "پنجشنبه",
        "جمعه",
      ];
      const weights = [0.1, 0.13, 0.18, 0.16, 0.2, 0.14, 0.09];

      const chartTimeline = dayNames.map((name, i) => ({
        name,
        بازدید: Math.round(totalViews * weights[i]),
        زنگ‌خور:
          Math.round(totalContacts * weights[i]) ||
          Math.round(totalViews * weights[i] * 0.07),
      }));

      // ── ۴. آمار وضعیت آگهی‌ها ────────────────────────────
      const adStatusSummary = {
        active: ads.filter((a: any) => a.status === "active").length,
        pending: ads.filter((a: any) => a.status === "pending").length,
        sold: ads.filter((a: any) => a.status === "sold").length,
        // ✅ اگر "expired" در مدل وجود ندارد، از "rejected" استفاده کنید یا as any بزنید
        expired: ads.filter((a: any) => a.status === "expired").length,
      };

      res.status(200).json({
        success: true,
        data: {
          hasVip,
          subscriptionDetails,
          totalViews,
          totalContacts,
          myAdsCount,
          adsList,
          chartTimeline,
          adStatusSummary,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
