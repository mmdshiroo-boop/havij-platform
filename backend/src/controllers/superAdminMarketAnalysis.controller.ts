// backend/src/controllers/superAdminMarketAnalysis.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Ad } from "../models/Ad.model";
import { Property } from "../models/Property.model";
import { MarketAnalysis } from "../models/MarketAnalysis.model";
import { Province } from "../models/Province.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

const getAd = () => mongoose.model("Ad");
// ─── تابع کمکی برای تبدیل query به string ───
function getQueryStr(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return String(value[0] || "");
  return "";
}
// ── نگاشت استان → شهرها ─────────────────
const PROVINCE_CITIES_MAP: Record<string, string[]> = {
  تهران: [
    "تهران",
    "شهریار",
    "اسلامشهر",
    "قدس",
    "ملارد",
    "ورامین",
    "ری",
    "دماوند",
    "پردیس",
    "اندیشه",
  ],
  مازندران: [
    "ساری",
    "بابل",
    "آمل",
    "قائم‌شهر",
    "بابلسر",
    "چالوس",
    "نور",
    "نوشهر",
    "تنکابن",
    "رامسر",
  ],
  اصفهان: [
    "اصفهان",
    "کاشان",
    "خمینی‌شهر",
    "شاهین‌شهر",
    "نجف‌آباد",
    "مبارکه",
    "فولادشهر",
    "زرین‌شهر",
  ],
  "خراسان رضوی": [
    "مشهد",
    "نیشابور",
    "سبزوار",
    "قوچان",
    "تربت حیدریه",
    "کاشمر",
    "گناباد",
    "درگز",
  ],
  فارس: [
    "شیراز",
    "مرودشت",
    "کازرون",
    "لار",
    "جهرم",
    "فیروزآباد",
    "آباده",
    "داراب",
  ],
  البرز: ["کرج", "نظرآباد", "هشتگرد", "طالقان", "فردیس", "مهرشهر"],
  "آذربایجان شرقی": [
    "تبریز",
    "مراغه",
    "مرند",
    "میانه",
    "اهر",
    "بناب",
    "سراب",
    "هریس",
  ],
  گیلان: [
    "رشت",
    "انزلی",
    "لاهیجان",
    "آستارا",
    "تالش",
    "رودسر",
    "فومن",
    "صومعه سرا",
  ],
  خوزستان: [
    "اهواز",
    "آبادان",
    "خرمشهر",
    "دزفول",
    "اندیمشک",
    "بهبهان",
    "مسجدسلیمان",
    "شوش",
  ],
  هرمزگان: [
    "بندرعباس",
    "کیش",
    "قشم",
    "میناب",
    "بندر لنگه",
    "بستک",
    "حاجی آباد",
  ],
  "آذربایجان غربی": [
    "ارومیه",
    "خوی",
    "میاندوآب",
    "بوکان",
    "مهاباد",
    "سلماس",
    "پیرانشهر",
    "نقده",
  ],
  اردبیل: ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی", "بیله‌سوار"],
  بوشهر: ["بوشهر", "برازجان", "گناوه", "کنگان", "خورموج", "جم"],
  "چهارمحال و بختیاری": ["شهرکرد", "بروجن", "لردگان", "فارسان", "اردل"],
  "خراسان جنوبی": ["بیرجند", "قائن", "طبس", "فردوس", "بشرویه"],
  "خراسان شمالی": ["بجنورد", "شیروان", "اسفراین", "آشخانه", "فاروج"],
  زنجان: ["زنجان", "ابهر", "خرمدره", "قیدار", "ماهنشان"],
  سمنان: ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر"],
  "سیستان و بلوچستان": [
    "زاهدان",
    "زابل",
    "چابهار",
    "کنارک",
    "ایرانشهر",
    "خاش",
    "سراوان",
  ],
  قزوین: ["قزوین", "الوند", "تاکستان", "آبیک", "بوئین‌زهرا"],
  قم: ["قم", "جعفریه", "کهک", "دستجرد"],
  کردستان: ["سنندج", "سقز", "مریوان", "بانه", "کامیاران", "قروه", "بیجار"],
  کرمان: ["کرمان", "رفسنجان", "سیرجان", "جیرفت", "بم", "زرند", "کهنوج"],
  کرمانشاه: [
    "کرمانشاه",
    "اسلام‌آباد غرب",
    "کنگاور",
    "هرسین",
    "صحنه",
    "سرپل ذهاب",
    "پاوه",
  ],
  "کهگیلویه و بویراحمد": ["یاسوج", "دهدشت", "گچساران", "لیکک", "سی‌سخت"],
  گلستان: [
    "گرگان",
    "گنبد کاووس",
    "علی‌آباد کتول",
    "آق‌قلا",
    "بندر ترکمن",
    "کردکوی",
  ],
  لرستان: ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "الیگودرز", "ازنا"],
  مرکزی: ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "کمیجان"],
  همدان: ["همدان", "ملایر", "نهاوند", "تویسرکان", "کبودرآهنگ", "اسدآباد"],
  یزد: ["یزد", "میبد", "اردکان", "بافق", "تفت", "ابرکوه"],
};

