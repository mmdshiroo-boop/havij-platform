import { Request, Response } from "express";
import { Expert } from "../models/Expert.model";
import { User } from "../models/User.model";
import { Ad } from "../models/Ad.model";
import { Report } from "../models/Report.model";
import { AuthRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";
import { sendNotificationToUser } from "../services/notification.service";

// ==================== آمار داشبورد کارشناس ====================
export const getExpertStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // آمار کلی
    const [
      pendingAds,
      approvedToday,
      rejectedToday,
      totalApproved,
      totalRejected,
    ] = await Promise.all([
      Ad.countDocuments({ status: "pending" }),
      Ad.countDocuments({
        status: "active",
        verifiedAt: { $gte: today, $lt: tomorrow },
      }),
      Ad.countDocuments({
        status: "rejected",
        updatedAt: { $gte: today, $lt: tomorrow },
      }),
      Ad.countDocuments({ status: "active" }), // کل تأیید شده‌ها
      Ad.countDocuments({ status: "rejected" }), // کل رد شده‌ها
    ]);

    const reviewedToday = approvedToday + rejectedToday;

    // گزارشات باز
    const pendingReports = await Report.countDocuments({ status: "pending" });

    res.json({
      success: true,
      data: {
        pendingAds,
        reviewedToday,
        approvedToday,
        rejectedToday,
        totalApproved,
        totalRejected,
        pendingReports,
        expertInfo: null, // در صورت نیاز می‌توانید از Expert.findOne استفاده کنید
      },
    });
  } catch (error) {
    console.error("Error in getExpertStats:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت آمار" });
  }
};

// ==================== دریافت اطلاعات پروفایل کارشناس ====================
export const getExpertProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    let expert = await Expert.findOne({ userId }).populate(
      "userId",
      "firstName lastName phone email avatar",
    );

    if (!expert) {
      // اگر پروفایل کارشناس وجود نداشت، ایجاد کن
      const user = await User.findById(userId);
      expert = await Expert.create({
        userId,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: user?.phone || "",
        email: user?.email,
        specialty: [],
        experienceYears: 0,
        status: "active",
      });
    }

    res.json({ success: true, data: expert });
  } catch (error) {
    console.error("Error in getExpertProfile:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت پروفایل" });
  }
};

// ==================== به‌روزرسانی پروفایل کارشناس ====================
export const updateExpertProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const {
      firstName,
      lastName,
      email,
      specialty,
      experienceYears,
      licenseNumber,
      description,
    } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    // به‌روزرسانی کاربر
    await User.findByIdAndUpdate(userId, { firstName, lastName, email });

    // به‌روزرسانی کارشناس
    const expert = await Expert.findOneAndUpdate(
      { userId },
      {
        firstName,
        lastName,
        email,
        specialty: specialty || [],
        experienceYears: experienceYears || 0,
        licenseNumber,
        description,
      },
      { new: true, upsert: true },
    );

    // Audit log
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.USER_UPDATE_PROFILE,
      resource: "Expert",
      resourceId: expert?._id?.toString() || userId.toString(),
      description: `کارشناس ${req.user?.firstName || req.user?.phone} پروفایل خود را ویرایش کرد.`,
      metadata: { updatedFields: req.body },
      req,
    });

    // 🆕 اعلان به کارشناس
    await sendNotificationToUser(
      userId.toString(),
      "✏️ پروفایل ویرایش شد",
      "اطلاعات پروفایل کارشناسی شما با موفقیت به‌روزرسانی شد.",
      "success",
      "/panel/expert/profile",
    );

    res.json({
      success: true,
      data: expert,
      message: "پروفایل با موفقیت به‌روزرسانی شد",
    });
  } catch (error) {
    console.error("Error in updateExpertProfile:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در به‌روزرسانی پروفایل" });
  }
};

// ==================== افزایش آمار تایید آگهی (کمکی) ====================
export const incrementExpertVerified = async (expertId: string) => {
  try {
    await Expert.findByIdAndUpdate(expertId, {
      $inc: { verifiedAds: 1, totalReviews: 1 },
    });
  } catch (error) {
    console.error("Error incrementing expert verified:", error);
  }
};

