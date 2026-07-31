import { Request, Response } from "express";
import { Transaction } from "../models/Transaction.model";

export const getFinancialSummary = async (req: Request, res: Response) => {
  try {
    const totalRevenueAgg = await Transaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenueAgg = await Transaction.aggregate([
      { $match: { status: "success", createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthRevenueAgg = await Transaction.aggregate([
      { $match: { status: "success", createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.total || 0;

    const monthlyData = await Transaction.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    const chartData = monthlyData.map((item) => ({
      month: item._id,
      revenue: item.revenue,
      count: item.count,
    }));

    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "firstName lastName phone")
      .lean();

    res.json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue,
        thisMonthRevenue,
        chartData,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error("Financial summary error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت گزارش مالی" });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName lastName phone")
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت تراکنش‌ها" });
  }
};
