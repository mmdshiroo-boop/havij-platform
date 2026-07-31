import { Response } from "express";
import { Conversation } from "../models/Conversation.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { Message } from "../models/Message.model";

// دریافت لیست تمام گفتگوها
export const getAllConversations = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { "participants.firstName": { $regex: search, $options: "i" } },
        { "participants.lastName": { $regex: search, $options: "i" } },
        { "participants.phone": { $regex: search, $options: "i" } },
      ];
    }

    const sort: any = { [sortBy as string]: sortOrder === "asc" ? 1 : -1 };

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate("participants", "firstName lastName phone avatar")
        .populate("lastMessage")
        .sort(sort)
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .lean(),
      Conversation.countDocuments(filter),
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
    console.error("Get all conversations error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت گفتگوها" });
  }
};

// دریافت پیام‌های یک گفتگو
export const getConversationMessages = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, sortOrder = "asc" } = req.query;

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: sortOrder === "desc" ? -1 : 1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .populate("sender", "firstName lastName phone role")
      .lean();

    const total = await Message.countDocuments({
      conversation: conversationId,
    });

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    console.error("Get conversation messages error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت پیام‌ها" });
  }
};

// آمار کلی چت
export const getChatStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalConversations, totalMessages, activeConversations] =
      await Promise.all([
        Conversation.countDocuments(),
        Message.countDocuments(),
        Conversation.countDocuments({ status: "active" }),
      ]);

    // ۱۰ کاربر با بیشترین پیام
    const topSenders = await Message.aggregate([
      { $group: { _id: "$sender", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          count: 1,
          "user.firstName": 1,
          "user.lastName": 1,
          "user.phone": 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalConversations,
        totalMessages,
        activeConversations,
        topSenders,
      },
    });
  } catch (error) {
    console.error("Get chat stats error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت آمار" });
  }
};