function getCitiesForProvince(provinceName: string): string[] {
  if (PROVINCE_CITIES_MAP[provinceName])
    return PROVINCE_CITIES_MAP[provinceName];
  for (const key of Object.keys(PROVINCE_CITIES_MAP)) {
    if (key.includes(provinceName) || provinceName.includes(key)) {
      return PROVINCE_CITIES_MAP[key];
    }
  }
  return [provinceName];
}

// ─── توابع اصلی (بدون تغییر در منطق، فقط افزودن لاگ به موارد خاص) ───

export const getAllAdsForMap = async (req: Request, res: Response) => {
  try {
    // تبدیل ایمن query parameters
    const status = String(req.query.status || "");
    const city = String(req.query.city || "");
    const province = String(req.query.province || "");
    const limit = String(req.query.limit || "500");

    const adFilter: any = {};
    const propertyFilter: any = {};

    if (status && status !== "all") {
      adFilter.status = status;
      propertyFilter.status = status;
    }
    if (city) {
      adFilter.city = { $regex: city, $options: "i" };
      propertyFilter.city = { $regex: city, $options: "i" };
    }
    if (province && province !== "همه" && province !== "") {
      const cities = getCitiesForProvince(province);
      adFilter.city = { $in: cities };
      propertyFilter.city = { $in: cities };
    }

    // ✅ اصلاح: استفاده از $nin به‌جای $ne تکراری
    adFilter.latitude = { $exists: true, $nin: [null, 0] };
    adFilter.longitude = { $exists: true, $nin: [null, 0] };
    propertyFilter["location.coordinates"] = { $exists: true, $ne: [] };

    const [ads, properties] = await Promise.all([
      Ad.find(adFilter)
        .select(
          "title price city district latitude longitude status adType area rooms images views createdAt isVip isUrgent source userId",
        )
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean(),
      Property.find(propertyFilter)
        .select(
          "title price city district location status priceType area rooms images views createdAt agentId isScraped",
        )
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean(),
    ]);

    const formattedAds = ads.map((ad: any) => ({
      id: ad._id,
      title: ad.title,
      price: ad.price,
      city: ad.city,
      district: ad.district,
      category: ad.categoryName || "عمومی",
      status: ad.status,
      adType: ad.adType || "sale",
      area: ad.area,
      rooms: ad.rooms,
      images: ad.images?.[0] || null,
      latitude: ad.latitude,
      longitude: ad.longitude,
      views: ad.views || 0,
      createdAt: ad.createdAt,
      isVip: ad.isVip || false,
      isUrgent: ad.isUrgent || false,
      source: ad.source || "manual",
    }));

    const formattedProperties = properties.map((prop: any) => ({
      id: prop._id,
      title: prop.title,
      price: prop.price,
      city: prop.city,
      district: prop.district,
      category: prop.propertyType || "property",
      status: prop.status,
      adType: prop.priceType || "sale",
      area: prop.area,
      rooms: prop.rooms,
      images: prop.images?.[0] || null,
      latitude: prop.location?.coordinates?.[1],
      longitude: prop.location?.coordinates?.[0],
      views: prop.views || 0,
      createdAt: prop.createdAt,
      isVip: false,
      isUrgent: false,
      source: prop.isScraped ? "scraper" : "manual",
    }));

    res.json({
      success: true,
      data: [...formattedAds, ...formattedProperties],
      total: formattedAds.length + formattedProperties.length,
    });
  } catch (error) {
    console.error("Error in getAllAdsForMap:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت داده‌های نقشه" });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalAds,
      activeAds,
      pendingAds,
      soldAds,
      rejectedAds,
      expiredAds,
      totalProperties,
      activeProperties,
      pendingProperties,
      soldProperties,
      rejectedProperties,
      adViewsResult,
      propertyViewsResult,
    ] = await Promise.all([
      Ad.countDocuments(),
      Ad.countDocuments({ status: "active" }),
      Ad.countDocuments({ status: "pending" }),
      Ad.countDocuments({ status: "sold" }),
      Ad.countDocuments({ status: "rejected" }),
      Ad.countDocuments({ status: "expired" }),
      Property.countDocuments(),
      Property.countDocuments({ status: "active" }),
      Property.countDocuments({ status: "pending" }),
      Property.countDocuments({ status: "sold" }),
      Property.countDocuments({ status: "rejected" }),
      Ad.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
      Property.aggregate([
        { $group: { _id: null, total: { $sum: "$views" } } },
      ]),
    ]);

    const totalViews =
      (adViewsResult[0]?.total || 0) + (propertyViewsResult[0]?.total || 0);
    const avgPriceResult = await Ad.aggregate([
      { $match: { status: "active", price: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$price" } } },
    ]);
    const avgPrice = Math.round(avgPriceResult[0]?.avg || 0);

    res.json({
      success: true,
      data: {
        kpi: {
          totalAds: totalAds + totalProperties,
          activeAds: activeAds + activeProperties,
          pendingAds: pendingAds + pendingProperties,
          soldAds: soldAds + soldProperties,
          rejectedAds: rejectedAds + rejectedProperties,
          expiredAds,
          avgPrice,
          totalViews,
        },
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت آمار" });
  }
};

export const getProvinceMapStats = async (req: Request, res: Response) => {
  try {
    const provinces = await Province.find({ isActive: true }).sort({ code: 1 });
    const stats = await Promise.all(
      provinces.map(async (province) => {
        const adCount = await Ad.countDocuments({
          $or: [
            { province: { $regex: province.name, $options: "i" } },
            { city: { $regex: province.name, $options: "i" } },
          ],
          status: "active",
        });
        const propertyCount = await Property.countDocuments({
          city: { $regex: province.name, $options: "i" },
          status: "active",
        });
        const marketData = await MarketAnalysis.findOne({
          provinceId: province.slug,
        });
        return {
          id: province.slug,
          name: province.name,
          code: province.code,
          totalAds: adCount + propertyCount,
          avgPrice: marketData?.avgPrice || 0,
          growth: marketData?.growth || 0,
          color: province.color,
        };
      }),
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error in getProvinceMapStats:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت آمار استانی" });
  }
};

// bulkUpdateStatus – تغییر وضعیت گروهی (با لاگ)
export const bulkUpdateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { adIds, newStatus, reason } = req.body;
    if (!newStatus || !adIds || !Array.isArray(adIds) || adIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "اطلاعات نامعتبر است" });
    }
    const updateData: any = { status: newStatus };
    if (newStatus === "rejected")
      updateData.rejectReason = reason || "رد شده توسط سوپر ادمین";

    const result = await Ad.updateMany({ _id: { $in: adIds } }, updateData);

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.AD_STATUS_CHANGED,
      resource: "Ad",
      resourceId: adIds.join(","),
      description: `سوپرادمین ${req.user?.firstName || req.user?.phone} وضعیت ${result.modifiedCount} آگهی را به "${newStatus}" تغییر داد.`,
      metadata: { adIds, newStatus, reason },
      req,
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} آگهی با موفقیت بروزرسانی شد`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in bulkUpdateStatus:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در تغییر وضعیت گروهی" });
  }
};

// exportAdsData – خروجی داده‌ها (با لاگ)
export const exportAdsData = async (req: AuthRequest, res: Response) => {
  try {
    const { status, city } = req.body;
    const format = (req.query.format as string) || "json";
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (city) filter.city = { $regex: city, $options: "i" };

    const ads = await Ad.find(filter)
      .select("title price city status adType area views createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Ad",
      description: `سوپرادمین ${req.user?.firstName || req.user?.phone} از ${ads.length} آگهی با فرمت ${format} خروجی گرفت.`,
      metadata: { filter, format, count: ads.length },
      req,
    });

    if (format === "csv") {
      const header = "عنوان,قیمت,شهر,وضعیت,نوع,متراژ,بازدید,تاریخ\n";
      const rows = ads
        .map(
          (ad: any) =>
            `"${ad.title || ""}","${ad.price || 0}","${ad.city || ""}","${ad.status || ""}","${ad.adType || ""}","${ad.area || 0}","${ad.views || 0}","${ad.createdAt || ""}"`,
        )
        .join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=ads-${Date.now()}.csv`,
      );
      return res.send("\uFEFF" + header + rows);
    }

    res.json({ success: true, data: ads, total: ads.length });
  } catch (error) {
    console.error("Error in exportAdsData:", error);
    res.status(500).json({ success: false, message: "خطا در export داده‌ها" });
  }
};

