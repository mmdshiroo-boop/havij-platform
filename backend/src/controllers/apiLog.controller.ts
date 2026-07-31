// backend/src/controllers/apiLog.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ApiLog } from "../models/ApiLog.model";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// ==================== لیست لاگ‌ها ====================
export const getLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "کاربر یافت نشد" });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20),
    );
    const method = req.query.method as string;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const match: any = {};

    // کاربران عادی فقط لاگ‌های خود را ببینند
    if (
      req.user?.role !== "developer" &&
      req.user?.role !== "admin" &&
      req.user?.role !== "super_admin"
    ) {
      match.userId = userId;
    }

    if (method) match.method = method.toUpperCase();
    if (status) {
      const code = parseInt(status);
      if (!isNaN(code)) {
        match.statusCode = code;
      } else if (status.startsWith("4")) {
        match.statusCode = { $gte: 400, $lt: 500 };
      } else if (status.startsWith("5")) {
        match.statusCode = { $gte: 500, $lt: 600 };
      }
    }
    if (search) {
      match.endpoint = { $regex: search, $options: "i" };
    }
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      ApiLog.find(match)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ApiLog.countDocuments(match),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting logs:", error);
    res.status(500).json({ error: "خطا در دریافت لاگ‌ها" });
  }
};

// ==================== آنالیتیکس (بدون تغییر) ====================
export const getLogAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "کاربر یافت نشد" });

    const days = Math.min(
      90,
      Math.max(1, parseInt(req.query.days as string) || 7),
    );
    const since = new Date();
    since.setDate(since.getDate() - days);

    const baseMatch: any = {
      timestamp: { $gte: since },
    };

    if (
      req.user?.role !== "developer" &&
      req.user?.role !== "admin" &&
      req.user?.role !== "super_admin"
    ) {
      baseMatch.userId = userId;
    }

    const timeFormat = days <= 1 ? "%Y-%m-%dT%H:00:00Z" : "%Y-%m-%d";

    const [
      endpointStats,
      errorStats,
      responseTimeRaw,
      topConsumers,
      timeSeriesRaw,
      methodStats,
      summaryStats,
    ] = await Promise.all([
      ApiLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { endpoint: "$endpoint", method: "$method" },
            count: { $sum: 1 },
            avgResponseTime: { $avg: "$responseTime" },
            errorCount: {
              $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      ApiLog.aggregate([
        {
          $match: {
            ...baseMatch,
            statusCode: { $gte: 400 },
          },
        },
        {
          $group: {
            _id: {
              statusCode: "$statusCode",
              endpoint: "$endpoint",
            },
            count: { $sum: 1 },
            lastError: { $last: "$error" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      ApiLog.find(
        { ...baseMatch, responseTime: { $exists: true } },
        { responseTime: 1, _id: 0 },
      )
        .lean()
        .then((docs) => docs.map((d: any) => d.responseTime)),

      ApiLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              ip: "$ip",
              apiKeyName: "$apiKeyName",
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: "$responseTime" },
            endpoints: { $addToSet: "$endpoint" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      ApiLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: timeFormat, date: "$timestamp" },
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: "$responseTime" },
            errorCount: {
              $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      ApiLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: "$method",
            count: { $sum: 1 },
            avgResponseTime: { $avg: "$responseTime" },
          },
        },
      ]),

      ApiLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $lt: ["$statusCode", 400] }, 1, 0] },
            },
            error4xx: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$statusCode", 400] },
                      { $lt: ["$statusCode", 500] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            error5xx: {
              $sum: {
                $cond: [{ $gte: ["$statusCode", 500] }, 1, 0],
              },
            },
            avgResponseTime: { $avg: "$responseTime" },
            minResponseTime: { $min: "$responseTime" },
            maxResponseTime: { $max: "$responseTime" },
          },
        },
      ]),
    ]);

    const summary = summaryStats[0] || {
      totalRequests: 0,
      successCount: 0,
      error4xx: 0,
      error5xx: 0,
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
    };

    const responseTimes: number[] = (responseTimeRaw as number[]) || [];
    responseTimes.sort((a, b) => a - b);
    const percentile = (p: number) => {
      if (responseTimes.length === 0) return 0;
      const idx = Math.ceil((p / 100) * responseTimes.length) - 1;
      return responseTimes[Math.max(0, idx)];
    };

    const responseTimeStats = {
      avg: Math.round(summary.avgResponseTime || 0),
      min: Math.round(summary.minResponseTime || 0),
      max: Math.round(summary.maxResponseTime || 0),
      p50: Math.round(percentile(50)),
      p95: Math.round(percentile(95)),
      p99: Math.round(percentile(99)),
    };

    res.json({
      summary: {
        totalRequests: summary.totalRequests,
        successCount: summary.successCount,
        error4xx: summary.error4xx,
        error5xx: summary.error5xx,
        avgResponseTime: Math.round(summary.avgResponseTime),
      },
      endpointStats: endpointStats.map((s) => ({
        endpoint: s._id.endpoint,
        method: s._id.method,
        count: s.count,
        avgResponseTime: Math.round(s.avgResponseTime),
        errorCount: s.errorCount,
      })),
      errorStats: errorStats.map((e) => ({
        statusCode: e._id.statusCode,
        endpoint: e._id.endpoint,
        count: e.count,
        lastError: e.lastError,
      })),
      responseTime: responseTimeStats,
      topConsumers: topConsumers.map((c) => ({
        ip: c._id.ip,
        apiKeyName: c._id.apiKeyName || null,
        count: c.count,
        avgResponseTime: Math.round(c.avgResponseTime),
        uniqueEndpoints: c.endpoints.length,
      })),
      timeSeries: timeSeriesRaw.map((t) => ({
        time: t._id,
        count: t.count,
        avgResponseTime: Math.round(t.avgResponseTime),
        errorCount: t.errorCount,
      })),
      methodStats: methodStats.map((m) => ({
        method: m._id,
        count: m.count,
        avgResponseTime: Math.round(m.avgResponseTime),
      })),
    });
  } catch (error) {
    console.error("Error getting log analytics:", error);
    res.status(500).json({ error: "خطا در دریافت آنالیتیکس" });
  }
};

// ==================== پاک کردن لاگ‌ها ====================
export const clearLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "کاربر یافت نشد" });

    const beforeDays = parseInt(req.query.beforeDays as string) || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - beforeDays);

    const query: any = { timestamp: { $lt: cutoff } };

    if (
      req.user?.role !== "developer" &&
      req.user?.role !== "admin" &&
      req.user?.role !== "super_admin"
    ) {
      query.userId = userId;
    }

    const result = await ApiLog.deleteMany(query);

    // Audit log
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.SYSTEM,
      resource: "ApiLog",
      description: `${req.user?.firstName || req.user?.phone || "کاربر"} ${result.deletedCount} لاگ قدیمی API (قبل از ${beforeDays} روز) را پاک کرد.`,
      metadata: { deletedCount: result.deletedCount, beforeDays },
      req,
    });

    res.json({
      message: `${result.deletedCount} لاگ قدیمی پاک شد`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing logs:", error);
    res.status(500).json({ error: "خطا در پاک کردن لاگ‌ها" });
  }
};
