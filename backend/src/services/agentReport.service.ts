// backend/src/services/agentReport.service.ts
import mongoose from "mongoose";
import { AgentReport } from "../models/AgentReport.model";
import { Property } from "../models/Property.model";
import { Ad } from "../models/Ad.model";
import { User } from "../models/User.model";

export class AgentReportService {
  // دریافت آمار لحظه‌ای آژانس
  static async getAgentStats(agentId: string) {
    // 1. آمار املاک (Properties)
    const properties = await Property.aggregate([
      { $match: { agentId: new mongoose.Types.ObjectId(agentId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalViews: { $sum: { $ifNull: ["$views", 0] } },
        },
      },
    ]);

    // 2. آمار آگهی‌های مربوط به آژانس
    const ads = await Ad.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(agentId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalViews: { $sum: { $ifNull: ["$views", 0] } },
        },
      },
    ]);

    // 3. اطلاعات کاربر آژانس
    const agent = await User.findById(agentId).select("stats");

    // محاسبه آمار املاک
    const totalProperties = properties.reduce((acc, p) => acc + p.count, 0);
    const activeProperties =
      properties.find((p) => p._id === "active")?.count || 0;
    const soldProperties = properties.find((p) => p._id === "sold")?.count || 0;
    const pendingProperties =
      properties.find((p) => p._id === "pending")?.count || 0;
    const expiredProperties =
      properties.find((p) => p._id === "expired")?.count || 0;
    const totalPropertyViews = properties.reduce(
      (acc, p) => acc + (p.totalViews || 0),
      0,
    );

    // محاسبه آمار آگهی‌ها
    const totalAds = ads.reduce((acc, a) => acc + a.count, 0);
    const activeAds = ads.find((a) => a._id === "active")?.count || 0;
    const pendingAds = ads.find((a) => a._id === "pending")?.count || 0;
    const rejectedAds = ads.find((a) => a._id === "rejected")?.count || 0;
    const totalAdViews = ads.reduce((acc, a) => acc + (a.totalViews || 0), 0);

    // محاسبه کل بازدیدها
    const totalViews = totalPropertyViews + totalAdViews;
    const averageViewsPerProperty =
      totalProperties > 0
        ? Math.round(totalPropertyViews / totalProperties)
        : 0;
    const averageViewsPerAd =
      totalAds > 0 ? Math.round(totalAdViews / totalAds) : 0;

    // لیدها (از آمار آژانس یا تخمین)
    const agentStats = agent?.stats || {
      totalLeads: 0,
      convertedLeads: 0,
      totalRevenue: 0,
      totalCommission: 0,
    };

    const totalLeads = agentStats.totalLeads || Math.floor(totalViews * 0.05);
    const convertedLeads =
      agentStats.convertedLeads || Math.floor(totalLeads * 0.3);
    const conversionRate =
      totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // درآمد (از آمار آژانس یا تخمین)
    const totalRevenue = agentStats.totalRevenue || soldProperties * 500000000;
    const totalCommission = agentStats.totalCommission || totalRevenue * 0.03;
    const averagePerSale =
      soldProperties > 0 ? totalRevenue / soldProperties : 0;

    // دریافت ۵ ملک برتر
    const topProperties = await Property.aggregate([
      { $match: { agentId: new mongoose.Types.ObjectId(agentId) } },
      { $sort: { views: -1 } },
      { $limit: 5 },
      { $project: { title: 1, views: 1, status: 1 } },
    ]);

    // دریافت ۵ آگهی برتر
    const topAds = await Ad.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(agentId) } },
      { $sort: { views: -1 } },
      { $limit: 5 },
      { $project: { title: 1, views: 1, status: 1 } },
    ]);

    return {
      properties: {
        total: totalProperties,
        active: activeProperties,
        sold: soldProperties,
        pending: pendingProperties,
        expired: expiredProperties,
      },
      ads: {
        total: totalAds,
        active: activeAds,
        pending: pendingAds,
        rejected: rejectedAds,
      },
      views: {
        total: totalViews,
        propertyViews: totalPropertyViews,
        adViews: totalAdViews,
        averagePerProperty: averageViewsPerProperty,
        averagePerAd: averageViewsPerAd,
      },
      leads: {
        total: totalLeads,
        new: Math.floor(totalLeads * 0.4),
        converted: convertedLeads,
        conversionRate: conversionRate,
      },
      revenue: {
        total: totalRevenue,
        commission: totalCommission,
        averagePerSale: averagePerSale,
      },
      topProperties: topProperties.map((p) => ({
        id: p._id,
        title: p.title,
        views: p.views,
        status: p.status,
      })),
      topAds: topAds.map((a) => ({
        id: a._id,
        title: a.title,
        views: a.views,
        status: a.status,
      })),
    };
  }

  // دریافت گزارشات ذخیره شده
  static async getAgentReports(agentId: string, limit: number = 30) {
    return await AgentReport.find({
      agentId: new mongoose.Types.ObjectId(agentId),
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async getReportByDateRange(
    agentId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const stats = await this.getAgentStats(agentId);
    return {
      period: { start: startDate, end: endDate },
      stats,
    };
  }

  // تولید و ذخیره گزارش روزانه
  static async generateDailyReport(agentId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // حذف گزارش قبلی امروز
    await AgentReport.deleteMany({
      agentId: new mongoose.Types.ObjectId(agentId),
      type: "daily",
      "period.start": today,
    });

    const stats = await this.getAgentStats(agentId);

    const report = new AgentReport({
      agentId: new mongoose.Types.ObjectId(agentId),
      type: "daily",
      period: { start: today, end: tomorrow },
      stats: {
        properties: stats.properties,
        views: {
          total: stats.views.total,
          averagePerProperty: stats.views.averagePerProperty,
        },
        leads: stats.leads,
        revenue: stats.revenue,
      },
      topProperties: stats.topProperties.map((p: any) => ({
        propertyId: p.id,
        title: p.title,
        views: p.views,
        leads: 0,
        status: p.status,
      })),
    });

    await report.save();
    return report;
  }
}