export const advancedSearch = async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      city,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "20",
    } = req.query;
    const filter: any = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search as string, $options: "i" } },
        { description: { $regex: search as string, $options: "i" } },
      ];
    }
    if (status && status !== "all") filter.status = status;
    if (city) filter.city = { $regex: city as string, $options: "i" };
    const sort: any = { [sortBy as string]: sortOrder === "desc" ? -1 : 1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [ads, total] = await Promise.all([
      Ad.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select("title price city status adType area views createdAt")
        .lean(),
      Ad.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: ads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error in advancedSearch:", error);
    res.status(500).json({ success: false, message: "خطا در جستجو" });
  }
};

export const getProvincesList = async (_req: Request, res: Response) => {
  try {
    const provinces = await Province.find({ isActive: true })
      .select("name slug code -_id")
      .sort({ code: 1 })
      .lean();
    res.json({ success: true, data: provinces });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در دریافت استان‌ها" });
  }
};

export const getCitiesByProvince = async (req: Request, res: Response) => {
  try {
    const { provinceSlug } = req.params;
    const province = await Province.findOne({
      slug: provinceSlug,
      isActive: true,
    });
    if (!province)
      return res
        .status(404)
        .json({ success: false, message: "استان یافت نشد" });
    res.json({ success: true, data: province.cities });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در دریافت شهرها" });
  }
};

// ─── توابع جدید سوپر ادمین (بدون تغییر) ───

// ─── نقشه سوپر ادمین ───
export const getSuperAdminMapAds = async (req: Request, res: Response) => {
  try {
    const Ad = getAd();

    // ✅ تبدیل ایمن
    const city = getQueryStr(req.query.city);
    const district = getQueryStr(req.query.district);
    const province = getQueryStr(req.query.province);
    const tradeType = getQueryStr(req.query.tradeType);
    const propertyType = getQueryStr(req.query.propertyType);
    const priceRange = getQueryStr(req.query.priceRange);
    const sizeRange = getQueryStr(req.query.sizeRange);
    const buildingAge = getQueryStr(req.query.buildingAge);
    const roomsCount = getQueryStr(req.query.roomsCount);
    const region = getQueryStr(req.query.region);

    const query: any = {};
    const andConditions: any[] = [];

    if (province && province !== "همه" && province !== "") {
      const cities = getCitiesForProvince(province);
      andConditions.push({ city: { $in: cities } });
    }

    if (city && city !== "همه" && city !== "undefined") {
      const cityRegex = new RegExp(city, "i");
      andConditions.push({ city: { $regex: cityRegex } });
    }

    if (district && district !== "همه" && district !== "undefined") {
      const districtRegex = new RegExp(district, "i");
      andConditions.push({
        $or: [
          { district: { $regex: districtRegex } },
          { title: { $regex: districtRegex } },
        ],
      });
    }

    if (region && region !== "همه" && region !== "undefined") {
      andConditions.push({ region });
    }

    if (tradeType && tradeType !== "none") {
      const adTypeMap: Record<string, string> = { buy: "sale", rent: "rent" };
      andConditions.push({ adType: adTypeMap[tradeType] || tradeType });
    }

    if (propertyType && propertyType !== "none") {
      let keywordPattern = "";
      switch (propertyType) {
        case "apartment":
          keywordPattern = "(آپارتمان|ساختمان|مجتمع|برج|اپارتمان)";
          break;
        case "villa":
          keywordPattern = "(ویلا|خانه|باغ|کلنگی|خونه)";
          break;
        case "land":
          keywordPattern = "(زمین|اراضی|قطعه)";
          break;
        case "commercial":
          keywordPattern = "(تجاری|اداری|مغازه|دفتر|پاساژ)";
          break;
      }
      if (keywordPattern) {
        const regex = new RegExp(keywordPattern, "i");
        andConditions.push({
          $or: [
            { title: { $regex: regex } },
            { description: { $regex: regex } },
          ],
        });
      }
    }

    if (priceRange && priceRange !== "none") {
      const parts = priceRange.split("-");
      if (parts.length === 2) {
        const min = parseFloat(parts[0]) * 1_000_000_000;
        if (parts[1] === "+") andConditions.push({ price: { $gte: min } });
        else {
          const max = parseFloat(parts[1]) * 1_000_000_000;
          andConditions.push({ price: { $gte: min, $lte: max } });
        }
      }
    }

    if (sizeRange && sizeRange !== "none") {
      const parts = sizeRange.split("-");
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        if (parts[1] === "+") andConditions.push({ area: { $gte: min } });
        else {
          const max = parseFloat(parts[1]);
          andConditions.push({ area: { $gte: min, $lte: max } });
        }
      }
    }

    if (buildingAge && buildingAge !== "none") {
      const parts = buildingAge.split("-");
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        if (parts[1] === "+")
          andConditions.push({ buildingAge: { $gte: min } });
        else {
          const max = parseFloat(parts[1]);
          andConditions.push({ buildingAge: { $gte: min, $lte: max } });
        }
      }
    }

    if (roomsCount && roomsCount !== "none") {
      if (roomsCount === "3") andConditions.push({ roomsCount: { $gte: 3 } });
      else andConditions.push({ roomsCount: parseInt(roomsCount) });
    }

    if (andConditions.length > 0) query.$and = andConditions;

    const ads = await Ad.find(query)
      .select(
        "title price area latitude longitude city district images views adType buildingAge roomsCount region regionName status isVip isUrgent createdAt",
      )
      .sort({ createdAt: -1 })
      .limit(50000)
      .lean();

    let sumLat = 0,
      sumLng = 0,
      valid = 0;
    ads.forEach((ad: any) => {
      const lat = Number(ad.latitude),
        lng = Number(ad.longitude);
      if (lat && lng && !isNaN(lat) && lat !== 0 && !isNaN(lng) && lng !== 0) {
        sumLat += lat;
        sumLng += lng;
        valid++;
      }
    });
    const center =
      valid > 0
        ? { lat: sumLat / valid, lng: sumLng / valid }
        : { lat: 35.6892, lng: 51.389 };

    const markers = ads.map((ad: any) => ({
      id: ad._id.toString(),
      title: ad.title,
      price: ad.price || 0,
      area: ad.area || 0,
      adType: ad.adType || "sale",
      buildingAge: ad.buildingAge || 0,
      roomsCount: ad.roomsCount || 1,
      city: ad.city || "نامشخص",
      district: ad.district?.trim() || "نامشخص",
      region: ad.region || "سایر",
      lat: Number(ad.latitude) || center.lat,
      lng: Number(ad.longitude) || center.lng,
      image: ad.images?.[0] || null,
      views: ad.views || 0,
      status: ad.status || "active",
      isVip: ad.isVip || false,
      isUrgent: ad.isUrgent || false,
      createdAt: ad.createdAt,
      category: ad.category || "property",
    }));

    res.json({
      success: true,
      data: { markers, total: markers.length, center },
    });
  } catch (error: any) {
    console.error("❌ [super-admin/map-ads]", error.message);
    res.status(500).json({ success: false, message: "خطای سرور" });
  }
};

