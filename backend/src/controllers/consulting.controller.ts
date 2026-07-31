import { Request, Response } from "express";
import { Consulting } from "../models/Consulting.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/User.model";
import {
  sendNotificationToUser,
  notifyAgents,
  notifyExperts,
} from "../services/notification.service";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// عمومی: ثبت درخواست مشاوره
export const createConsultingRequest = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, subject, message, preferredDate } =
      req.body;
    if (!firstName || !lastName || !phone || !subject) {
      return res.status(400).json({
        success: false,
        message: "نام، نام خانوادگی، تلفن و موضوع الزامی است",
      });
    }

    const consulting = await Consulting.create({
      firstName,
      lastName,
      phone,
      subject,
      message,
      preferredDate,
    });

    // Audit log
    await createAuditLog({
      action: AuditAction.SYSTEM,
      resource: "Consulting",
      resourceId: consulting._id.toString(),
      description: `درخواست مشاورهٔ جدید با موضوع "${subject}" از طرف ${firstName} ${lastName} (${phone}) ثبت شد.`,
      req,
    });

    // 🆕 اعلان به مشاوران (agent)
    // await notifyAgents(
    //   "📋 درخواست مشاوره جدید",
    //   `درخواست مشاوره با موضوع "${subject}" از طرف ${firstName} ${lastName} ثبت شد.`,
    //   "listing_inquiry",
    //   "/panel/agent/consulting",
    //   { consultingId: consulting._id.toString(), subject, phone },
    // );

    // 🆕 اعلان به کارشناسان (expert)
    await notifyExperts(
      "📋 درخواست مشاوره جدید",
      `درخواست مشاوره با موضوع "${subject}" از طرف ${firstName} ${lastName} ثبت شد.`,
      "listing_inquiry",
      "/panel/expert/consulting",
      { consultingId: consulting._id.toString(), subject, phone },
    );

    return res.status(201).json({
      success: true,
      data: consulting,
      message: "درخواست مشاوره ثبت شد",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "خطا در ثبت درخواست" });
  }
};

export const getMyConsultingRequests = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?._id;
    const userPhone = req.user?.phone;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    if (!userPhone) {
      return res.status(400).json({
        success: false,
        message: "شماره تلفن در پروفایل شما ثبت نشده است",
      });
    }

    // 👇 نرمال‌سازی شماره تلفن: حذف +98، 0098، صفر اول، فاصله و خط تیره
    const normalize = (phone: string) => {
      return phone
        .replace(/^\+98/, "") // +98 ابتدای رشته
        .replace(/^0098/, "") // 0098 ابتدای رشته
        .replace(/^0/, "") // صفر اول
        .replace(/[\s-]/g, ""); // فاصله و خط تیره
    };

    const normalizedUserPhone = normalize(userPhone);

    const { status } = req.query;
    const filter: any = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    // جستجوی درخواست‌هایی که شماره تلفن نرمال‌شده‌شان با شماره کاربر مطابقت دارد
    // همچنین می‌توانیم بر اساس userId هم فیلتر کنیم (اگر کاربر لاگین کرده و userId معتبر است)
    const requests = await Consulting.find({
      ...filter,
      $or: [
        // شماره‌هایی که در دیتابیس ذخیره شده‌اند، نرمال‌سازی می‌شوند و مقایسه می‌شوند
        { phone: { $regex: new RegExp(`^0?${normalizedUserPhone}$`) } },
        { phone: { $regex: new RegExp(`^\\+98${normalizedUserPhone}$`) } },
        { phone: { $regex: new RegExp(`^0098${normalizedUserPhone}$`) } },
        { phone: normalizedUserPhone }, // در صورتی که در دیتابیس شماره نرمال ذخیره شده باشد
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("getMyConsultingRequests error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت درخواست‌ها" });
  }
};
// کارشناس: دریافت لیست
export const getConsultingRequests = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    const requests = await Consulting.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: requests });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "خطا در دریافت درخواست‌ها" });
  }
};

// کارشناس: تغییر وضعیت
export const updateConsultingStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ success: false, message: "وضعیت نامعتبر" });
    }

    const updated = await Consulting.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "درخواست یافت نشد" });

    // 🆕 ارسال اعلان به کاربر (در صورت تأیید یا رد)
    try {
      const user = await User.findOne({ phone: updated.phone });
      if (user) {
        if (status === "approved") {
          await sendNotificationToUser(
            user._id.toString(),
            "✅ درخواست مشاوره تأیید شد",
            `درخواست شما با موضوع "${updated.subject}" توسط کارشناس تأیید شد. به زودی با شما تماس گرفته خواهد شد.`,
            "success",
            "/panel/my-consulting",
            { consultingId: updated._id.toString(), subject: updated.subject },
          );
        } else if (status === "rejected") {
          await sendNotificationToUser(
            user._id.toString(),
            "❌ درخواست مشاوره رد شد",
            `درخواست شما با موضوع "${updated.subject}" رد شد.`,
            "warning",
            "/panel/consulting",
            { consultingId: updated._id.toString(), subject: updated.subject },
          );
        } else if (status === "completed") {
          await sendNotificationToUser(
            user._id.toString(),
            "✅ مشاوره تکمیل شد",
            `مشاوره با موضوع "${updated.subject}" با موفقیت به پایان رسید.`,
            "success",
            "/panel/my-consulting",
            { consultingId: updated._id.toString(), subject: updated.subject },
          );
        }
      }
    } catch (notifError) {
      console.error("❌ Failed to send notification:", notifError);
    }

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Consulting",
      resourceId: updated._id.toString(),
      description: `کارشناس ${req.user?.firstName || req.user?.phone} وضعیت درخواست مشاوره "${updated.subject}" را به "${status}" تغییر داد.`,
      req,
    });

    return res.json({
      success: true,
      data: updated,
      message: `وضعیت به "${status}" تغییر یافت`,
    });
  } catch (error) {
    console.error("Error updating consulting status:", error);
    return res
      .status(500)
      .json({ success: false, message: "خطا در تغییر وضعیت" });
  }
};
