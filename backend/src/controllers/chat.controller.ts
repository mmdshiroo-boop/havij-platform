import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Conversation } from "../models/Conversation.model";
import { Message } from "../models/Message.model";
import { sendRealTimeMessage, io } from "../socket";
import { sendNotificationToUser } from "../services/notification.service";
import { sanitizeMessage } from "../middleware/chatSecurity";
import path from "path";
import fs from "fs";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// ─── ارسال پیام متنی ─────────────────────────────────
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const id = String(req.params.id);

    const body = req.body || {};
    const rawContent = body.content || "";

    const content = sanitizeMessage(rawContent.trim());
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "متن پیام را وارد کنید" });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });
    if (!conversation) {
      return res
        .status(403)
        .json({ success: false, message: "شما عضو این گفتگو نیستید" });
    }

    const message = await Message.create({
      conversation: id,
      sender: userId,
      content,
      type: "text",
      readBy: [userId],
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await Message.populate(message, {
      path: "sender",
      select: "firstName lastName avatar",
    });

    const receiverIds = conversation.participants.filter(
      (p) => p.toString() !== userId.toString(),
    );
    for (const receiverId of receiverIds) {
      sendRealTimeMessage(receiverId.toString(), message, conversation);
      await sendNotificationToUser(
        receiverId.toString(),
        `💬 پیام جدید از ${req.user.firstName || "کاربر"}`,
        content.substring(0, 50),
        "new_message",
        `/chat?conversationId=${conversation._id}`,
        { conversationId: conversation._id },
      );
    }

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "Message",
      resourceId: message._id.toString(),
      description: `کاربر ${req.user?.firstName || req.user?.phone} یک پیام متنی در گفتگو ${id} ارسال کرد.`,
      metadata: { conversationId: id, contentLength: content.length },
      req,
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ success: false, message: "خطا در ارسال پیام" });
  }
};

// ─── ویرایش پیام ─────────────────────────────────
export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const messageId = String(req.params.messageId);

    const rawContent = req.body.content || "";
    const content = sanitizeMessage(rawContent.trim());
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "متن پیام را وارد کنید" });
    }

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
      deletedAt: null,
    });
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "پیام یافت نشد یا دسترسی ندارید" });
    }
    if (message.type !== "text") {
      return res.status(400).json({
        success: false,
        message: "فقط پیام‌های متنی قابل ویرایش هستند",
      });
    }

    const oldContent = message.content;
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const conversation = await Conversation.findById(message.conversation);
    if (conversation) {
      for (const p of conversation.participants) {
        io.to(`user_${p}`).emit("message-edited", { message });
      }
    }

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "Message",
      resourceId: messageId,
      description: `کاربر ${req.user?.firstName || req.user?.phone} پیام خود را در گفتگو ${message.conversation} ویرایش کرد.`,
      metadata: {
        oldContent: oldContent.substring(0, 100),
        newContent: content.substring(0, 100),
      },
      req,
    });

    res.json({ success: true, data: message });
  } catch (error) {
    console.error("editMessage error:", error);
    res.status(500).json({ success: false, message: "خطا در ویرایش پیام" });
  }
};

// ─── حذف پیام (soft delete) ─────────────────────
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const messageId = String(req.params.messageId);

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
      deletedAt: null,
    });
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "پیام یافت نشد یا دسترسی ندارید" });
    }

    message.deletedAt = new Date();
    await message.save();

    const conversation = await Conversation.findById(message.conversation);
    if (conversation) {
      for (const p of conversation.participants) {
        io.to(`user_${p}`).emit("message-deleted", {
          messageId: message._id,
          conversationId: message.conversation,
        });
      }
    }

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.AD_DELETED,
      resource: "Message",
      resourceId: messageId,
      description: `کاربر ${req.user?.firstName || req.user?.phone} پیام خود را در گفتگو ${message.conversation} حذف کرد.`,
      req,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("deleteMessage error:", error);
    res.status(500).json({ success: false, message: "خطا در حذف پیام" });
  }
};

// ─── آپلود فایل ─────────────────────────────────
export const uploadFileMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const conversationId = String(req.params.conversationId);

    // ✅ اصلاح مهم: خواندن فایل از میدل‌ور
    const file = req.uploadedFile;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "فایلی پردازش نشده است" });
    }

    const rawContent = req.body?.content || "";
    const content = sanitizeMessage(rawContent.trim());

    const fileName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.name);

    const uploadDir = path.join(__dirname, "../../uploads/chat");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadPath = path.join(uploadDir, fileName);
    await file.mv(uploadPath);

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res
        .status(403)
        .json({ success: false, message: "دسترسی غیرمجاز" });
    }

    const messageType: "image" | "file" = file.mimetype.startsWith("image")
      ? "image"
      : "file";

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      content,
      type: messageType,
      fileUrl: `/uploads/chat/${fileName}`,
      readBy: [userId],
    });

    conversation.lastMessage = messageType === "image" ? "📷 تصویر" : "📎 فایل";
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await Message.populate(message, {
      path: "sender",
      select: "firstName lastName avatar",
    });

    const receiverIds = conversation.participants.filter(
      (p) => p.toString() !== userId.toString(),
    );

    for (const receiverId of receiverIds) {
      sendRealTimeMessage(receiverId.toString(), message, conversation);
      await sendNotificationToUser(
        receiverId.toString(),
        `💬 فایل جدید از ${req.user.firstName || "کاربر"}`,
        messageType === "image" ? "📷 تصویر جدید" : "📎 فایل جدید",
        "new_message",
        `/chat?conversationId=${conversation._id}`,
        { conversationId: conversation._id },
      );
    }

    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "Message",
      resourceId: message._id.toString(),
      description: `کاربر ${req.user?.firstName || req.user?.phone} یک فایل (${fileName}) در گفتگو ${conversationId} آپلود کرد.`,
      metadata: { fileName, fileType: file.mimetype },
      req,
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("uploadFileMessage error:", error);
    res.status(500).json({ success: false, message: "خطا در ارسال فایل" });
  }
};
