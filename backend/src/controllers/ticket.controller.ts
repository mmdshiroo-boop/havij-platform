// backend/src/controllers/ticket.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Ticket } from "../models/Ticket.model";
import {
  notifyAdmins,
  sendNotificationToUser,
} from "../services/notification.service";
import path from "path";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// ایجاد تیکت جدید توسط کاربر
export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, message, priority = "medium" } = req.body;
    const userId = req.user._id;

    if (!subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "عنوان و پیام تیکت الزامی است" });
    }

    // ✅ اصلاح: استفاده از (req as any).files برای جلوگیری از خطای TypeScript
    const file = (req as any).files?.attachment;
    let attachmentPath: string | null = null;

    if (file && !Array.isArray(file)) {
      const fileName = Date.now() + "-" + file.name;
      const uploadPath = path.join("uploads", "tickets", fileName);
      await file.mv(uploadPath);
      attachmentPath = `/uploads/tickets/${fileName}`;
    }

    const ticket = await Ticket.create({
      user: userId,
      subject,
      priority,
      messages: [
        {
          sender: "user",
          message,
          attachment: attachmentPath,
          timestamp: new Date(),
        },
      ],
    });

    // اعلان به ادمین‌ها
    await notifyAdmins(
      "🎫 تیکت جدید",
      `کاربر ${req.user.firstName || "کاربر"} یک تیکت با عنوان "${subject}" ثبت کرد`,
      "ticket_created",
      `/admin/tickets/${ticket._id}`,
    );

    // Audit log
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.TICKET_CREATED,
      resource: "Ticket",
      resourceId: ticket._id.toString(),
      description: `کاربر ${req.user.firstName || req.user.phone} تیکت جدید با عنوان "${subject}" ایجاد کرد.`,
      req,
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error("createTicket error:", error);
    res.status(500).json({ success: false, message: "خطا در ایجاد تیکت" });
  }
};

// دریافت تیکت‌های کاربر
export const getUserTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }
    const { status } = req.query;
    const filter: any = { user: userId };
    if (status && status !== "all") filter.status = status;

    const tickets = await Ticket.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error("getUserTickets error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت تیکت‌ها" });
  }
};

// دریافت جزئیات یک تیکت
export const getTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOne({ _id: id, user: req.user._id }).lean();
    if (!ticket) {
      return res.status(404).json({ success: false, message: "تیکت یافت نشد" });
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error("getTicket error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت تیکت" });
  }
};

// افزودن پاسخ به تیکت (توسط کاربر عادی)
export const addReply = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "متن پاسخ الزامی است" });
    }

    const ticket = await Ticket.findOne({ _id: id, user: req.user._id });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "تیکت یافت نشد" });
    }
    if (ticket.status === "closed") {
      return res
        .status(400)
        .json({ success: false, message: "تیکت بسته شده است" });
    }

    ticket.messages.push({
      sender: "user",
      message,
      timestamp: new Date(),
    });
    ticket.status = "open";
    await ticket.save();

    // 🆕 اعلان به ادمین‌ها
    await notifyAdmins(
      "💬 پاسخ کاربر به تیکت",
      `کاربر ${req.user.firstName || "کاربر"} به تیکت "${ticket.subject}" پاسخ داد`,
      "ticket_reply",
      `/admin/tickets/${ticket._id}`,
    );

    // Audit log
    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.TICKET_REPLIED,
      resource: "Ticket",
      resourceId: ticket._id.toString(),
      description: `کاربر ${req.user.firstName || req.user.phone} به تیکت "${ticket.subject}" پاسخ داد.`,
      req,
    });

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error("addReply error:", error);
    res.status(500).json({ success: false, message: "خطا در ارسال پاسخ" });
  }
};

// ادمین: دریافت جزئیات یک تیکت
export const getAnyTicket = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("user", "firstName lastName phone")
      .lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: "تیکت یافت نشد" });
    }

    return res.json({ success: true, data: ticket });
  } catch (error) {
    console.error("getAnyTicket error:", error);
    return res
      .status(500)
      .json({ success: false, message: "خطا در دریافت تیکت" });
  }
};

// ادمین: پاسخ به تیکت
export const adminReply = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "متن پاسخ الزامی است" });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "تیکت یافت نشد" });
    }

    ticket.messages.push({
      sender: "admin",
      message,
      timestamp: new Date(),
    });
    ticket.status = "in_progress";
    await ticket.save();

    // 🆕 اعلان به کاربر
    await sendNotificationToUser(
      ticket.user.toString(),
      "📩 پاسخ پشتیبانی",
      `پشتیبان به تیکت "${ticket.subject}" پاسخ داد`,
      "ticket_reply",
      `/panel/user/tickets/${ticket._id}`,
    );

    // Audit log
    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.TICKET_REPLIED,
      resource: "Ticket",
      resourceId: ticket._id.toString(),
      description: `ادمین ${req.user.firstName || req.user.phone} به تیکت "${ticket.subject}" پاسخ داد.`,
      req,
    });

    res.json({ success: true, data: ticket, message: "پاسخ با موفقیت ثبت شد" });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در ارسال پاسخ" });
  }
};

