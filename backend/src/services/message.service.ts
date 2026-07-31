// backend/src/services/message.service.ts
import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.model";
import { Message } from "../models/Message.model";

export class MessageService {
  // ایجاد یا دریافت مکالمه
  static async getOrCreateConversation(
    userId: string,
    otherUserId: string,
    adId?: string,
  ) {
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(userId),
          new mongoose.Types.ObjectId(otherUserId),
        ],
      },
    });

    if (!conversation) {
      conversation = await (Conversation as any).create({
        // 👈 cast برای پذیرش فیلدهای اضافه
        participants: [
          new mongoose.Types.ObjectId(userId),
          new mongoose.Types.ObjectId(otherUserId),
        ],
        adId: adId ? new mongoose.Types.ObjectId(adId) : undefined, // اگر اسکیما adId دارد
        unreadCount: new Map([
          [userId, 0],
          [otherUserId, 0],
        ]),
      });
    }

    return conversation;
  }

  // ارسال پیام
  static async sendMessage(
    senderId: string,
    receiverId: string,
    message: string,
    adId?: string,
  ) {
    const conversation = await this.getOrCreateConversation(
      senderId,
      receiverId,
      adId,
    );

    const newMessage = await (Message as any).create({
      // 👈 cast برای فیلدهای مدل
      conversationId: conversation._id, // اگر اسکیما conversationId دارد
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      message,
      type: "text",
    });

    conversation.lastMessage = message;
    conversation.lastMessageAt = new Date();

    // اگر اسکیما lastMessageSenderId یا lastMessageSender دارد
    (conversation as any).lastMessageSender = new mongoose.Types.ObjectId(
      senderId,
    );

    // دسترسی به unreadCount از طریق cast
    const currentUnread =
      (conversation as any).unreadCount.get(receiverId) || 0;
    (conversation as any).unreadCount.set(receiverId, currentUnread + 1);

    await conversation.save();

    return { message: newMessage, conversation };
  }

  // دریافت پیام‌های یک مکالمه
  static async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversationId: new mongoose.Types.ObjectId(conversationId), // اگر اسکیما conversationId دارد
      isDeleted: false,
      deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    await this.markMessagesAsRead(conversationId, userId);

    return messages.reverse();
  }

  // علامت خواندن پیام‌ها
  static async markMessagesAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await Message.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId), // اگر اسکیما conversationId دارد
        receiverId: new mongoose.Types.ObjectId(userId), // اگر receiverId دارد
        isRead: false,
      },
      { isRead: true, readAt: new Date() },
    );

    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCount.${userId}`]: 0 } },
    );
  }

  // دریافت لیست مکالمات کاربر
  static async getConversations(userId: string) {
    const conversations = await Conversation.find({
      participants: new mongoose.Types.ObjectId(userId),
      isActive: true,
    })
      .populate("participants", "firstName lastName phone avatar")
      .populate("adId", "title images") // اگر اسکیما adId دارد
      .sort({ lastMessageAt: -1 })
      .lean();

    return conversations.map((conv: any) => ({
      ...conv,
      unreadCount:
        conv.unreadCount instanceof Map
          ? Object.fromEntries(conv.unreadCount)
          : conv.unreadCount || {},
    }));
  }

  // حذف پیام
  static async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<boolean> {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("پیام یافت نشد");

    const msg = message as any;
    if (!msg.deletedFor) msg.deletedFor = [];
    msg.deletedFor.push(new mongoose.Types.ObjectId(userId));

    if (msg.deletedFor.length === 2) {
      await Message.deleteOne({ _id: messageId });
    } else {
      await message.save();
    }

    return true;
  }
}
