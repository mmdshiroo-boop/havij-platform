// backend/src/controllers/locationMap.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UserLocation } from "../models/UserLocation.model";
import { User } from "../models/User.model";
import ExcelJS from "exceljs";
import { getIO } from "../socket"; // اصلاح: استفاده از getIO

// ====== ۱. آمار نقشه (پنل ادمین) ======
export const getLocationStats = async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const total = await UserLocation.countDocuments();
    const onlineNow = await UserLocation.countDocuments({
      isOnline: true,
      lastSeenAt: { $gte: fiveMinutesAgo },
    });
    const onlineLast5min = await UserLocation.countDocuments({
      lastSeenAt: { $gte: fiveMinutesAgo },
    });
    const onlineLastHour = await UserLocation.countDocuments({
      lastSeenAt: { $gte: oneHourAgo },
    });
    const onlineToday = await UserLocation.countDocuments({
      lastSeenAt: { $gte: todayStart },
    });

    const topCities = await UserLocation.aggregate([
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        totalWithLocation: total,
        onlineNow,
        onlineLast5min,
        onlineLastHour,
        onlineToday,
        topCities,
      },
    });
  } catch (error) {
    console.error("❌ Error in getLocationStats:", error);
    return res
      .status(500)
      .json({ success: false, message: "خطا در دریافت آمار نقشه" });
  }
};

// ====== ۲. لیست کاربران روی نقشه (پنل ادمین) ======
export const getUsersLocations = async (req: AuthRequest, res: Response) => {
  try {
    const { search, online, timeframe, province, city } = req.query;
    const queryFilter: any = {};

    if (timeframe === "1h") {
      queryFilter.lastSeenAt = { $gte: new Date(Date.now() - 60 * 60 * 1000) };
    } else if (timeframe === "5m") {
      queryFilter.lastSeenAt = { $gte: new Date(Date.now() - 5 * 60 * 1000) };
    } else if (timeframe === "24h") {
      queryFilter.lastSeenAt = {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
    }

    if (online === "true") queryFilter.isOnline = true;
    if (online === "false") queryFilter.isOnline = false;

    if (province && province !== "all") queryFilter.province = province;
    if (city && city !== "all") queryFilter.city = city;

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedUsers = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { phone: searchRegex },
        ],
      }).select("_id");

      const userMatchIds = matchedUsers.map((u) => u._id);
      queryFilter.$or = [
        { userId: { $in: userMatchIds } },
        { city: searchRegex },
        { province: searchRegex },
        { district: searchRegex },
      ];
    }

    const rawLocations = await UserLocation.find(queryFilter)
      .populate({
        path: "userId",
        select: "firstName lastName phone role avatar isActive isBanned email",
      })
      .sort({ lastSeenAt: -1 })
      .lean();

    const formattedLocations = rawLocations.map((loc: any) => {
      const coords = loc.location?.coordinates || [0, 0];
      const lng = coords[0] || 0;
      const lat = coords[1] || 0;
      const userObj =
        typeof loc.userId === "object" && loc.userId !== null ? loc.userId : {};

      return {
        _id: loc._id,
        userId: userObj,
        location: { type: "Point", coordinates: [lng, lat] },
        lat,
        lng,
        city: loc.city || "نامشخص",
        province: loc.province || "نامشخص",
        district: loc.district || "نامشخص",
        accuracy: loc.accuracy || 0,
        isOnline: Boolean(loc.isOnline),
        lastSeenAt: loc.lastSeenAt || loc.updatedAt || new Date(),
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedLocations,
      pagination: {
        page: 1,
        limit: formattedLocations.length,
        total: formattedLocations.length,
        pages: 1,
      },
    });
  } catch (error) {
    console.error("❌ Error in getUsersLocations:", error);
    return res
      .status(500)
      .json({ success: false, message: "خطا در دریافت لیست موقعیت‌ها" });
  }
};

