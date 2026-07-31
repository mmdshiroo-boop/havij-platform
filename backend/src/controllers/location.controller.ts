//location.controller.ts
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UserLocation } from "../models/UserLocation.model";
import { Province, City } from "../models/Location.model";
import { User } from "../models/User.model";
import axios from "axios";
import * as XLSX from "xlsx";

/**
 * دریافت آدرس متنی بر اساس مختصات جغرافیایی
 */
async function reverseGeocodeHelper(lat: number, lng: number) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fa`,
      {
        headers: { "User-Agent": "DivarCloneLocationApp/1.0" },
        timeout: 4000,
      }
    );

    const address = response.data?.address;
    if (!address) {
      return { province: "", city: "", district: "" };
    }

    const province = address.state || address.province || address.region || "";
    const city =
      address.city || address.town || address.suburb || address.county || "";
    const district =
      address.neighbourhood ||
      address.suburb ||
      address.road ||
      address.quarter ||
      address.residential ||
      "مرکز شهر";

    return { province, city, district };
  } catch (error) {
    console.error("⚠️ Error in Reverse Geocoding:", (error as Error).message);
    return { province: "", city: "", district: "" };
  }
}

// ====== بروزرسانی و ثبت نهایی موقعیت کاربر (برای نمایش روی نقشه ادمین) ======
export const updateMyLocation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "کاربر احراز هویت نشده است" });
    }

    let { lat, lng, accuracy, province, city, district } = req.body;

    // ۱. اگر کاربر لوکیشن GPS را بلاک کرده باشد (lat و lng ارسال نشده باشند)
    if (lat === undefined || lng === undefined || lat === null || lng === null) {
      const ip = req.ip || req.socket.remoteAddress || "";
      const cleanIp = ip.includes(":") ? ip.split(":").pop() : ip;

      try {
        // استخراج موقعیت هوشمند بر اساس IP
        const geoRes = await axios.get(
          `http://ip-api.com/json/${cleanIp}?fields=status,lat,lon,regionName,city,district`
        );
        
        if (geoRes.data && geoRes.data.status === "success") {
          lat = geoRes.data.lat;
          lng = geoRes.data.lon;
          province = province || geoRes.data.regionName || "خوزستان";
          city = city || geoRes.data.city || "اهواز";
          district = district || geoRes.data.district || "مرکز";
        }
      } catch (ipError) {
        console.error("⚠️ خطا در دریافت موقعیت از IP:", ipError);
      }
    }

    // ۲. اگر هنوز مختصات خالی بود، مختصات پیش‌فرض اهواز قرار می‌گیرد
    if (lat === undefined || lng === undefined) {
      lat = 31.3183; // عرض جغرافیایی اهواز
      lng = 48.6706; // طول جغرافیایی اهواز
    }

    // ۳. تکمیل نام استان، شهر و محله در صورت نیاز
    let finalProvince = province;
    let finalCity = city;
    let finalDistrict = district;

    if (!finalDistrict || !finalCity || !finalProvince) {
      const geoInfo = await reverseGeocodeHelper(Number(lat), Number(lng));
      if (!finalProvince) finalProvince = geoInfo.province || "خوزستان";
      if (!finalCity) finalCity = geoInfo.city || "اهواز";
      if (!finalDistrict) finalDistrict = geoInfo.district || "مرکز";
    }

    // ۴. ذخیره در دیتابیس UserLocation جهت استفاده نقشه ادمین
    const updatedLocation = await UserLocation.findOneAndUpdate(
      { userId },
      {
        userId,
        location: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)], // GEOJSON format [lng, lat]
        },
        city: finalCity,
        province: finalProvince,
        district: finalDistrict,
        accuracy: accuracy || 0,
        isOnline: true,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "موقعیت مکانی شما با موفقیت ثبت شد",
      data: updatedLocation,
    });
  } catch (error) {
    console.error("❌ Error in updateMyLocation:", error);
    return res
      .status(500)
      .json({ success: false, message: "خطا در ثبت موقعیت مکانی" });
  }
};

