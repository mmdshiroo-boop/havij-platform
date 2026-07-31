import { Request, Response, NextFunction, Router } from "express";
import SmsService, {
  getSmsService,
  SendSMSResult,
} from "../../../../services/sms.service";
import {
  SmsLog,
  SmsTemplate,
  ISmsLog,
  DEFAULT_TEMPLATES,
} from "../../../../models/sms.model";

/**
 * ============================================
 * کنترلر مدیریت پیامک (بخش ادمین)
 * ============================================
 * تمامی مسیرها نیازمند احراز هویت ادمین هستند.
 * از middleware احراز هویت قبل از این کنترلر استفاده کنید.
 *
 * مثال:
 *   app.use('/api/admin/sms', requireAuth, requireAdmin, smsRouter);
 */

// ─────────────────────────────────────────
// اینترفیس‌ها
// ─────────────────────────────────────────

/** تنظیمات سرویس پیامک */
interface SmsConfig {
  username: string;
  password: string;
  fromNumber: string;
}

/** صفحه‌بندی */
interface PaginationQuery {
  page?: string;
  limit?: string;
  type?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ─────────────────────────────────────────
// کلاس کنترلر
// ─────────────────────────────────────────
class SmsController {
  private router: Router;
  private smsService: SmsService;

  constructor(config: SmsConfig) {
    this.router = Router();
    this.smsService = getSmsService(config);

    // ثبت مسیرها
    this.registerRoutes();
  }

  /**
   * دریافت روتر Express
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * دریافت نمونه سرویس پیامک
   */
  getService(): SmsService {
    return this.smsService;
  }

  /**
   * ثبت تمامی مسیرهای کنترلر
   */
  private registerRoutes(): void {
    // ارسال پیامک
    this.router.post("/send", this.sendSMS.bind(this));

    // ارسال پیامک آزمایشی
    this.router.post("/test", this.sendTestSMS.bind(this));

    // دریافت موجودی
    this.router.get("/credit", this.getCreditBalance.bind(this));

    // دریافت لاگ‌ها (صفحه‌بندی شده)
    this.router.get("/logs", this.getSmsLogs.bind(this));

    // دریافت آمار
    this.router.get("/stats", this.getSmsStats.bind(this));

    // پخش پیامک (برودکست)
    this.router.post("/broadcast", this.broadcastSMS.bind(this));

    // دریافت قالب‌های پیامک
    this.router.get("/templates", this.getTemplates.bind(this));

    // بروزرسانی قالب پیامک
    this.router.put("/templates/:id", this.updateTemplate.bind(this));

    // ایجاد قالب جدید
    this.router.post("/templates", this.createTemplate.bind(this));

    // مقداردهی قالب‌های پیش‌فرض
    this.router.post("/templates/seed", this.seedTemplates.bind(this));
  }

  // ─────────────────────────────────────────
  // مسیر: POST /api/admin/sms/send
  // ارسال پیامک به شماره‌های مشخص
  // ─────────────────────────────────────────

  /**
   * ارسال پیامک (ادمین)
   * Body: { to: string[], text: string, sendAt?: string }
   */
  private async sendSMS(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { to, text, sendAt } = req.body;

      // ── اعتبارسنجی ورودی‌ها ──
      if (!to || !Array.isArray(to) || to.length === 0) {
        res.status(400).json({
          success: false,
          error: "حداقل یک شماره گیرنده باید وارد شود",
        });
        return;
      }

      if (!text || text.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: "متن پیامک الزامی است",
        });
        return;
      }

      if (text.length > 1000) {
        res.status(400).json({
          success: false,
          error: "متن پیامک نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد",
        });
        return;
      }

      // حداکثر ۱۰۰۰ گیرنده در هر درخواست
      if (to.length > 1000) {
        res.status(400).json({
          success: false,
          error: "حداکثر ۱۰۰۰ گیرنده در هر درخواست مجاز است",
        });
        return;
      }

      // اعتبارسنجی فرمت شماره‌ها
      for (const number of to) {
        if (!number || number.trim().length < 10) {
          res.status(400).json({
            success: false,
            error: `شماره "${number}" نامعتبر است`,
          });
          return;
        }
      }

      // تبدیل زمان ارسال در صورت وجود
      let scheduledDate: Date | undefined;
      if (sendAt) {
        scheduledDate = new Date(sendAt);
        if (isNaN(scheduledDate.getTime())) {
          res.status(400).json({
            success: false,
            error: "فرمت زمان ارسال نامعتبر است",
          });
          return;
        }

        // زمان ارسال باید در آینده باشد
        if (scheduledDate <= new Date()) {
          res.status(400).json({
            success: false,
            error: "زمان ارسال باید در آینده باشد",
          });
          return;
        }
      }