// ====== ۳. خروجی اکسل حرفه‌ای (پنل ادمین) ======
export const exportLocationsExcel = async (req: AuthRequest, res: Response) => {
  try {
    const rawLocations = await UserLocation.find()
      .populate({ path: "userId", select: "firstName lastName phone role email" })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("موقعیت کاربران", {
      views: [{ rightToLeft: true, showGridLines: false }],
    });

    worksheet.properties.defaultRowHeight = 28;

    const titleRow = worksheet.addRow(["📊 گزارش موقعیت مکانی کاربران"]);
    titleRow.height = 45;
    worksheet.mergeCells(`A${titleRow.number}:J${titleRow.number}`);
    const titleCell = worksheet.getCell(`A${titleRow.number}`);
    titleCell.font = {
      name: "Vazirmatn",
      size: 20,
      bold: true,
      color: { argb: "FFEA580C" },
    };
    titleCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    const dateRow = worksheet.addRow([
      `تاریخ تهیه: ${new Date().toLocaleDateString("fa-IR")} | تعداد کل: ${rawLocations.length} کاربر`,
    ]);
    dateRow.height = 30;
    worksheet.mergeCells(`A${dateRow.number}:J${dateRow.number}`);
    const dateCell = worksheet.getCell(`A${dateRow.number}`);
    dateCell.font = {
      name: "Vazirmatn",
      size: 13,
      color: { argb: "FF6B7280" },
    };
    dateCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    const headers = [
      "ردیف",
      "نام و نام خانوادگی",
      "شماره تماس",
      "ایمیل",
      "استان",
      "شهر",
      "محله",
      "عرض جغرافیایی",
      "طول جغرافیایی",
      "وضعیت",
      "آخرین بازدید",
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 35;

    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Vazirmatn",
        size: 14,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEA580C" },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FFD1D5DB" } },
        bottom: { style: "medium", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
    });

    rawLocations.forEach((item: any, index: number) => {
      const userObj = item.userId || {};
      const coords = item.location?.coordinates || [0, 0];
      const rowData = [
        index + 1,
        `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || "ناشناس",
        userObj.phone || "-",
        userObj.email || "-",
        item.province || "نامشخص",
        item.city || "نامشخص",
        item.district || "نامشخص",
        coords[1]?.toFixed(6) || "۰",
        coords[0]?.toFixed(6) || "۰",
        item.isOnline ? "آنلاین" : "آفلاین",
        item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString("fa-IR") : "-",
      ];

      const row = worksheet.addRow(rowData);
      row.height = 28;

      row.eachCell((cell, colNumber) => {
        cell.font = {
          name: "Vazirmatn",
          size: 12,
          color: { argb: "FF1F2937" },
        };
        cell.alignment = {
          horizontal: "right",
          vertical: "middle",
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };

        if (colNumber === 8 || colNumber === 9) {
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
          };
          cell.font = {
            name: "Vazirmatn",
            size: 12,
            color: { argb: "FF3B82F6" },
          };
        }

        if (colNumber === 10) {
          const status = cell.value;
          if (status === "آنلاین") {
            cell.font = {
              name: "Vazirmatn",
              size: 12,
              bold: true,
              color: { argb: "FF10B981" },
            };
          } else {
            cell.font = {
              name: "Vazirmatn",
              size: 12,
              bold: true,
              color: { argb: "FFEF4444" },
            };
          }
        }
      });
    });

    worksheet.columns = [
      { header: "ردیف", key: "row", width: 10 },
      { header: "نام و نام خانوادگی", key: "fullName", width: 30 },
      { header: "شماره تماس", key: "phone", width: 20 },
      { header: "ایمیل", key: "email", width: 25 },
      { header: "استان", key: "province", width: 20 },
      { header: "شهر", key: "city", width: 20 },
      { header: "محله", key: "district", width: 22 },
      { header: "عرض جغرافیایی", key: "lat", width: 18 },
      { header: "طول جغرافیایی", key: "lng", width: 18 },
      { header: "وضعیت", key: "status", width: 14 },
      { header: "آخرین بازدید", key: "lastSeen", width: 28 },
    ];

    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: 11 },
    };

    const buffer = await workbook.xlsx.writeBuffer();

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = encodeURIComponent(`کاربران-موقعیت-${dateStr}.xlsx`);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    return res.send(buffer);
  } catch (error) {
    console.error("❌ Excel export error:", error);
    return res.status(500).json({
      success: false,
      message: "خطا در تولید فایل اکسل",
    });
  }
};