// بستن تیکت توسط کاربر
export const closeTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { status: "closed" },
      { new: true },
    );
    if (!ticket) {
      return res.status(404).json({ success: false, message: "تیکت یافت نشد" });
    }

    // 🆕 اعلان به ادمین‌ها
    await notifyAdmins(
      "🔒 کاربر تیکت را بست",
      `کاربر ${req.user.firstName || "کاربر"} تیکت "${ticket.subject}" را بست`,
      "ticket_closed",
      `/admin/tickets/${ticket._id}`,
    );

    // Audit log
    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.SYSTEM,
      resource: "Ticket",
      resourceId: ticket._id.toString(),
      description: `کاربر ${req.user.firstName || req.user.phone} تیکت "${ticket.subject}" را بست.`,
      req,
    });

    res.json({ success: true, message: "تیکت بسته شد" });
  } catch (error) {
    console.error("closeTicket error:", error);
    res.status(500).json({ success: false, message: "خطا در بستن تیکت" });
  }
};

// middleware برای مسدود کردن کاربران عادی
export const notUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role === "user") {
    return res.status(403).json({ success: false, message: "دسترسی غیرمجاز" });
  }
  next();
};

// تغییر وضعیت تیکت (فقط برای ادمین)
export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["open", "in_progress", "closed"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "وضعیت نامعتبر است" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).populate("user", "firstName lastName phone");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "تیکت یافت نشد" });
    }

    const statusLabels: Record<string, string> = {
      open: "باز شد",
      in_progress: "در حال بررسی",
      closed: "بسته شد",
    };

    // 🆕 اعلان به کاربر
    await sendNotificationToUser(
      ticket.user._id.toString(),
      `📌 وضعیت تیکت تغییر کرد`,
      `تیکت "${ticket.subject}" ${statusLabels[status]}`,
      status === "closed" ? "ticket_closed" : "ticket_reply",
      `/panel/user/tickets/${ticket._id}`,
    );

    // Audit log
    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.SYSTEM,
      resource: "Ticket",
      resourceId: ticket._id.toString(),
      description: `ادمین ${req.user.firstName || req.user.phone} وضعیت تیکت "${ticket.subject}" را به "${statusLabels[status]}" تغییر داد.`,
      req,
    });

    res.json({
      success: true,
      data: ticket,
      message: "وضعیت تیکت به‌روزرسانی شد",
    });
  } catch (error) {
    console.error("updateTicketStatus error:", error);
    res.status(500).json({ success: false, message: "خطا در تغییر وضعیت" });
  }
};

// ادمین: دریافت همه تیکت‌ها
export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority } = req.query;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (priority) filter.priority = priority;

    const tickets = await Ticket.find(filter)
      .populate("user", "firstName lastName phone")
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در دریافت تیکت‌ها" });
  }
};

// بازگشایی تیکت بسته‌شده (توسط کاربر)
export const reopenTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await Ticket.findOne({ _id: id, user: req.user._id });
    if (!ticket)
      return res.status(404).json({ success: false, message: "تیکت یافت نشد" });
    if (ticket.status !== "closed")
      return res.status(400).json({
        success: false,
        message: "فقط تیکت‌های بسته قابل بازگشایی هستند",
      });

    ticket.status = "open";
    ticket.reopenedAt = new Date();
    if (message) {
      ticket.messages.push({ sender: "user", message, timestamp: new Date() });
    }
    await ticket.save();

    // 🆕 اعلان به ادمین
    await notifyAdmins(
      "🔄 تیکت بازگشایی شد",
      `کاربر ${req.user.firstName || "کاربر"} تیکت "${ticket.subject}" را بازگشایی کرد`,
      "ticket_reply",
      `/admin/tickets/${ticket._id}`,
    );

    // Audit log
    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.SYSTEM,
      resource: "Ticket",
      resourceId: ticket._id.toString(),
      description: `کاربر ${req.user.firstName || req.user.phone} تیکت "${ticket.subject}" را بازگشایی کرد.`,
      req,
    });

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error("reopenTicket error:", error);
    res.status(500).json({ success: false, message: "خطا در بازگشایی تیکت" });
  }
};

// امتیازدهی به تیکت (توسط کاربر)
export const rateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "امتیاز باید بین ۱ تا ۵ باشد" });
    }

    const ticket = await Ticket.findOneAndUpdate(
      { _id: id, user: req.user._id, status: "closed" },
      { rating },
      { new: true },
    );
    if (!ticket)
      return res
        .status(404)
        .json({ success: false, message: "تیکت یافت نشد یا بسته نیست" });

    // Audit log
    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.SYSTEM,
      resource: "Ticket",
      resourceId: ticket._id.toString(),
      description: `کاربر ${req.user.firstName || req.user.phone} به تیکت "${ticket.subject}" امتیاز ${rating} داد.`,
      req,
    });

    res.json({ success: true, data: ticket, message: "امتیاز شما ثبت شد" });
  } catch (error) {
    console.error("rateTicket error:", error);
    res.status(500).json({ success: false, message: "خطا در ثبت امتیاز" });
  }
};

// جستجوی تیکت‌های کاربر
export const searchUserTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { q, status } = req.query;
    const filter: any = { user: userId };
    if (status && status !== "all") filter.status = status;
    if (q) {
      filter.$or = [
        { subject: { $regex: q, $options: "i" } },
        { "messages.message": { $regex: q, $options: "i" } },
      ];
    }
    const tickets = await Ticket.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در جستجوی تیکت‌ها" });
  }
};
