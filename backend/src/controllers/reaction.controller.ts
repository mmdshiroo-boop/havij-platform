import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Reaction } from "../models/Reaction.model";
import { Message } from "../models/Message.model";
import { io } from "../socket";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// افزودن یا به‌روزرسانی واکنش کاربر روی یک پیام
export const toggleReaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    // ✅ تبدیل messageId به رشته
    const messageId = String(req.params.messageId);
    const { emoji } = req.body;

    if (!emoji || !["👍", "❤️", "😂", "😮", "😢", "😡"].includes(emoji)) {
      return res
        .status(400)
        .json({ success: false, message: "ایموجی نامعتبر است" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "پیام یافت نشد" });
    }

    const existing = await Reaction.findOne({
      message: messageId,
      user: userId,
    });

    if (existing) {
      if (existing.emoji === emoji) {
        await existing.deleteOne();
        if (io) {
          io.to(`conversation_${message.conversation}`).emit(
            "reaction-removed",
            { messageId, userId: userId.toString(), emoji },
          );
        }
        return res.json({ success: true, data: null, message: "واکنش حذف شد" });
      }
      existing.emoji = emoji;
      await existing.save();
      if (io) {
        io.to(`conversation_${message.conversation}`).emit("reaction-updated", {
          messageId,
          reaction: existing,
        });
      }
      return res.json({
        success: true,
        data: existing,
        message: "واکنش به‌روزرسانی شد",
      });
    }

    // ایجاد واکنش جدید
    const reaction = await Reaction.create({
      message: messageId,
      user: userId,
      emoji,
    });

    if (io) {
      io.to(`conversation_${message.conversation}`).emit("reaction-added", {
        messageId,
        reaction,
      });
    }

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "Reaction",
      resourceId: reaction._id.toString(),
      description: `کاربر ${req.user?.firstName || req.user?.phone} به پیام ${messageId} واکنش ${emoji} نشان داد.`,
      req,
    });

    res.status(201).json({ success: true, data: reaction });
  } catch (error) {
    console.error("toggleReaction error:", error);
    res.status(500).json({ success: false, message: "خطا در ثبت واکنش" });
  }
};

// دریافت همه واکنش‌های یک پیام
export const getReactions = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const reactions = await Reaction.find({ message: messageId })
      .populate("user", "firstName lastName")
      .lean();

    res.json({ success: true, data: reactions });
  } catch (error) {
    console.error("getReactions error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت واکنش‌ها" });
  }
};
