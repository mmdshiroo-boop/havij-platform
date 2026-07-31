// backend/src/services/analytics.service.ts
import { User } from "../models/User.model";
import { UserSubscription } from "../models/UserSubscription.model";
import { Ad } from "../models/Ad.model"; // 🔴 اگر اسم مدل آگهی شما فرق دارد این خط را اصلاح کنید

export class AnalyticsService {
  /**
   * آمار کل سایت برای داشبورد مدیریت (ادمین)
   */
  static async getAdminOverview() {
    // ۱. تعداد کل کاربران و کاربران VIP واقعی
    const totalUsers = await User.countDocuments();
    const vipUsers = await User.countDocuments({ role: "vip" });

    // ۲. تعداد کل آگهی‌ها و آگهی‌های در انتظار تایید
    const totalAds = await Ad.countDocuments();
    const pendingAds = await Ad.countDocuments({ status: "pending" }); // فرض بر اینکه فیلد وضعیت status است

    // ۳. محاسبه درآمد واقعی حاصل از خرید اشتراک‌ها
    const revenueResult = await UserSubscription.aggregate([
      { $match: { status: { $in: ["active", "expired"] } } },
      {
        $lookup: {
          from: "subscriptionplans", // نام کالکشن پلن‌ها در دیتابیس شما
          localField: "plan",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      { $unwind: "$planDetails" },
      { $group: { _id: null, total: { $sum: "$planDetails.price" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // ۴. آمار ثبت‌نام کاربران در ۶ ماه گذشته برای نمودار
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsers = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return {
      cards: {
        totalUsers,
        vipUsers,
        totalAds,
        pendingAds,
        totalRevenue,
      },
      charts: {
        monthlyUsers: monthlyUsers.map((item) => ({
          month: `${item._id.year}/${item._id.month}`,
          users: item.count,
        })),
      },
    };
  }

  /**
   * آمار شخصی کاربر لاگین شده برای داشبورد خودش
   */
  static async getUserOverview(userId: string) {
    // ۱. تعداد آگهی‌های ثبت شده توسط این کاربر
    const myAdsCount = await Ad.countDocuments({ user: userId });

    // ۲. محاسبه مجموع بازدید آگهingهای این کاربر (اگر فیلد views یا clicks دارید)
    const viewsResult = await Ad.aggregate([
      { $match: { user: new Object(userId) } }, // بر اساس آیدی کاربر فیلتر می‌کند
      { $group: { _id: null, totalViews: { $sum: "$views" } } }, // فرض بر وجود فیلد views در مدل آگهی
    ]);
    const totalViews = viewsResult[0]?.totalViews || 0;

    // ۳. وضعیت اشتراک VIP کاربر
    const currentSub = await UserSubscription.findOne({
      user: userId,
      status: "active",
    }).populate("plan");

    return {
      myAdsCount,
      totalViews,
      hasVip: !!currentSub,
      subscriptionDetails: currentSub
        ? {
            title: (currentSub.plan as any).title,
            endDate: currentSub.endDate,
          }
        : null,
    };
  }
}