      // ── ارسال پیامک ──
      const result: SendSMSResult = await this.smsService.sendSMS(to, text, {
        sendAt: scheduledDate,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "پیامک با موفقیت ارسال شد",
          data: {
            messageId: result.messageId,
            cost: result.cost,
            recipientCount: to.length,
            scheduledAt: scheduledDate || null,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || "خطا در ارسال پیامک",
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // مسیر: POST /api/admin/sms/test
  // ارسال پیامک آزمایشی
  // ─────────────────────────────────────────

  /**
   * ارسال پیامک آزمایشی به شماره مشخص
   * Body: { to: string } (اختیاری - پیش‌فرض شماره ادمین)
   */
  private async sendTestSMS(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { to } = req.body;

      if (!to || typeof to !== "string" || to.trim().length < 10) {
        res.status(400).json({
          success: false,
          error: "شماره گیرنده الزامی است",
        });
        return;
      }

      const testMessage = "این یک پیامک آزمایشی از سایت املاک است.";

      const result = await this.smsService.sendSMS(to, testMessage);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "پیامک آزمایشی ارسال شد",
          data: {
            messageId: result.messageId,
            cost: result.cost,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || "خطا در ارسال پیامک آزمایشی",
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // مسیر: GET /api/admin/sms/credit
  // دریافت موجودی حساب
  // ─────────────────────────────────────────

  /**
   * دریافت موجودی پیامک
   */
  private async getCreditBalance(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const balance = await this.smsService.getCreditBalance();

      res.status(200).json({
        success: true,
        data: {
          remaining: balance.remaining,
          used: balance.used,
          // محاسبه تقریبی تعداد روز باقی‌مانده (فرض ۱۰۰ پیامک در روز)
          estimatedDaysLeft: Math.floor(balance.remaining / 100),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // مسیر: GET /api/admin/sms/logs
  // دریافت لاگ‌های پیامک (صفحه‌بندی)
  // ─────────────────────────────────────────

  /**
   * دریافت لاگ‌های پیامک
   * Query: page, limit, type, status, search, startDate, endDate
   */
  private async getSmsLogs(
    req: Request<{}, {}, {}, PaginationQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page || "1", 10));
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit || "20", 10)),
      );
      const skip = (page - 1) * limit;

      // ساخت فیلتر
      const filter: Record<string, any> = {};

      // فیلتر بر اساس نوع
      if (req.query.type) {
        filter.type = req.query.type;
      }

      // فیلتر بر اساس وضعیت
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // جستجو در متن یا شماره
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, "i");
        filter.$or = [{ message: searchRegex }, { recipient: searchRegex }];
      }

      // فیلتر بازه تاریخی
      if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {};
        if (req.query.startDate) {
          filter.createdAt.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
          filter.createdAt.$lte = new Date(req.query.endDate);
        }
      }

      // دریافت لاگ‌ها با صفحه‌بندی
      const [logs, total] = await Promise.all([
        SmsLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("sentBy", "name phone")
          .lean()
          .exec(),
        SmsLog.countDocuments(filter).exec(),
      ]);

      // محاسبه تعداد صفحات
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // مسیر: GET /api/admin/sms/stats
  // دریافت آمار پیامک‌ها
  // ─────────────────────────────────────────

  /**
   * دریافت آمار جامع پیامک
   * Query: startDate, endDate
   */
  private async getSmsStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const stats = await SmsLog.getStats(startDate, endDate);

      // آمار ۷ روز اخیر برای نمودار
      const last7Days = await this.getLast7DaysStats();

      // آمار امروز
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStats = await SmsLog.getStats(todayStart, new Date());

      res.status(200).json({
        success: true,
        data: {
          overall: stats,
          today: todayStats,
          last7Days,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // مسیر: POST /api/admin/sms/broadcast
  // پخش پیامک به گروه‌های مختلف
  // ─────────────────────────────────────────

  /**
   * ارسال پیامک انبوه (برودکست)
   * Body: { target: 'all' | 'agents' | 'vip', text: string }
   */
  private async broadcastSMS(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { target, text } = req.body;

      // ── اعتبارسنجی ──
      if (!target || !["all", "agents", "vip"].includes(target)) {
        res.status(400).json({
          success: false,
          error: "مخاطب نامعتبر است (all, agents, vip)",
        });
        return;
      }

      if (!text || text.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: "متن پیامک الزامی است",
        });
        return;
      }

      // ── استخراج شماره مخاطبین ──
      let recipients: string[] = [];

      switch (target) {
        case "agents":
          recipients = await this.getAgentPhoneNumbers();
          break;

        case "vip":
          recipients = await this.getVipUserPhoneNumbers();
          break;

        case "all":
          recipients = await this.getAllUserPhoneNumbers();
          break;
      }

      if (recipients.length === 0) {
        res.status(404).json({
          success: false,
          error: "مخاطبی یافت نشد",
        });
        return;
      }

      // ── ارسال انبوه با گزارش پیشرفت ──
      // نکته: در درخواست HTTP نمی‌توان onProgress را به کاربر ارسال کرد
      // بنابراین ارسال به صورت پس‌زمینه انجام می‌شود

      // ثبت درخواست برودکست
      const broadcastLog = await SmsLog.create({
        recipient: `${recipients.length} گیرنده (${target})`,
        sender: "",
        message: text,
        type: "marketing",
        status: "pending",
        cost: 0,
        sentBy: (req as any).user?._id || null,
        provider: "meli_payamak",
      });

      // ارسال در پس‌زمینه (آسینکرون)
      this.sendBulkInBackground(
        recipients,
        text,
        broadcastLog._id.toString(),
      ).catch((err) => {
        console.error("خطا در ارسال انبوه پس‌زمینه:", err);
      });

      res.status(200).json({
        success: true,
        message: `درخواست ارسال انبوه به ${recipients.length} گیرنده ثبت شد`,
        data: {
          recipientCount: recipients.length,
          target,
          broadcastId: broadcastLog._id,
          estimatedCost: Math.ceil(text.length / 70) * recipients.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // مسیر: GET /api/admin/sms/templates
  // دریافت قالب‌های پیامک
  // ─────────────────────────────────────────

  /**
   * دریافت تمامی قالب‌های پیامک
   */
  private async getTemplates(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const templates = await SmsTemplate.find({})
        .sort({ type: 1, name: 1 })
        .lean()
        .exec();

      res.status(200).json({
        success: true,
        data: {
          templates,
          // متغیرهای قابل استفاده در قالب‌ها
          availableVariables: {
            otp: ["code"],
            welcome: ["name"],
            ad_published: ["adTitle", "adUrl"],
            ad_approved: ["adTitle", "adUrl"],
            ad_rejected: ["adTitle"],
            subscription_renewal: ["name"],
            general_broadcast: ["text"],
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // مسیر: PUT /api/admin/sms/templates/:id
  // بروزرسانی قالب پیامک
  // ─────────────────────────────────────────

  /**
   * بروزرسانی قالب پیامک
   */
  private async updateTemplate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { name, content, isActive, description } = req.body;

      // جستجوی قالب
      const template = await SmsTemplate.findById(id).exec();
      if (!template) {
        res.status(404).json({
          success: false,
          error: "قالب یافت نشد",
        });
        return;
      }

      // اعتبارسنجی محتوا
      if (content !== undefined && content.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: "محتوای قالب نمی‌تواند خالی باشد",
        });
        return;
      }

      if (content && content.length > 1000) {
        res.status(400).json({
          success: false,
          error: "محتوای قالب نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد",
        });
        return;
      }

      // بروزرسانی فیلدها
      if (name !== undefined) template.name = name;
      if (content !== undefined) template.content = content;
      if (isActive !== undefined) template.isActive = isActive;
      if (description !== undefined) template.description = description;

      await template.save();

      res.status(200).json({
        success: true,
        message: "قالب با موفقیت بروزرسانی شد",
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // مسیر: POST /api/admin/sms/templates
  // ایجاد قالب جدید
  // ─────────────────────────────────────────

  /**
   * ایجاد قالب پیامک جدید
   */
  private async createTemplate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, key, content, type, isActive, description } = req.body;

      // اعتبارسنجی
      if (!name || !key || !content || !type) {
        res.status(400).json({
          success: false,
          error: "فیلدهای name, key, content و type الزامی هستند",
        });
        return;
      }

      // بررسی تکراری نبودن کلید
      const existing = await SmsTemplate.findOne({ key }).exec();
      if (existing) {
        res.status(409).json({
          success: false,
          error: "قالبی با این کلید از قبل وجود دارد",
        });
        return;
      }

      // ایجاد قالب
      const template = await SmsTemplate.create({
        name,
        key,
        content,
        type,
        isActive: isActive !== undefined ? isActive : true,
        description: description || "",
      });

      res.status(201).json({
        success: true,
        message: "قالب با موفقیت ایجاد شد",
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // مسیر: POST /api/admin/sms/templates/seed
  // مقداردهی قالب‌های پیش‌فرض
  // ─────────────────────────────────────────

  /**
   * ایجاد قالب‌های پیش‌فرض در صورت عدم وجود
   */
  private async seedTemplates(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const createdCount = await SmsTemplate.seedDefaults();

      res.status(200).json({
        success: true,
        message:
          createdCount > 0
            ? `${createdCount} قالب پیش‌فرض ایجاد شد`
            : "تمامی قالب‌های پیش‌فرض از قبل وجود دارند",
        data: { createdCount },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─────────────────────────────────────────
  // متدهای کمکی
  // ─────────────────────────────────────────

  /**
   * ارسال انبوه در پس‌زمینه
   * بروزرسانی لاگ برودکست پس از اتمام
   */
  private async sendBulkInBackground(
    recipients: string[],
    text: string,
    broadcastLogId: string,
  ): Promise<void> {
    const result = await this.smsService.sendBulkSMS(recipients, text);

    // بروزرسانی لاگ برودکست
    await SmsLog.findByIdAndUpdate(broadcastLogId, {
      status: result.totalFailed === 0 ? "sent" : "failed",
      cost: Math.ceil(text.length / 70) * result.totalSent,
    }).exec();

    console.log(
      `برودکست ${broadcastLogId}: ${result.totalSent} موفق، ${result.totalFailed} ناموفق`,
    );
  }

  /**
   * دریافت شماره تلفن مشاوران املاک
   * TODO: جایگزینی با مدل واقعی Agent
   */
  private async getAgentPhoneNumbers(): Promise<string[]> {
    try {
      // دریافت از مدل User با نقش agent
      // در اینجا از مدل User فرضی استفاده شده
      const User = (await import("mongoose")).default.model("User");
      const agents = await User.find({
        role: "agent",
        phone: { $exists: true, $ne: "" },
      })
        .select("phone -_id")
        .lean()
        .exec();

      return agents.map((a: any) => a.phone).filter(Boolean);
    } catch {
      // اگر مدل User وجود نداشت، آرایه خالی برمی‌گردانیم
      console.warn("مدل User یافت نشد. امکان دریافت شماره مشاوران نیست.");
      return [];
    }
  }

  /**
   * دریافت شماره تلفن کاربران VIP
   * TODO: جایگزینی با مدل واقعی و منطق VIP
   */
  private async getVipUserPhoneNumbers(): Promise<string[]> {
    try {
      const User = (await import("mongoose")).default.model("User");
      const vipUsers = await User.find({
        isVip: true,
        phone: { $exists: true, $ne: "" },
      })
        .select("phone -_id")
        .lean()
        .exec();

      return vipUsers.map((u: any) => u.phone).filter(Boolean);
    } catch {
      console.warn("مدل User یافت نشد. امکان دریافت شماره کاربران VIP نیست.");
      return [];
    }
  }

  /**
   * دریافت شماره تلفن تمامی کاربران
   */
  private async getAllUserPhoneNumbers(): Promise<string[]> {
    try {
      const User = (await import("mongoose")).default.model("User");
      const users = await User.find({
        phone: { $exists: true, $ne: "" },
        // حذف کاربرانی که دریافت پیامک را غیرفعال کرده‌اند
        smsOptOut: { $ne: true },
      })
        .select("phone -_id")
        .lean()
        .exec();

      return users.map((u: any) => u.phone).filter(Boolean);
    } catch {
      console.warn("مدل User یافت نشد. امکان دریافت شماره کاربران نیست.");
      return [];
    }
  }

  /**
   * دریافت آمار ۷ روز اخیر برای نمودار
   */
  private async getLast7DaysStats(): Promise<
    Array<{ date: string; sent: number; delivered: number; failed: number }>
  > {
    const days: Array<{
      date: string;
      sent: number;
      delivered: number;
      failed: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayStats = await SmsLog.aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextDate },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const stat: {
        date: string;
        sent: number;
        delivered: number;
        failed: number;
      } = {
        date: date.toISOString().split("T")[0],
        sent: 0,
        delivered: 0,
        failed: 0,
      };

      for (const s of dayStats) {
        if (s._id === "sent") stat.sent = s.count;
        if (s._id === "delivered") stat.delivered = s.count;
        if (s._id === "failed") stat.failed = s.count;
      }

      days.push(stat);
    }

    return days;
  }
}

// ─────────────────────────────────────────
// تابع کمکی ساخت کنترلر
// ─────────────────────────────────────────

/**
 * ساخت و پیکربندی کنترلر پیامک
 * @param config - تنظیمات ملی پیامک
 * @returns روتر Express آماده اتصال به اپلیکیشن
 *
 * @example
 * // در فایل routes یا app
 * import { createSmsController } from './sms.controller';
 *
 * const smsConfig = {
 *   username: process.env.SMS_USERNAME!,
 *   password: process.env.SMS_PASSWORD!,
 *   fromNumber: process.env.SMS_FROM_NUMBER!,
 * };
 *
 * app.use('/api/admin/sms', requireAuth, requireAdmin, createSmsController(smsConfig));
 */
export function createSmsController(config: SmsConfig): Router {
  const controller = new SmsController(config);
  return controller.getRouter();
}

/**
 * دریافت نمونه کنترلر (برای استفاده در سایر ماژول‌ها)
 */
export function getSmsController(config: SmsConfig): SmsController {
  return new SmsController(config);
}

export default SmsController;