// ====== ۱. تشخیص موقعیت از IP ======
export const getLocationFromIP = async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "";
    if (!ip || ip === "127.0.0.1" || ip === "::1") {
      return res.json({
        success: true,
        data: { province: "تهران", city: "تهران", district: "مرکز" },
      });
    }

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=regionName,city,district`,
    );
    const geo = await response.json();

    res.json({
      success: true,
      data: {
        province: geo.regionName || "",
        city: geo.city || "",
        district: geo.district || "",
      },
    });
  } catch (error) {
    console.error("GeoIP error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت موقعیت" });
  }
};

// ====== ۲. ریورس ژئوکد (نشان / Nominatim) ======
export const reverseGeocodeNominatim = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "پارامترهای lat و lng الزامی هستند",
      });
    }

    const result = await reverseGeocodeHelper(Number(lat), Number(lng));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Geocode error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت موقعیت" });
  }
};

// ====== ۳. دریافت استان‌ها ======
export const getProvinces = async (_req: Request, res: Response) => {
  try {
    const provinces = await Province.find({ isActive: true } as any).sort({
      order: 1,
    });
    res.json({ success: true, data: provinces });
  } catch (error) {
    console.error("Error fetching provinces:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت استان‌ها" });
  }
};

// ====== ۴. دریافت شهرهای استان ======
export const getCitiesByProvince = async (req: Request, res: Response) => {
  try {
    const provinceId = String(req.params.provinceId);
    const cities = await City.find({ provinceId, isActive: true } as any).sort({
      order: 1,
    });
    res.json({ success: true, data: cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت شهرها" });
  }
};

// ====== ۵. دریافت استان با Slug ======
export const getProvinceBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const province = await Province.findOne({ slug, isActive: true } as any);
    if (!province) {
      return res
        .status(404)
        .json({ success: false, message: "استان یافت نشد" });
    }
    res.json({ success: true, data: province });
  } catch (error) {
    console.error("Error fetching province by slug:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت استان" });
  }
};


// ====== ۷. آفلاین کردن کاربر ======
export const setUserOffline = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    await UserLocation.findOneAndUpdate({ userId }, { isOnline: false });
    return res.status(200).json({ success: true, message: "کاربر آفلاین شد" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "خطا در تغییر وضعیت" });
  }
};

// ====== ۸. آمار نقشه (پنل ادمین) ======
export const getLocationStats = async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const total = await UserLocation.countDocuments();
    const totalWithLocation = total;
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
        totalWithLocation,
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
      .json({ success: false, message: "خطا در دریافت آمار" });
  }
};

// ====== ۹. لیست کاربران روی نقشه (پنل ادمین) ======
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
      .json({ success: false, message: "خطا در دریافت لیست" });
  }
};

// ====== ۱۰. خروجی اکسل (پنل ادمین) ======
export const exportLocationsExcel = async (req: AuthRequest, res: Response) => {
  try {
    const rawLocations = await UserLocation.find()
      .populate({ path: "userId", select: "firstName lastName phone role" })
      .lean();

    const excelData = rawLocations.map((item: any, index: number) => {
      const userObj = item.userId || {};
      const coords = item.location?.coordinates || [0, 0];
      return {
        ردیف: index + 1,
        "نام و نام خانوادگی":
          `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() ||
          "ناشناس",
        تلفن: userObj.phone || "-",
        استان: item.province || "-",
        شهر: item.city || "-",
        محله: item.district || "-",
        "عرض جغرافیایی": coords[1],
        "طول جغرافیایی": coords[0],
        وضعیت: item.isOnline ? "آنلاین" : "آفلاین",
        "آخرین بازدید": new Date(item.lastSeenAt).toLocaleString("fa-IR"),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Locations");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=users-locations.xlsx",
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    return res.send(excelBuffer);
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ success: false, message: "خطا در تولید فایل اکسل" });
  }
};


export const updateLocationFromSearch = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id; // اگر کاربر لاگین باشد
    const guestId = req.body.guestId || req.headers["x-guest-id"]; // اگر میهمان باشد
    
    let { lat, lng, province, city, district } = req.body;

    // استخراج IP واقعی کاربر
    const rawIp = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "";
    const cleanIp = rawIp.includes(":") ? rawIp.split(":").pop() : rawIp;

    const isLocalIp = !cleanIp || cleanIp === "127.0.0.1" || cleanIp === "1" || cleanIp === "localhost";

    // ۱. اگر کاربر لوکیشن GPS نداده بود
    if ((!lat || !lng) && !isLocalIp) {
      try {
        const geoRes = await axios.get(
          `http://ip-api.com/json/${cleanIp}?fields=status,lat,lon,regionName,city`
        );
        if (geoRes.data && geoRes.data.status === "success") {
          lat = geoRes.data.lat;
          lng = geoRes.data.lon;
          province = province || geoRes.data.regionName;
          city = city || geoRes.data.city;
        }
      } catch (e) {
        console.error("خطا در استعلام IP-API:", (e as Error).message);
      }
    }

    // ۲. اگر هنوز مختصاتی ثبت نشده باشد (محیط لوکال یا عدم پاسخ‌دهی IP-API)
    if (!lat || !lng) {
      lat = 31.3183; // پیش‌فرض اهواز
      lng = 48.6706;
      province = province || "خوزستان";
      city = city || "اهواز";
    }

    const isGuest = !userId;
    const effectiveGuestId = guestId || `guest_${cleanIp || "local"}`;
    const query = userId ? { userId } : { guestId: effectiveGuestId };

    // ۳. ذخیره یا آپدیت در دیتابیس
    const updated = await UserLocation.findOneAndUpdate(
      query,
      {
        userId: userId || null,
        guestId: isGuest ? effectiveGuestId : null,
        isGuest,
        ip: cleanIp,
        location: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        province: province || "",
        city: city || "",
        district: district || "",
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "موقعیت با موفقیت ثبت شد",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error in updateLocationFromSearch:", error);
    return res.status(500).json({ success: false, message: "خطای سرور در ثبت موقعیت" });
  }
};

// دریافت تمام موقعیت‌ها تفکیک‌شده برای ادمین
export const getAdminLocationMapData = async (req: Request, res: Response) => {
  try {
    // لیست کاربران ثبت‌نام‌شده همراه با مشخصات کاربر
    const registeredUsers = await UserLocation.find({ isGuest: false })
      .populate("userId", "name phoneNumber email avatar")
      .sort({ lastSeenAt: -1 })
      .lean();

    // لیست کاربران میهمان (ثبت‌نام نشده)
    const guestUsers = await UserLocation.find({ isGuest: true })
      .sort({ lastSeenAt: -1 })
      .limit(200) // محدودیت برای بهینه‌سازی
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        registeredUsers,
        guestUsers,
      },
    });
  } catch (error) {
    console.error("❌ Error in getAdminLocationMapData:", error);
    return res.status(500).json({ success: false, message: "خطا در دریافت لیست موقعیت‌ها" });
  }
};