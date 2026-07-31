// backend/src/controllers/session.controller.ts
import { Response } from "express";
import Session from "../models/Session";
import { AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const sessions = await Session.find({ user: userId })
      .sort({ lastActive: -1 })
      .lean();

    const data = sessions.map((s) => ({
      ...s,
      isCurrent: s._id.toString() === req.sessionId?.toString(),
    }));

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ message: "خطا در دریافت نشست‌ها" });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (id === req.sessionId?.toString()) {
      return res
        .status(400)
        .json({ message: "نمی‌توانید نشست جاری را لغو کنید" });
    }

    const session = await Session.findOneAndDelete({ _id: id, user: userId });
    if (!session) return res.status(404).json({ message: "نشست یافت نشد" });

    // Audit log
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.USER_LOGOUT, // or a specific SESSION_REVOKED
      resource: "Session",
      resourceId: id,
      description: `کاربر ${req.user?.firstName || req.user?.phone} یک نشست خود را لغو کرد.`,
      metadata: {
        device: session.device,
        browser: session.browser,
        os: session.os,
      },
      req,
    });

    return res.json({ success: true, message: "نشست با موفقیت لغو شد" });
  } catch (error) {
    return res.status(500).json({ message: "خطا در لغو نشست" });
  }
};

export const revokeAllOtherSessions = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user._id;
    const { allOther } = req.body;
    if (!allOther) return res.status(400).json({ message: "درخواست نامعتبر" });

    await Session.deleteMany({ user: userId, _id: { $ne: req.sessionId } });

    // Audit log
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.USER_LOGOUT, // or a more specific action
      resource: "Session",
      description: `کاربر ${req.user?.firstName || req.user?.phone} از همه دستگاه‌های دیگر خارج شد.`,
      req,
    });

    return res.json({
      success: true,
      message: "همه دستگاه‌های دیگر خارج شدند",
    });
  } catch (error) {
    return res.status(500).json({ message: "خطا در خروج از دستگاه‌ها" });
  }
};
