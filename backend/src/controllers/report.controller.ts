// backend/src/controllers/report.controller.ts
import { Response } from "express";
import { Report } from "../models/Report.model";
import { User } from "../models/User.model"; // 🆕 برای یافتن نقش کاربر
import { AuthRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";
import {
  sendNotificationToUser,
  notifyAdmins,
} from "../services/notification.service";

// 🆕 تابع کمکی برای تعیین لینک بر اساس نقش
const getReportsLinkByRole = (role: string): string => {
  switch (role) {
    case "admin":
      return "/admin/reports";
    case "super_admin":
      return "/super-admin/reports";
    case "agent":
      return "/panel/agent/reports";
    case "expert":
      return "/panel/expert/reports";
    default:
      return "/panel/user/reports";
  }
};

// ایجاد یک گزارش جدید توسط کاربر (می‌تواند مهمان باشد)
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId, type, description } = req.body;
    const reporterId = req.user?._id || null;

    if (!targetType || !["ad", "property", "user"].includes(targetType)) {
      return res
        .status(400)
        .json({ success: false, message: "نوع گزارش نامعتبر است" });
    }
    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res
        .status(400)
        .json({ success: false, message: "شناسه هدف نامعتبر است" });
    }
    if (!type) {
      return res
        .status(400)
        .json({ success: false, message: "نوع تخلف الزامی است" });
    }

    try {
      const report = await Report.create({
        reporter: reporterId,
        targetType,
        targetId,
        type,
        description: description || "",
      });

      // لاگ تجاری
      if (reporterId) {
        await createAuditLog({
          userId: reporterId.toString(),
          action: AuditAction.REPORT_CREATED,
          resource: "Report",
          resourceId: report._id.toString(),
          description: `کاربر ${req.user?.firstName || req.user?.phone} یک گزارش ${targetType === "ad" ? "آگهی" : targetType === "property" ? "ملک" : "کاربر"} ثبت کرد.`,
          metadata: { targetType, targetId, type },
          req,
        });
      } else {
        await createAuditLog({
          action: AuditAction.REPORT_CREATED,
          resource: "Report",
          resourceId: report._id.toString(),
          description: `یک کاربر مهمان یک گزارش ${targetType === "ad" ? "آگهی" : targetType === "property" ? "ملک" : "کاربر"} ثبت کرد.`,
          metadata: { targetType, targetId, type },
          req,
        });
      }

      // اعلان به ادمین‌ها و سوپرادمین‌ها
      await notifyAdmins(
        "🚨 گزارش تخلف جدید",
        `گزارشی برای ${targetType === "ad" ? "آگهی" : targetType === "property" ? "ملک" : "کاربر"} با دلیل "${type}" ثبت شد.`,
        "report_created",
        "/admin/reports",
        { reportId: report._id.toString(), targetType, targetId },
      );

      res.status(201).json({
        success: true,
        data: report,
        message: "گزارش شما ثبت شد و بررسی خواهد شد.",
      });
    } catch (createError: any) {
      if (createError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "شما قبلاً برای این مورد گزارش ثبت کرده‌اید.",
        });
      }
      throw createError;
    }
  } catch (error) {
    console.error("createReport error:", error);
    res.status(500).json({ success: false, message: "خطا در ثبت گزارش" });
  }
};

export const getPendingReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await Report.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("reporter", "firstName lastName phone email");
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error("Error in getPendingReports:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت گزارشات" });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (search) query.type = { $regex: search, $options: "i" };
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .populate("reporter", "firstName lastName phone email");
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error("Error in getReports:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت گزارشات" });
  }
};

export const resolveReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { resolution } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "شناسه گزارش معتبر نیست" });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      {
        status: "resolved",
        resolution: resolution || "بررسی و تایید شد",
        reviewedAt: new Date(),
        reviewedBy: req.user?._id,
      },
      { new: true },
    ).populate("reporter", "role firstName lastName"); // 🆕 populate برای گرفتن نقش

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "گزارش یافت نشد" });
    }

    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.REPORT_RESOLVED,
      resource: "Report",
      resourceId: id,
      description: `ادمین ${req.user?.firstName || req.user?.phone} گزارش "${report.type || id}" را با نتیجه "${resolution || "بررسی و تایید شد"}" حل کرد.`,
      metadata: { resolution },
      req,
    });

    if (report.reporter) {
      const reporterRole = (report.reporter as any).role || "user";
      const link = getReportsLinkByRole(reporterRole);
      await sendNotificationToUser(
        report.reporter._id.toString(),
        "✅ گزارش شما بررسی شد",
        `گزارش شما با نتیجه "${resolution || "بررسی و تایید شد"}" بسته شد.`,
        "info",
        link, // 🆕 لینک پویا
      );
    }

    await notifyAdmins(
      "📋 یک گزارش حل شد",
      `گزارش "${report.type || id}" توسط ${req.user?.firstName || req.user?.phone} بررسی و بسته شد.`,
      "info",
      `/admin/reports`,
    );

    res.json({
      success: true,
      data: report,
      message: "گزارش با موفقیت بررسی شد",
    });
  } catch (error) {
    console.error("Error in resolveReport:", error);
    res.status(500).json({ success: false, message: "خطا در بررسی گزارش" });
  }
};

export const rejectReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "شناسه گزارش معتبر نیست" });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        resolution: reason || "گزارش رد شد",
        reviewedAt: new Date(),
        reviewedBy: req.user?._id,
      },
      { new: true },
    ).populate("reporter", "role firstName lastName"); // 🆕 populate برای گرفتن نقش

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "گزارش یافت نشد" });
    }

    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.REPORT_RESOLVED,
      resource: "Report",
      resourceId: id,
      description: `ادمین ${req.user?.firstName || req.user?.phone} گزارش "${report.type || id}" را رد کرد. دلیل: ${reason || "نامشخص"}`,
      metadata: { reason },
      req,
    });

    if (report.reporter) {
      const reporterRole = (report.reporter as any).role || "user";
      const link = getReportsLinkByRole(reporterRole);
      await sendNotificationToUser(
        report.reporter._id.toString(),
        "❌ گزارش شما رد شد",
        `گزارش شما با دلیل "${reason || "نامشخص"}" رد شد.`,
        "info",
        link, // 🆕 لینک پویا
      );
    }

    await notifyAdmins(
      "📋 یک گزارش رد شد",
      `گزارش "${report.type || id}" توسط ${req.user?.firstName || req.user?.phone} رد شد. دلیل: ${reason || "نامشخص"}`,
      "info",
      `/admin/reports`,
    );

    res.json({ success: true, data: report, message: "گزارش با موفقیت رد شد" });
  } catch (error) {
    console.error("Error in rejectReport:", error);
    res.status(500).json({ success: false, message: "خطا در رد گزارش" });
  }
};
// backend/src/controllers/report.controller.ts
export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query: any = { reporter: userId };
    if (status && status !== "all") query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("reviewedBy", "firstName lastName")
        .lean(),
      Report.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getMyReports error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت گزارشات" });
  }
};