// ==================== افزایش آمار رد آگهی (کمکی) ====================
export const incrementExpertRejected = async (expertId: string) => {
  try {
    await Expert.findByIdAndUpdate(expertId, {
      $inc: { rejectedAds: 1, totalReviews: 1 },
    });
  } catch (error) {
    console.error("Error incrementing expert rejected:", error);
  }
};

// ==================== دریافت یک آگهی خاص با ID (برای بررسی) ====================
export const getPendingAdById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    // بررسی وجود کارشناس
    const expert = await Expert.findOne({ userId });
    if (!expert) {
      return res
        .status(403)
        .json({ success: false, message: "شما دسترسی کارشناس ندارید" });
    }

    // پیدا کردن آگهی
    const ad = await Ad.findById(id)
      .populate("userId", "firstName lastName phone email avatar")
      .populate("category", "name slug");

    if (!ad) {
      return res.status(404).json({ success: false, message: "آگهی یافت نشد" });
    }

    res.json({ success: true, data: ad });
  } catch (error) {
    console.error("Error in getPendingAdById:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت آگهی" });
  }
};

// ==================== تایید یا رد آگهی توسط کارشناس ====================
export const reviewAd = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, notes } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    // بررسی وجود کارشناس
    const expert = await Expert.findOne({ userId });
    if (!expert) {
      return res
        .status(403)
        .json({ success: false, message: "شما دسترسی کارشناس ندارید" });
    }

    // پیدا کردن آگهی
    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: "آگهی یافت نشد" });
    }

    // بررسی اینکه آگهی در وضعیت pending باشد
    if (ad.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "این آگهی قبلاً بررسی شده است",
      });
    }

    const oldStatus = ad.status;

    if (status === "approved") {
      ad.status = "active";
      ad.verifiedAt = new Date();

      // افزایش آمار تایید کارشناس
      await incrementExpertVerified(expert._id.toString());
    } else if (status === "rejected") {
      ad.status = "rejected";
      ad.rejectReason = rejectionReason || "بدون دلیل";

      // افزایش آمار رد کارشناس
      await incrementExpertRejected(expert._id.toString());
    } else {
      return res
        .status(400)
        .json({ success: false, message: "وضعیت نامعتبر است" });
    }

    await ad.save();

    // Audit log
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.AD_STATUS_CHANGED,
      resource: "Ad",
      resourceId: ad._id.toString(),
      description: `کارشناس ${req.user?.firstName || req.user?.phone} آگهی "${ad.title}" را ${status === "approved" ? "تایید" : "رد"} کرد.${rejectionReason ? ` دلیل: ${rejectionReason}` : ""}`,
      metadata: { oldStatus, newStatus: status, rejectionReason },
      req,
    });

    // 🆕 اعلان به صاحب آگهی
    if (status === "approved") {
      await sendNotificationToUser(
        ad.userId.toString(),
        "✅ آگهی شما تأیید شد",
        `آگهی "${ad.title}" توسط کارشناس تأیید و منتشر شد.`,
        "ad_approved",
        `/ad/${ad._id}`,
        { adId: ad._id.toString(), adTitle: ad.title },
      );
    } else if (status === "rejected") {
      await sendNotificationToUser(
        ad.userId.toString(),
        "❌ آگهی شما رد شد",
        `آگهی "${ad.title}" به دلیل "${ad.rejectReason || "دلیل مشخص نشده"}" رد شد.`,
        "ad_rejected",
        `/panel/user/my-ads`,
        { adId: ad._id.toString(), adTitle: ad.title, reason: ad.rejectReason },
      );
    }

    res.json({
      success: true,
      message: status === "approved" ? "آگهی با موفقیت تایید شد" : "آگهی رد شد",
      data: ad,
    });
  } catch (error) {
    console.error("Error in reviewAd:", error);
    res.status(500).json({ success: false, message: "خطا در بررسی آگهی" });
  }
};

// ==================== دریافت لیست آگهی‌های در انتظار (با pagination) ====================
export const getPendingAdsList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    // بررسی وجود کارشناس
    const expert = await Expert.findOne({ userId });
    if (!expert) {
      return res
        .status(403)
        .json({ success: false, message: "شما دسترسی کارشناس ندارید" });
    }

    // ساخت فیلتر جستجو
    let filter: any = { status: "pending" };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Ad.countDocuments(filter);

    const ads = await Ad.find(filter)
      .populate("userId", "firstName lastName phone")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getPendingAdsList:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت لیست آگهی‌ها" });
  }
};