// ─── تابع اصلی تحلیل سوپر ادمین ───
export const getSuperAdminMarketAnalysis = async (
  req: Request,
  res: Response,
) => {
  try {
    const Ad = getAd();

    // ✅ تبدیل امن تمام فیلدهای query
    const city = getQueryStr(req.query.city);
    const district = getQueryStr(req.query.district);
    const province = getQueryStr(req.query.province);
    const tradeType = getQueryStr(req.query.tradeType);
    const propertyType = getQueryStr(req.query.propertyType);
    const priceRange = getQueryStr(req.query.priceRange);
    const sizeRange = getQueryStr(req.query.sizeRange);
    const buildingAge = getQueryStr(req.query.buildingAge);
    const roomsCount = getQueryStr(req.query.roomsCount);

    const matchConditions: any = {};
    const andConditions: any[] = [];

    if (province && province !== "همه" && province !== "") {
      const cities = getCitiesForProvince(province);
      andConditions.push({ city: { $in: cities } });
    }

    if (city && city !== "همه" && city !== "undefined") {
      const cityRegex = new RegExp(city, "i");
      andConditions.push({ city: { $regex: cityRegex } });
    }

    if (district && district !== "همه" && district !== "undefined") {
      const districtRegex = new RegExp(district, "i");
      andConditions.push({
        $or: [
          { district: { $regex: districtRegex } },
          { title: { $regex: districtRegex } },
        ],
      });
    }

    if (tradeType && tradeType !== "none") {
      const adTypeMap: Record<string, string> = { buy: "sale", rent: "rent" };
      andConditions.push({
        adType: adTypeMap[tradeType] || tradeType,
      });
    }

    if (propertyType && propertyType !== "none") {
      let keywordPattern = "";
      switch (propertyType) {
        case "apartment":
          keywordPattern = "(آپارتمان|ساختمان|مجتمع|برج|اپارتمان)";
          break;
        case "villa":
          keywordPattern = "(ویلا|خانه|باغ|کلنگی|خونه)";
          break;
        case "land":
          keywordPattern = "(زمین|اراضی|قطعه)";
          break;
        case "commercial":
          keywordPattern = "(تجاری|اداری|مغازه|دفتر|پاساژ)";
          break;
      }
      if (keywordPattern) {
        const regex = new RegExp(keywordPattern, "i");
        andConditions.push({
          $or: [
            { title: { $regex: regex } },
            { description: { $regex: regex } },
          ],
        });
      }
    }

    if (priceRange && priceRange !== "none") {
      const parts = priceRange.split("-");
      if (parts.length === 2) {
        const min = parseFloat(parts[0]) * 1_000_000_000;
        if (parts[1] === "+") andConditions.push({ price: { $gte: min } });
        else {
          const max = parseFloat(parts[1]) * 1_000_000_000;
          andConditions.push({ price: { $gte: min, $lte: max } });
        }
      }
    }

    if (sizeRange && sizeRange !== "none") {
      const parts = sizeRange.split("-");
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        if (parts[1] === "+") andConditions.push({ area: { $gte: min } });
        else {
          const max = parseFloat(parts[1]);
          andConditions.push({ area: { $gte: min, $lte: max } });
        }
      }
    }

    if (buildingAge && buildingAge !== "none") {
      const parts = buildingAge.split("-");
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        if (parts[1] === "+")
          andConditions.push({ buildingAge: { $gte: min } });
        else {
          const max = parseFloat(parts[1]);
          andConditions.push({ buildingAge: { $gte: min, $lte: max } });
        }
      }
    }

    if (roomsCount && roomsCount !== "none") {
      if (roomsCount === "3") andConditions.push({ roomsCount: { $gte: 3 } });
      else andConditions.push({ roomsCount: parseInt(roomsCount) });
    }

    if (andConditions.length > 0) matchConditions.$and = andConditions;

    // ─── Aggregations ───
    const priceAnalysis = await Ad.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: { $ifNull: ["$district", "سایر مناطق"] },
          totalAds: { $sum: 1 },
          totalPrice: { $sum: { $ifNull: ["$price", 0] } },
          totalViews: { $sum: { $ifNull: ["$views", 0] } },
          priceSumPerMeter: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$area", 0] }, { $gt: ["$price", 0] }] },
                { $divide: ["$price", "$area"] },
                0,
              ],
            },
          },
          areaCount: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$area", 0] }, { $gt: ["$price", 0] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          district: "$_id",
          totalAds: 1,
          avgPricePerMeter: {
            $cond: [
              { $gt: ["$areaCount", 0] },
              { $round: { $divide: ["$priceSumPerMeter", "$areaCount"] } },
              0,
            ],
          },
          avgTotalPrice: {
            $cond: [
              { $gt: ["$totalAds", 0] },
              { $round: { $divide: ["$totalPrice", "$totalAds"] } },
              0,
            ],
          },
        },
      },
      { $sort: { totalAds: -1 } },
    ]);

    const topDistricts = priceAnalysis
      .filter((d) => d.district !== "سایر مناطق")
      .slice(0, 30);
    const totalAds = priceAnalysis.reduce(
      (sum, item) => sum + item.totalAds,
      0,
    );

    // ... (بقیه کد بدون تغییر، فقط city و district و... حالا string هستن)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthly = await Ad.aggregate([
      {
        $match: {
          ...matchConditions,
          price: { $gt: 0 },
          area: { $gt: 0 },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          avgPricePerMeter: { $avg: { $divide: ["$price", "$area"] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const MONTHS_PERSIAN: Record<number, string> = {
      1: "دی/بهمن",
      2: "بهمن/اسفند",
      3: "اسفند/فروردین",
      4: "فروردین/اردیبهشت",
      5: "اردیبهشت/خرداد",
      6: "خرداد/تیر",
      7: "تیر/مرداد",
      8: "مرداد/شهریور",
      9: "شهریور/مهر",
      10: "مهر/آبان",
      11: "آبان/آذر",
      12: "آذر/دی",
    };
    const marketTrends = monthly.map((r: any) => ({
      month: MONTHS_PERSIAN[r._id.month] || `ماه ${r._id.month}`,
      avgPricePerMeter: Math.round(r.avgPricePerMeter || 0),
    }));

    const statsAgg = await Ad.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalPrice: { $sum: { $ifNull: ["$price", 0] } },
          totalArea: { $sum: { $ifNull: ["$area", 0] } },
          avgArea: { $avg: "$area" },
          maxPrice: { $max: "$price" },
          minPrice: { $min: "$price" },
          avgTotalPrice: { $avg: "$price" },
        },
      },
    ]);

    let overallAvgPrice = 0;
    if (statsAgg.length > 0 && statsAgg[0].totalArea > 0) {
      overallAvgPrice = Math.round(
        statsAgg[0].totalPrice / statsAgg[0].totalArea,
      );
    }

    let growthRate = 0;
    if (marketTrends.length >= 2) {
      const latest =
        marketTrends[marketTrends.length - 1]?.avgPricePerMeter || 0;
      const previous =
        marketTrends[marketTrends.length - 2]?.avgPricePerMeter || 0;
      if (previous > 0)
        growthRate = parseFloat(
          (((latest - previous) / previous) * 100).toFixed(1),
        );
    }

    return res.json({
      success: true,
      data: {
        totalAds,
        priceAnalysis: topDistricts,
        marketTrends,
        overallAvgPrice,
        growthRate,
        avgArea: statsAgg[0]?.avgArea || 0,
        maxPrice: statsAgg[0]?.maxPrice || 0,
        minPrice: statsAgg[0]?.minPrice || 0,
        avgTotalPrice: Math.round(statsAgg[0]?.avgTotalPrice || 0),
      },
    });
  } catch (error: any) {
    console.error("❌ [super-admin/analysis]", error.message);
    return res.status(500).json({ success: false, message: "خطای سرور" });
  }
};
