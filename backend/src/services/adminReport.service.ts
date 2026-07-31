// backend/src/services/adminReport.service.ts
import mongoose from "mongoose";
import { AdminReport } from "../models/AdminReport.model";
import { User } from "../models/User.model";
import { Ad } from "../models/Ad.model";
import { VipSubscription } from "../models/VipSubscription.model";

export class AdminReportService {
  // دریافت آمار لحظه‌ای سیستم
  static async getSystemStats() {
    const [users, ads, vipSubscriptions, usersByRole, adsByStatus] =
      await Promise.all([
        User.countDocuments(),
        Ad.countDocuments(),
        VipSubscription.aggregate([
          { $match: { status: "active" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        Ad.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ]);

    const activeUsers = await User.countDocuments({ isActive: true });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const pendingAds = adsByStatus.find((a) => a._id === "pending")?.count || 0;
    const activeAds = adsByStatus.find((a) => a._id === "active")?.count || 0;
    const rejectedAds =
      adsByStatus.find((a) => a._id === "rejected")?.count || 0;

    return {
      users: {
        total: users,
        active: activeUsers,
        banned: bannedUsers,
        byRole: {
          user: usersByRole.find((u) => u._id === "user")?.count || 0,
          vip: usersByRole.find((u) => u._id === "vip")?.count || 0,
          agent: usersByRole.find((u) => u._id === "agent")?.count || 0,
          expert: usersByRole.find((u) => u._id === "expert")?.count || 0,
          admin: usersByRole.find((u) => u._id === "admin")?.count || 0,
          super_admin:
            usersByRole.find((u) => u._id === "super_admin")?.count || 0,
          developer: usersByRole.find((u) => u._id === "developer")?.count || 0,
        },
      },
      ads: {
        total: ads,
        active: activeAds,
        pending: pendingAds,
        rejected: rejectedAds,
      },
      revenue: {
        total: vipSubscriptions[0]?.total || 0,
      },
    };
  }

  // ذخیره گزارش روزانه
  static async generateDailyReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await this.getSystemStats();

    const report = new AdminReport({
      type: "daily",
      period: { start: today, end: tomorrow },
      stats,
    });

    await report.save();
    return report;
  }

  // دریافت گزارشات ذخیره شده
  static async getReports(limit: number = 30) {
    return await AdminReport.find().sort({ createdAt: -1 }).limit(limit);
  }
}
