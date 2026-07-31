// backend/src/controllers/conversation.controller.ts
import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Conversation } from "../models/Conversation.model";
import { Message } from "../models/Message.model";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";
import { sendRealTimeMessage } from "../socket";

// ==========================================
// 👥 بخش کاربران (User Routes)
// ==========================================

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "firstName lastName avatar phone")
      .populate("ad", "title images price")
      .sort({ lastMessageAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          readBy: { $ne: userId },
        });
        return { ...conv.toObject(), unreadCount };
      }),
    );

    res.json({ success: true, data: conversationsWithUnread });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({ message: "خطا در دریافت گفتگوها" });
  }
};

export const createOrGetConversation = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { participantId, adId } = req.body;
    const userId = req.user._id;

    if (participantId === userId.toString()) {
      return res.status(400).json({ message: "نمی‌توانید با خودتان چت کنید" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
      ad: adId || null,
    });

    const isNew = !conversation;

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, participantId],
        ad: adId || null,
      });
    }

    await conversation.populate(
      "participants",
      "firstName lastName avatar phone",
    );

    if (isNew) {
      await createAuditLog({
        userId: userId.toString(),
        action: AuditAction.SYSTEM,
        resource: "Conversation",
        resourceId: conversation._id.toString(),
        description: `کاربر ${req.user?.firstName || req.user?.phone} یک گفتگوی جدید ایجاد کرد.`,
        metadata: { participantId, adId },
        req,
      });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: "خطا در ایجاد گفتگو" });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const messages = await Message.find({ conversation: id, deletedAt: null })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت پیام‌ها" });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "گفتگو یافت نشد" });
    }

    await Message.updateMany(
      { conversation: id, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );

    res.json({ success: true, message: "پیام‌ها با موفقیت خوانده شدند" });
  } catch (error) {
    console.error("markAsRead error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در تغییر وضعیت پیام" });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "گفتگو یافت نشد یا دسترسی ندارید" });
    }

    await Conversation.findByIdAndDelete(id);
    await Message.deleteMany({ conversation: id });

    res.json({ success: true, message: "گفتگو با موفقیت حذف شد" });
  } catch (error) {
    console.error("deleteConversation error:", error);
    res.status(500).json({ success: false, message: "خطا در حذف گفتگو" });
  }
};

// ==========================================
// 🆕 آپلود فایل
// ==========================================
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "خطا: فایلی دریافت نشد. مطمئن شوید نام کلید ارسال شده 'file' است.",
      });
    }

const conversationId = String(req.params.id);
    const userId = req.user._id;
    const { content } = req.body;

    // اعتبارسنجی شناسه
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "شناسه گفتگو نامعتبر است",
      });
    }

    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

    const isImage = req.file.mimetype.startsWith("image/");
    const messageType = isImage ? "image" : "file";
    const fileUrl = `/uploads/chat/${req.file.filename}`;

    // ذخیره پیام
    const newMessage = await Message.create({
      conversation: conversationObjectId,
      sender: userId,
      content: content || "",
      type: messageType,
      fileUrl: fileUrl,
      readBy: [userId],
    });

    if (!newMessage) {
      return res
        .status(500)
        .json({ success: false, message: "خطا در ثبت پیام در دیتابیس" });
    }

    // به‌روزرسانی آخرین پیام در گفتگو
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: isImage ? "📷 تصویر" : "📁 فایل",
        lastMessageAt: new Date(),
      },
      { new: true },
    );

    // populate برای ارسال real-time
    const populatedMessage = await Message.findById(newMessage._id).populate(
      "sender",
      "firstName lastName avatar",
    );

    // ارسال real-time به گیرنده
    if (conversation) {
      const receiverId = conversation.participants.find(
        (p) => p.toString() !== userId.toString(),
      );
      if (receiverId) {
        sendRealTimeMessage(
          receiverId.toString(),
          populatedMessage,
          conversation,
        );
      }
    }

    res.json({
      success: true,
      message: "فایل با موفقیت آپلود و در چت ثبت شد",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("❌ uploadFile error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در فرآیند آپلود فایل در سرور" });
  }
};

// ==========================================
// 👑 بخش مدیریت و سوپرادمین (Admin Routes)
// ==========================================

export const getAllConversations = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (+page - 1) * +limit;

    const [conversations, total] = await Promise.all([
      Conversation.find()
        .populate("participants", "firstName lastName avatar phone role")
        .populate("ad", "title images price status")
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(+limit)
        .lean(),
      Conversation.countDocuments(),
    ]);

    res.json({
      success: true,
      data: conversations,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    console.error("❌ getAllConversations admin error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت لیست مکالمات سیستم" });
  }
};

export const getConversationMessages = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const messages = await Message.find({ conversation: id })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("❌ getConversationMessages admin error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت پیام‌های گفتگو" });
  }
};

export const getChatStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalConversations = await Conversation.countDocuments();
    const totalMessages = await Message.countDocuments();

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newConversations24h = await Conversation.countDocuments({
      createdAt: { $gte: last24h },
    });
    const newMessages24h = await Message.countDocuments({
      createdAt: { $gte: last24h },
    });

    res.json({
      success: true,
      data: {
        totalConversations,
        totalMessages,
        newConversations24h,
        newMessages24h,
      },
    });
  } catch (error) {
    console.error("❌ getChatStats admin error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت آمار چت" });
  }
};

export const deleteConversationAdmin = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findByIdAndDelete(id);

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "گفتگو یافت نشد" });
    }

    await Message.deleteMany({ conversation: id });

    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.SYSTEM,
      resource: "Conversation",
      resourceId: id,
      description: `حذف چت ادمین: کل چت شناسه ${id} حذف شد.`,
      req,
    });

    res.json({
      success: true,
      message: "گفتگو و تمام پیام‌های آن توسط مدیر حذف شد",
    });
  } catch (error) {
    console.error("❌ deleteConversationAdmin error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در حذف گفتگو توسط مدیر" });
  }
};

export const deleteMessageAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const message = await Message.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({ success: false, message: "پیام یافت نشد" });
    }

    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.SYSTEM,
      resource: "Message",
      resourceId: id,
      description: `حذف پیام ادمین: پیام با شناسه ${id} حذف شد.`,
      req,
    });

    res.json({
      success: true,
      message: "پیام با موفقیت توسط مدیر سیستم حذف شد",
    });
  } catch (error) {
    console.error("❌ deleteMessageAdmin error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در حذف پیام توسط مدیر" });
  }
};