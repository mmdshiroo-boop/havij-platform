import { Ad } from "../models";
import { AdAnalytics } from "../models/AdAnalytics";
import { Types } from "mongoose";

export class VipAnalyticsService {
  /**
   * دریافت آمار کلی یا اختصاصی یک آگهی به همراه دیتای نمودار
   */
  static async getPerformanceStats(adId: string, periodDays: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // فیلتر بر اساس کل آژانس یا یک آگهی خاص
    const matchStage: any = { date: { $gte: startDate } };
    if (adId !== "all") {
      matchStage.adId = new Types.ObjectId(adId);
    }

    // ۱. کوئری جمع کل آمار (KPIs) برای بازه زمانی مشخص شده
    const totalStats = await AdAnalytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          views: { $sum: "$viewsCount" },
          contacts: { $sum: "$contactsCount" },
          bookmarks: { $sum: "$bookmarksCount" },
        },
      },
    ]);

    // ۲. کوئری دریافت دیتای روزانه برای نمودار Recharts
    const timelineData = await AdAnalytics.find(matchStage)
      .sort({ date: 1 })
      .select("date viewsCount contactsCount");

    // تبدیل فرمت تاریخ به روزهای هفته برای نمودار فرانت‌اند
    const formattedTimeline = timelineData.map((item) => {
      const dayName = item.date.toLocaleDateString("fa-IR", {
        weekday: "long",
      });
      return {
        name: dayName,
        بازدید: item.viewsCount,
        زنگ‌خور: item.contactsCount,
      };
    });

    // ۳. دریافت لیست آگهی‌های فعال برای بخش جدول و دراپ‌داون فیلتر
    const activeAds = await Ad.find({ status: "active" } as any).select(
      "id title views contacts bookmarks agentName",
    );

    return {
      stats: totalStats[0] || { views: 0, contacts: 0, bookmarks: 0 },
      timeline: formattedTimeline,
      ads: activeAds,
    };
  }
}
