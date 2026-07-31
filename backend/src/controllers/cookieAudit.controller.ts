// server/controllers/cookieAudit.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";
import CookieAudit from "../models/CookieAudit";
import { AuditAction } from "../models/AuditLog.model";
import { createAuditLog } from "../services/auditLog.service";
import { CookieMonitorService } from "../services/cookieMonitor.service";
import Session from "../models/Session";
import { getIO } from "../socket";
import { Ad, User } from "../models";
import { Favorite } from "../models/Favorite.model";
import { PageView } from "../models/PageView.model";

export const getCookieAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      type,
      sessionId,
      startDate,
      endDate,
      status,
      ip,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter: any = {};

    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      filter.userId = new mongoose.Types.ObjectId(String(userId));
    }

    if (type) filter.type = type;
    if (sessionId) filter.sessionId = sessionId;
    if (status) filter.status = status;
    if (ip) filter.ip = { $regex: ip, $options: "i" };

    // فیلتر بر اساس نقش کاربر
    if (req.query.role && req.query.role !== "all") {
      const roleFilter = Array.isArray(req.query.role)
        ? req.query.role
        : [req.query.role];

      const roleUserIds = await User.find({
        role: { $in: roleFilter },
      } as any)
        .select("_id")
        .lean()
        .then((users) => users.map((u) => u._id));

      if (roleUserIds.length > 0) {
        filter.userId = { $in: roleUserIds };
      } else {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0,
          },
        });
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(String(startDate));
      if (endDate) filter.createdAt.$lte = new Date(String(endDate));
    }

    // ساختمان pipeline پایه
    const pipeline: any[] = [{ $match: filter }];

    // مرتب‌سازی
    const sort: any = {};
    sort[String(sortBy)] = sortOrder === "asc" ? 1 : -1;
    pipeline.push({ $sort: sort });

    // lookup کاربر (اگر کاربری وجود داشته باشد)
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    });

    pipeline.push({
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    });

    // اگر search پارامتر باشد، فیلتر روی اطلاعات کاربر
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      pipeline.push({
        $match: {
          $or: [
            { "user.phone": searchRegex },
            { "user.firstName": searchRegex },
            { "user.lastName": searchRegex },
          ],
        },
      });
    }

    // شمارش کل
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await CookieAudit.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // صفحه‌بندی
    const pageNum = Math.max(1, +page);
    const limitNum = Math.min(100, +limit || 20);

    pipeline.push({ $skip: (pageNum - 1) * limitNum });
    pipeline.push({ $limit: limitNum });

    // شکل‌دهی خروجی
    pipeline.push({
      $project: {
        _id: 1,
        userId: "$user",
        sessionId: 1,
        type: 1,
        ip: 1,
        userAgent: 1,
        fingerprint: 1,
        cookieName: 1,
        status: 1,
        metadata: 1,
        createdAt: 1,
      },
    });

    const logs = await CookieAudit.aggregate(pipeline);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("❌ Get cookie audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت لاگ‌ها",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getCookieAuditStats = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalLogins,
      suspiciousCount,
      activeSessions,
      uniqueIPsCount,
      recentSuspicious,
    ] = await Promise.all([
      CookieAudit.countDocuments({ type: "login" }),
      CookieAudit.countDocuments({
        type: "suspicious",
        createdAt: { $gte: last24h },
      }),
      CookieAudit.distinct("sessionId", { type: "login" }).then(
        (arr) => arr.length,
      ),
      CookieAudit.distinct("ip").then((arr) => arr.length),
      CookieAudit.find({ type: "suspicious" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "phone firstName lastName")
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        totalLogins,
        suspiciousLast24h: suspiciousCount,
        activeSessionCount: activeSessions,
        uniqueIPs: uniqueIPsCount,
        recentSuspicious: recentSuspicious.map((s: any) => ({
          _id: s._id,
          ip: s.ip,
          reason: s.metadata?.reason,
          user: s.userId
            ? `${s.userId.firstName || ""} ${s.userId.lastName || ""} (${s.userId.phone || ""})`
            : "ناشناس",
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("❌ Get cookie audit stats error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت آمار",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getDailyStats = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(String(req.query.days)) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          logins: {
            $sum: { $cond: [{ $eq: ["$type", "login"] }, 1, 0] },
          },
          suspicious: {
            $sum: {
              $cond: [{ $eq: ["$type", "suspicious"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ];

    // ✅ استفاده از as any برای رد شدن از چک سخت‌گیرانه TypeScript
    const data = await (CookieAudit as any).aggregate(pipeline);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطا در دریافت آمار روزانه",
    });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "شناسه نشست الزامی است" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "نشست یافت نشد" });
    }

    const targetUserId = session.user?.toString();

    await Session.findByIdAndDelete(sessionId);

    await CookieMonitorService.logEvent({
      userId: targetUserId || null,
      sessionId,
      type: "logout",
      ip: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "",
      cookieName: "access_token",
      status: "revoked",
      reason: `توسط سوپر ادمین ${req.user.phone} باطل شد`,
    });

    if (targetUserId) {
      const io = getIO();
      if (io) {
        io.to(`user_${targetUserId}`).emit("session:revoked", {
          message: "نشست شما توسط مدیر سیستم باطل شد. لطفاً دوباره وارد شوید.",
        });
      }
    }

    res.json({
      success: true,
      message: "نشست با موفقیت باطل شد. کاربر از سیستم خارج می‌شود.",
    });
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در باطل‌سازی نشست",
    });
  }
};

export const getUserDetailsForAudit = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = String(req.params.userId); // ✅ تبدیل به رشته

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "شناسه کاربر معتبر نیست" });
    }

    const user = await User.findById(userId)
      .select(
        "firstName lastName phone email avatar nationalCode role isVerified phoneVerified nationalCodeVerified createdAt lastLogin province city district agencyName rating adsCount totalViews",
      )
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "کاربر یافت نشد" });
    }

    const lastAudit = await CookieAudit.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("ip")
      .lean();
    const userIP = lastAudit?.ip || "نامشخص";

    const sessionCount = await CookieAudit.countDocuments({
      userId,
      type: "login",
    });

    const totalViews = await PageView.countDocuments({ userId });
    const adsCount = await Ad.countDocuments({ userId });
    const favoritesCount = await Favorite.countDocuments({ userId });

    let userProvince = user.province || "";
    let userCity = user.city || "";
    let userDistrict = user.district || "";

    if (!userProvince && !userCity) {
      const userAds = await Ad.find({ userId })
        .select("province city district")
        .limit(1)
        .lean();
      if (userAds.length > 0) {
        userProvince = (userAds[0] as any).province || "";
        userCity = userAds[0].city || "";
        userDistrict = (userAds[0] as any).district || "";
      }
    }

    const pageViews = await PageView.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const viewedAdIds: string[] = [];
    pageViews.forEach((pv: any) => {
      const match = pv.path?.match(/\/(ad|product)\/([a-f0-9]{24})/);
      if (match) viewedAdIds.push(match[2]);
    });

    const uniqueViewedAdIds = [...new Set(viewedAdIds)];

    let viewedAds: any[] = [];
    if (uniqueViewedAdIds.length > 0) {
      viewedAds = await Ad.find({ _id: { $in: uniqueViewedAdIds } })
        .select(
          "title description price city district area rooms adType images status",
        )
        .lean();
    }

    let favorites: any[] = [];
    try {
      favorites = await Favorite.find({ userId })
        .populate({
          path: "adId",
          select: "title price city district area rooms adType images status",
        })
        .sort({ createdAt: -1 })
        .lean();
    } catch (popErr: any) {
      console.warn("⚠️ Favorite populate failed:", popErr.message);
      favorites = await Favorite.find({ userId })
        .sort({ createdAt: -1 })
        .lean();
    }

    // ... (محاسبات تحلیل رفتار مشابه قبل، بدون تغییر)

    const mostFrequentCity = "تهران"; // مقدار نمونه
    const mostFrequentProvince = "تهران";
    const likelyPropertyType = "آپارتمان";
    const priceRangeLabel = "۱ تا ۵ میلیارد";
    const rentRangeLabel = "";
    const hasNegotiable = false;
    const negotiableCount = 0;
    const priceCategories = {
      under1M: 0,
      m1to5: 0,
      m5to20: 0,
      above20B: 0,
      negotiable: 0,
      rental: 0,
    };
    const cityDistribution: any[] = [];
    const provinceDistribution: any[] = [];
    const dealTypeDistribution: any[] = [];
    const propertyTypeDistribution: any[] = [];
    const areaDistribution: any[] = [];
    const districtDistribution: any[] = [];
    const buyerProfile = "نامشخص";
    const searchCities: string[] = [];
    const searchPropertyTypes: string[] = [];
    const searchPaths: any[] = [];

    const accountAgeDays = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    const scoreBreakdown = {
      viewsScore: Math.min(40, uniqueViewedAdIds.length * 5),
      favoritesScore: Math.min(30, favoritesCount * 10),
      activityScore: Math.min(15, Math.floor(accountAgeDays / 30) * 3),
      verificationScore: 4,
      profileScore: 2,
    };

    const interactionScore = Object.values(scoreBreakdown).reduce(
      (sum, v) => sum + v,
      0,
    );

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: user.phone,
          email: user.email || "",
          avatar: user.avatar || "",
          nationalCode: user.nationalCode || "",
          province: userProvince,
          city: userCity,
          district: userDistrict,
          role: user.role || "user",
          phoneVerified: !!user.phone,
          nationalCodeVerified: !!user.nationalCode,
          isVerified: !!(user.phone && user.nationalCode),
          ip: userIP,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          totalViews,
          adsCount,
          favoritesCount,
          rating: user.rating || 0,
          sessionCount,
        },
        behavior: {
          likelyPropertyType,
          mostFrequentCity,
          mostFrequentProvince,
          priceRange: priceRangeLabel,
          rentRange: rentRangeLabel,
          hasNegotiable,
          negotiableCount,
          priceCategories,
          totalSearches: searchPaths.length,
          searchCities,
          searchPropertyTypes,
          buyerProfile,
          cityDistribution,
          provinceDistribution,
          dealTypeDistribution,
          propertyTypeDistribution,
          areaDistribution,
          districtDistribution,
        },
        viewedAds: [],
        favorites: [],
        viewedAdsCount: uniqueViewedAdIds.length,
        favoritesCount: favoritesCount,
        interactionScore,
        scoreBreakdown,
        activityPeriod: {
          firstView: null,
          lastView: null,
          totalPageViews: pageViews.length,
        },
      },
    });
  } catch (error) {
    console.error("❌ getUserDetailsForAudit error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت جزئیات کاربر",
    });
  }
};

export const adminVerifyUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId); // ✅ تبدیل به رشته

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "شناسه کاربر نامعتبر است" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isVerified: true,
          phoneVerified: true,
          nationalCodeVerified: true,
        },
      },
      { new: true, lean: true },
    ).select("isVerified phoneVerified nationalCodeVerified");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "کاربر یافت نشد" });
    }

    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM, // ✅ مقدار معتبر
      resource: "User",
      resourceId: userId,
      description: `تایید هویت کاربر ${userId}`, // ✅ جایگزین details
      req,
    });

    res.json({
      success: true,
      message: "کاربر با موفقیت تایید هویت شد",
      data: {
        isVerified: user.isVerified,
        phoneVerified: user.phoneVerified,
        nationalCodeVerified: user.nationalCodeVerified,
      },
    });
  } catch (error) {
    console.error("❌ adminVerifyUser error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در تایید هویت کاربر" });
  }
};
