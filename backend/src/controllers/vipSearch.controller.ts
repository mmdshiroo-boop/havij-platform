// ═══════════════════════════════════════════════════════════════════════════════
// کنترلر جستجوی پیشرفته VIP / مشاور املاک
// پلتفرم املاک ایرانی
// ═══════════════════════════════════════════════════════════════════════════════

import { Response } from "express";
import mongoose, { PipelineStage } from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";

// ═══════════════════════════════════════════════════════════════════════════════
// نوع‌ها و اینترفیس‌ها
// ═══════════════════════════════════════════════════════════════════════════════

/** نقش‌های کاربری مجاز برای دسترسی کامل VIP */
const VIP_ROLES = ["agent", "vip", "admin", "super_admin"] as const;
type VipRole = (typeof VIP_ROLES)[number];

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */
interface VipSearchParams {
  q?: string;
  status?: string;
  province?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  adType?: string;
  propertyType?: string;
  priceMin?: string;
  priceMax?: string;
  areaMin?: string;
  areaMax?: string;
  rooms?: string;
  minRooms?: string;
  maxRooms?: string;
  floor?: string;
  minFloor?: string;
  maxFloor?: string;
  buildingAgeMin?: string;
  buildingAgeMax?: string;
  yearBuiltMin?: string;
  yearBuiltMax?: string;
  documentType?: string;
  usage?: string;
  amenities?: string;
  source?: string;
  isVerified?: string;
  isUrgent?: string;
  hasImage?: string;
  savedByUser?: string;
  excludeIds?: string;
  pricePerSqmMin?: string;
  pricePerSqmMax?: string;
  nearby?: string;
  lat?: string;
  lng?: string;
  radius?: string; // شعاع جستجوی نزدیک (به کیلومتر)
  sort?: string;
  page?: string;
  limit?: string;
  export?: string;
  startDate?: string;
  endDate?: string;
}

/** نوع مرتب‌سازی پشتیبانی‌شده */
type SortOption =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "most_viewed"
  | "most_saved"
  | "popular";

/** نوع خروجی اکسپورت */
type ExportFormat = "excel" | "csv";

// ═══════════════════════════════════════════════════════════════════════════════
// ابزارها و توابع کمکی
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * تبدیل تاریخ شمسی (جلالی) به میلادی
 * فرمت ورودی: "1403/06/15" یا "1403-06-15" یا "14030615"
 * @returns تاریخ میلادی یا null در صورت خطا
 */
function parsePersianDate(dateStr: string): Date | null {
  try {
    const normalized = dateStr.trim().replace(/-/g, "/");

    let y: number, m: number, d: number;

    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(normalized)) {
      const parts = normalized.split("/").map(Number);
      y = parts[0];
      m = parts[1];
      d = parts[2];
    } else if (/^\d{8}$/.test(normalized)) {
      y = parseInt(normalized.substring(0, 4), 10);
      m = parseInt(normalized.substring(4, 6), 10);
      d = parseInt(normalized.substring(6, 8), 10);
    } else {
      const isoDate = new Date(dateStr);
      if (!isNaN(isoDate.getTime())) return isoDate;
      return null;
    }

    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return jalaliToGregorian(y, m, d);
  } catch {
    return null;
  }
}

/**
 * تبدیل تاریخ جلالی به میلادی
 */
function jalaliToGregorian(jy: number, jm: number, jd: number): Date | null {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy: number, gm: number, gd: number;
  let jy2 = jy + 1595;
  let days =
    -355668 +
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy = 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  gd = days + 1;

  for (let i = 0; i < 11 && gd > g_d_m[i + 1]; i++) {
    gm = i + 2;
    gd -= g_d_m[i + 1];
  }

  if (!gm) gm = 1;

  const result = new Date(gy, gm - 1, gd);
  if (isNaN(result.getTime())) return null;
  return result;
}

/**
 * تبدیل رشته ورودی به تاریخ
 */
function parseDateInput(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();

  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) return isoDate;

  return parsePersianDate(trimmed);
}

/**
 * تبدیل مقدار استرینگ بولی به boolean واقعی
 */
function toBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  return value === "true" || value === "1";
}

/**
 * پارس کردن آرایه‌ای از رشته‌ها
 */
function parseStringArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * نسبت‌سنجی نقش کاربر برای دسترسی VIP
 */
function checkVipAccess(role?: string): "full" | "limited" {
  if (role && (VIP_ROLES as readonly string[]).includes(role)) {
    return "full";
  }
  return "limited";
}

// ═══════════════════════════════════════════════════════════════════════════════
// نقشه مرتب‌سازی
// ═══════════════════════════════════════════════════════════════════════════════

const SORT_MAP: Record<SortOption, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
  most_viewed: { views: -1, createdAt: -1 },
  most_saved: { saves: -1, createdAt: -1 },
  popular: { saves: -1, views: -1, createdAt: -1 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// امکانات مجاز برای فیلتر
// ═══════════════════════════════════════════════════════════════════════════════

const VALID_AMENITIES = [
  "elevator",
  "parking",
  "storage",
  "balcony",
  "yard",
  "pool",
  "sauna",
  "jacuzzi",
  "fireplace",
  "gym",
  "wifi",
  "tv",
  "kitchen",
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// تابع اصلی: جستجوی پیشرفته VIP
// ═══════════════════════════════════════════════════════════════════════════════

export const vipAdvancedSearch = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const searchStartTime = Date.now();

  try {
    const params: VipSearchParams = {
      q: String(req.query.q || ""),
      status: String(req.query.status || ""),
      province: String(req.query.province || ""),
      city: String(req.query.city || ""),
      district: String(req.query.district || ""),
      neighborhood: String(req.query.neighborhood || ""),
      adType: String(req.query.adType || ""),
      propertyType: String(req.query.propertyType || ""),
      priceMin: String(req.query.priceMin || ""),
      priceMax: String(req.query.priceMax || ""),
      areaMin: String(req.query.areaMin || ""),
      areaMax: String(req.query.areaMax || ""),
      rooms: String(req.query.rooms || ""),
      minRooms: String(req.query.minRooms || ""),
      maxRooms: String(req.query.maxRooms || ""),
      floor: String(req.query.floor || ""),
      minFloor: String(req.query.minFloor || ""),
      maxFloor: String(req.query.maxFloor || ""),
      buildingAgeMin: String(req.query.buildingAgeMin || ""),
      buildingAgeMax: String(req.query.buildingAgeMax || ""),
      yearBuiltMin: String(req.query.yearBuiltMin || ""),
      yearBuiltMax: String(req.query.yearBuiltMax || ""),
      documentType: String(req.query.documentType || ""),
      usage: String(req.query.usage || ""),
      amenities: String(req.query.amenities || ""),
      source: String(req.query.source || ""),
      isVerified: String(req.query.isVerified || ""),
      isUrgent: String(req.query.isUrgent || ""),
      hasImage: String(req.query.hasImage || ""),
      savedByUser: String(req.query.savedByUser || ""),
      excludeIds: String(req.query.excludeIds || ""),
      pricePerSqmMin: String(req.query.pricePerSqmMin || ""),
      pricePerSqmMax: String(req.query.pricePerSqmMax || ""),
      nearby: String(req.query.nearby || ""),
      lat: String(req.query.lat || ""),
      lng: String(req.query.lng || ""),
      radius: String(req.query.radius || "5"), // اضافه کردن radius
      sort: String(req.query.sort || "newest"),
      page: String(req.query.page || "1"),
      limit: String(req.query.limit || "20"),
      export: String(req.query.export || ""),
      startDate: String(req.query.startDate || ""),
      endDate: String(req.query.endDate || ""),
    };

    const accessLevel = checkVipAccess(req.user?.role);
    const isVipUser = accessLevel === "full";
    const MAX_RESULTS_FOR_LIMITED = 20;
    const LIMIT_CEILING = isVipUser ? 100 : MAX_RESULTS_FOR_LIMITED;

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(
      LIMIT_CEILING,
      Math.max(1, Number(params.limit) || 20),
    );
    const skip = (page - 1) * limit;

    if (params.nearby === "true" && params.lat && params.lng) {
      await handleNearbySearch(req, res, params, {
        page,
        limit,
        skip,
        isVipUser,
        searchStartTime,
      });
      return;
    }

    const conditions: Record<string, unknown>[] = [];

    if (params.status) {
      conditions.push({ status: params.status });
    } else if (!isVipUser) {
      conditions.push({ status: "active" });
    }

    if (params.q) {
      conditions.push({
        $or: [
          { title: { $regex: params.q, $options: "i" } },
          { description: { $regex: params.q, $options: "i" } },
          { neighborhood: { $regex: params.q, $options: "i" } },
          { district: { $regex: params.q, $options: "i" } },
        ],
      });
    }

    if (params.startDate) {
      const start = parseDateInput(params.startDate);
      if (start) conditions.push({ createdAt: { $gte: start } });
    }

    if (params.endDate) {
      const end = parseDateInput(params.endDate);
      if (end) {
        end.setHours(23, 59, 59, 999);
        conditions.push({ createdAt: { $lte: end } });
      }
    }

    if (params.province)
      conditions.push({
        province: { $regex: new RegExp(params.province, "i") },
      });
    if (params.city)
      conditions.push({ city: { $regex: new RegExp(params.city, "i") } });
    if (params.district)
      conditions.push({
        district: { $regex: new RegExp(params.district, "i") },
      });
    if (params.neighborhood)
      conditions.push({
        neighborhood: { $regex: new RegExp(params.neighborhood, "i") },
      });

    if (params.priceMin || params.priceMax) {
      const priceFilter: Record<string, number> = {};
      if (params.priceMin) priceFilter.$gte = Number(params.priceMin);
      if (params.priceMax) priceFilter.$lte = Number(params.priceMax);
      conditions.push({ price: priceFilter });
    }

    if (params.areaMin || params.areaMax) {
      const areaFilter: Record<string, number> = {};
      if (params.areaMin) areaFilter.$gte = Number(params.areaMin);
      if (params.areaMax) areaFilter.$lte = Number(params.areaMax);
      conditions.push({ area: areaFilter });
    }

    if (params.rooms && params.rooms !== "any") {
      conditions.push({ rooms: Number(params.rooms) });
    } else {
      if (params.minRooms)
        conditions.push({ rooms: { $gte: Number(params.minRooms) } });
      if (params.maxRooms)
        conditions.push({ rooms: { $lte: Number(params.maxRooms) } });
    }

    if (params.floor && params.floor !== "any") {
      conditions.push({ floor: Number(params.floor) });
    } else {
      if (params.minFloor)
        conditions.push({ floor: { $gte: Number(params.minFloor) } });
      if (params.maxFloor)
        conditions.push({ floor: { $lte: Number(params.maxFloor) } });
    }

    if (params.buildingAgeMin || params.buildingAgeMax) {
      const ageFilter: Record<string, number> = {};
      if (params.buildingAgeMin) ageFilter.$gte = Number(params.buildingAgeMin);
      if (params.buildingAgeMax) ageFilter.$lte = Number(params.buildingAgeMax);
      conditions.push({ buildingAge: ageFilter });
    }

    if (params.yearBuiltMin || params.yearBuiltMax) {
      const yearFilter: Record<string, number> = {};
      if (params.yearBuiltMin) yearFilter.$gte = Number(params.yearBuiltMin);
      if (params.yearBuiltMax) yearFilter.$lte = Number(params.yearBuiltMax);
      conditions.push({ yearBuilt: yearFilter });
    }

    if (params.adType) conditions.push({ adType: params.adType });
    if (params.propertyType)
      conditions.push({ propertyType: params.propertyType });

    const amenitiesList = parseStringArray(params.amenities);
    for (const amenity of amenitiesList) {
      if ((VALID_AMENITIES as readonly string[]).includes(amenity)) {
        conditions.push({ [`amenities.${amenity}`]: true });
      }
    }

    if (params.source) conditions.push({ source: params.source });

    const verifiedFilter = toBoolean(params.isVerified);
    if (verifiedFilter !== undefined)
      conditions.push({ isVerified: verifiedFilter });

    const urgentFilter = toBoolean(params.isUrgent);
    if (urgentFilter !== undefined) conditions.push({ isUrgent: urgentFilter });

    const imageFilter = toBoolean(params.hasImage);
    if (imageFilter === true)
      conditions.push({ images: { $exists: true, $ne: [] } });

    if (params.documentType)
      conditions.push({ documentType: params.documentType });
    if (params.usage) conditions.push({ usage: params.usage });

    // VIP: savedByUser
    if (params.savedByUser && isVipUser) {
      try {
        const savedByUserId = new mongoose.Types.ObjectId(params.savedByUser);
        const Save = mongoose.model("Save");
        const savedAds = await Save.find({ userId: savedByUserId }).distinct(
          "adId",
        );
        if (savedAds.length > 0) {
          conditions.push({ _id: { $in: savedAds } });
        } else {
          res.json({
            success: true,
            data: [],
            pagination: { page, limit, total: 0, pages: 0 },
            filters: await buildFilterMetadata(),
            stats: {
              totalResults: 0,
              avgPrice: 0,
              avgArea: 0,
              searchTime: `${Date.now() - searchStartTime}ms`,
            },
          });
          return; // فقط return خالی
        }
      } catch {}
    }

    // VIP: excludeIds
    if (params.excludeIds) {
      const excludeArray = parseStringArray(params.excludeIds);
      const validIds = excludeArray
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (validIds.length > 0) conditions.push({ _id: { $nin: validIds } });
    }

    // VIP: pricePerSqmMin / pricePerSqmMax
    if ((params.pricePerSqmMin || params.pricePerSqmMax) && isVipUser) {
      const sqmCondition: Record<string, unknown> = {
        $expr: { $gt: [{ $ifNull: ["$area", 0] }, 0] },
      };
      if (params.pricePerSqmMin && params.pricePerSqmMax) {
        sqmCondition.$expr = {
          $and: [
            { $gt: [{ $ifNull: ["$area", 0] }, 0] },
            {
              $gte: [
                { $divide: ["$price", "$area"] },
                Number(params.pricePerSqmMin),
              ],
            },
            {
              $lte: [
                { $divide: ["$price", "$area"] },
                Number(params.pricePerSqmMax),
              ],
            },
          ],
        };
      } else if (params.pricePerSqmMin) {
        sqmCondition.$expr = {
          $and: [
            { $gt: [{ $ifNull: ["$area", 0] }, 0] },
            {
              $gte: [
                { $divide: ["$price", "$area"] },
                Number(params.pricePerSqmMin),
              ],
            },
          ],
        };
      } else if (params.pricePerSqmMax) {
        sqmCondition.$expr = {
          $and: [
            { $gt: [{ $ifNull: ["$area", 0] }, 0] },
            {
              $lte: [
                { $divide: ["$price", "$area"] },
                Number(params.pricePerSqmMax),
              ],
            },
          ],
        };
      }
      conditions.push(sqmCondition);
    }

    const query: Record<string, unknown> =
      conditions.length > 0 ? { $and: conditions } : {};
    const sort = SORT_MAP[params.sort || "newest"] || SORT_MAP.newest;

    if (
      params.export &&
      (params.export === "excel" || params.export === "csv")
    ) {
      await handleExport(req, res, query, sort, params.export, {
        isVipUser,
        searchStartTime,
      });
      return;
    }

    const AdModel = mongoose.model("Ad");

    const [ads, total, statsResult] = await Promise.all([
      AdModel.find(query)
        .populate("category", "name slug")
        .populate("userId", "firstName lastName phone avatar agencyName")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      AdModel.countDocuments(query),
      isVipUser
        ? AdModel.aggregate([
            { $match: query },
            {
              $group: {
                _id: null,
                avgPrice: { $avg: "$price" },
                avgArea: { $avg: { $ifNull: ["$area", 0] } },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
                minArea: { $min: { $ifNull: ["$area", 0] } },
                maxArea: { $max: { $ifNull: ["$area", 0] } },
              },
            },
          ]).then((results) => results[0] || null)
        : Promise.resolve(null),
    ]);

    const sanitizedAds = ads.map((ad: any) => {
      const adCopy = { ...ad };
      if (!isVipUser) {
        delete adCopy.contactPhone;
        delete adCopy.contactName;
      }
      return adCopy;
    });

    const searchTime = Date.now() - searchStartTime;
    const filterMetadata = await buildFilterMetadata();

    res.json({
      success: true,
      data: sanitizedAds,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      filters: filterMetadata,
      stats: {
        totalResults: total,
        avgPrice: statsResult?.avgPrice ? Math.round(statsResult.avgPrice) : 0,
        avgArea: statsResult?.avgArea ? Math.round(statsResult.avgArea) : 0,
        searchTime: `${searchTime}ms`,
        ...(isVipUser && statsResult
          ? {
              priceRange: {
                min: statsResult.minPrice || 0,
                max: statsResult.maxPrice || 0,
              },
              areaRange: {
                min: statsResult.minArea || 0,
                max: statsResult.maxArea || 0,
              },
            }
          : {}),
      },
    });
  } catch (error) {
    console.error("❌ خطا در جستجوی پیشرفته VIP:", error);
    res
      .status(500)
      .json({ success: false, message: "خطای داخلی سرور در جستجوی پیشرفته" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// جستجوی مکانی (Nearby) با $geoNear
// ═══════════════════════════════════════════════════════════════════════════════

interface NearbyContext {
  page: number;
  limit: number;
  skip: number;
  isVipUser: boolean;
  searchStartTime: number;
}

async function handleNearbySearch(
  req: AuthRequest, // فقط AuthRequest، بدون VipRequest
  res: Response,
  params: VipSearchParams,
  ctx: NearbyContext,
): Promise<void> {
  const Ad = mongoose.model("Ad");

  const lat = parseFloat(params.lat!);
  const lng = parseFloat(params.lng!);
  const radiusKm = Math.min(
    100,
    Math.max(0.1, parseFloat(params.radius || "5")),
  );

  if (
    isNaN(lat) ||
    isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    res.status(400).json({
      success: false,
      message: "مختصات جغرافیایی نامعتبر است",
    });
    return; // فقط return
  }

  try {
    const pipeline: PipelineStage[] = [];

    pipeline.push({
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distance",
        maxDistance: radiusKm * 1000,
        distanceMultiplier: 0.001,
        spherical: true,
        key: "location",
        query:
          params.status || !ctx.isVipUser
            ? { status: params.status || "active" }
            : {},
      },
    } as PipelineStage.GeoNear);

    const matchConditions: Record<string, unknown>[] = [];

    if (params.adType) matchConditions.push({ adType: params.adType });
    if (params.propertyType)
      matchConditions.push({ propertyType: params.propertyType });

    if (params.priceMin || params.priceMax) {
      const priceFilter: Record<string, number> = {};
      if (params.priceMin) priceFilter.$gte = Number(params.priceMin);
      if (params.priceMax) priceFilter.$lte = Number(params.priceMax);
      matchConditions.push({ price: priceFilter });
    }

    if (params.areaMin || params.areaMax) {
      const areaFilter: Record<string, number> = {};
      if (params.areaMin) areaFilter.$gte = Number(params.areaMin);
      if (params.areaMax) areaFilter.$lte = Number(params.areaMax);
      matchConditions.push({ area: areaFilter });
    }

    if (params.excludeIds) {
      const excludeArray = parseStringArray(params.excludeIds);
      const validIds = excludeArray
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (validIds.length > 0) {
        matchConditions.push({ _id: { $nin: validIds } });
      }
    }

    const amenitiesList = parseStringArray(params.amenities);
    for (const amenity of amenitiesList) {
      if ((VALID_AMENITIES as readonly string[]).includes(amenity)) {
        matchConditions.push({ [`amenities.${amenity}`]: true });
      }
    }

    if (matchConditions.length > 0) {
      pipeline.push({
        $match: { $and: matchConditions },
      });
    }

    const sortOption = params.sort || "newest";
    const sortObj: Record<string, 1 | -1> = {};
    if (sortOption !== "newest") {
      const sortConfig = SORT_MAP[sortOption as SortOption];
      if (sortConfig) Object.assign(sortObj, sortConfig);
    }
    sortObj.distance = 1;
    if (sortOption === "newest" || sortOption === "oldest") {
      sortObj.createdAt = sortOption === "newest" ? -1 : 1;
    }

    pipeline.push({ $sort: sortObj });

    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });

    pipeline.push({ $skip: ctx.skip });
    pipeline.push({ $limit: ctx.limit });

    pipeline.push({
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
        pipeline: [{ $project: { name: 1, slug: 1 } }],
      },
    });
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              phone: 1,
              avatar: 1,
              agencyName: 1,
            },
          },
        ],
      },
    });

    const [results, countResults] = await Promise.all([
      Ad.aggregate(pipeline).exec(),
      Ad.aggregate(countPipeline).exec(),
    ]);

    const total = countResults.length > 0 ? countResults[0].total : 0;

    const sanitizedResults = results.map((ad: Record<string, unknown>) => {
      if (!ctx.isVipUser) {
        delete ad.contactPhone;
        delete ad.contactName;
      }
      return ad;
    });

    const searchTime = Date.now() - ctx.searchStartTime;

    res.json({
      success: true,
      data: sanitizedResults,
      pagination: {
        page: ctx.page,
        limit: ctx.limit,
        total,
        pages: Math.ceil(total / ctx.limit),
      },
      filters: await buildFilterMetadata(),
      stats: {
        totalResults: total,
        avgPrice: 0,
        avgArea: 0,
        searchTime: `${searchTime}ms`,
        nearby: {
          center: { lat, lng },
          radiusKm,
        },
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (
      errorMsg.includes("2dsphere") ||
      errorMsg.includes("geoNear") ||
      errorMsg.includes("index")
    ) {
      res.status(500).json({
        success: false,
        message:
          "ایندکس مکانی (2dsphere) روی فیلد location وجود ندارد. لطفاً ابتدا ایندکس را ایجاد کنید.",
        hint: "AdSchema.index({ location: '2dsphere' })",
      });
      return;
    }

    console.error("❌ خطا در جستجوی مکانی:", error);
    res.status(500).json({
      success: false,
      message: "خطا در جستجوی آگهی‌های نزدیک",
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// اکسپورت نتایج (CSV / Excel)
// ═══════════════════════════════════════════════════════════════════════════════

interface ExportContext {
  isVipUser: boolean;
  searchStartTime: number;
}

async function handleExport(
  req: AuthRequest, // AuthRequest به جای VipRequest
  res: Response,
  query: Record<string, unknown>,
  sort: Record<string, 1 | -1>,
  format: ExportFormat,
  ctx: ExportContext,
): Promise<void> {
  if (!ctx.isVipUser) {
    res.status(403).json({
      success: false,
      message: "دسترسی اکسپورت فقط برای کاربران VIP و مشاوران املاک فعال است",
    });
    return;
  }

  const Ad = mongoose.model("Ad");
  const EXPORT_MAX_RECORDS = 5000;

  const ads = await Ad.find(query)
    .sort(sort)
    .limit(EXPORT_MAX_RECORDS)
    .populate("category", "name")
    .populate("userId", "firstName lastName phone")
    .lean()
    .exec();

  if (ads.length === 0) {
    res.status(404).json({
      success: false,
      message: "نتیجه‌ای برای اکسپورت یافت نشد",
    });
    return;
  }

  if (format === "csv") {
    const headers = [
      "عنوان",
      "نوع آگهی",
      "نوع ملک",
      "استان",
      "شهر",
      "محله",
      "قیمت (تومان)",
      "متراژ",
      "اتاق",
      "طبقه",
      "عمر بنا",
      "سال ساخت",
      "نوع سند",
      "کاربری",
      "آسانسور",
      "پارکینگ",
      "انباری",
      "بالکن",
      "حیاط",
      "استخر",
      "سونا",
      "تأیید شده",
      "فوری",
      "منبع",
      "وضعیت",
      "بازدید",
      "ذخیره",
      "تاریخ ایجاد",
      "شماره تماس",
      "نام مالک",
    ];

    const rows = ads.map((ad: Record<string, unknown>) => {
      const amenities = ad.amenities as Record<string, boolean> | undefined;
      const userId = ad.userId as Record<string, unknown> | undefined;
      return [
        escapeCsvField(ad.title as string),
        getAdTypeLabel(ad.adType as string),
        getPropertyTypeLabel(ad.propertyType as string),
        escapeCsvField(ad.province as string),
        escapeCsvField(ad.city as string),
        escapeCsvField(ad.neighborhood as string),
        ad.price as number,
        ad.area as number,
        ad.rooms as number,
        ad.floor as number,
        ad.buildingAge as number,
        ad.yearBuilt as number,
        ad.documentType as string,
        getUsageLabel(ad.usage as string),
        amenities?.elevator ? "بله" : "خیر",
        amenities?.parking ? "بله" : "خیر",
        amenities?.storage ? "بله" : "خیر",
        amenities?.balcony ? "بله" : "خیر",
        amenities?.yard ? "بله" : "خیر",
        amenities?.pool ? "بله" : "خیر",
        amenities?.sauna ? "بله" : "خیر",
        ad.isVerified ? "بله" : "خیر",
        ad.isUrgent ? "بله" : "خیر",
        getSourceLabel(ad.source as string),
        getStatusLabel(ad.status as string),
        ad.views as number,
        ad.saves as number,
        new Date(ad.createdAt as string).toLocaleString("fa-IR"),
        escapeCsvField(ad.contactPhone as string),
        escapeCsvField((ad.sellerName || userId?.firstName || "") as string),
      ]
        .map((field) => String(field ?? ""))
        .join(",");
    });

    const BOM = "\uFEFF";
    const csvContent = BOM + headers.join(",") + "\n" + rows.join("\n");
    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=vip-search-${timestamp}.csv`,
    );
    res.send(csvContent);
    return;
  }

  if (format === "excel") {
    try {
      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("نتایج جستجو");
      sheet.views = [{ rightToLeft: true }];

      const headers = [
        "عنوان",
        "نوع آگهی",
        "نوع ملک",
        "استان",
        "شهر",
        "محله",
        "قیمت (تومان)",
        "متراژ",
        "اتاق",
        "طبقه",
        "عمر بنا",
        "سال ساخت",
        "نوع سند",
        "تأیید شده",
        "فوری",
        "منبع",
        "وضعیت",
        "بازدید",
        "تاریخ ایجاد",
        "شماره تماس",
      ];

      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true, size: 11, name: "B Nazanin" };
      headerRow.alignment = { horizontal: "right" };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      headerRow.font = {
        bold: true,
        size: 11,
        color: { argb: "FFFFFFFF" },
      };

      for (const ad of ads as Record<string, unknown>[]) {
        const userId = ad.userId as Record<string, unknown> | undefined;
        sheet.addRow([
          ad.title || "",
          getAdTypeLabel(ad.adType as string),
          getPropertyTypeLabel(ad.propertyType as string),
          ad.province || "",
          ad.city || "",
          ad.neighborhood || "",
          ad.price || 0,
          ad.area || 0,
          ad.rooms || "",
          ad.floor || "",
          ad.buildingAge || "",
          ad.yearBuilt || "",
          ad.documentType || "",
          ad.isVerified ? "بله" : "خیر",
          ad.isUrgent ? "بله" : "خیر",
          getSourceLabel(ad.source as string),
          getStatusLabel(ad.status as string),
          ad.views || 0,
          new Date(ad.createdAt as string).toLocaleString("fa-IR"),
          ctx.isVipUser ? ad.contactPhone || "" : "",
        ]);
      }

      sheet.columns.forEach((column: { width?: number }, index: number) => {
        column.width = index < 6 ? 20 : 15;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const timestamp = new Date().toISOString().slice(0, 10);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=vip-search-${timestamp}.xlsx`,
      );
      res.send(buffer);
    } catch {
      console.warn(
        "⚠️ کتابخانه exceljs نصب نیست. خروجی به صورت CSV ارسال می‌شود.",
      );
      const headers = [
        "عنوان",
        "نوع آگهی",
        "نوع ملک",
        "شهر",
        "قیمت",
        "متراژ",
        "تاریخ",
      ];
      const rows = (ads as Record<string, unknown>[]).map((ad) =>
        [
          escapeCsvField(ad.title as string),
          getAdTypeLabel(ad.adType as string),
          getPropertyTypeLabel(ad.propertyType as string),
          escapeCsvField(ad.city as string),
          ad.price,
          ad.area,
          new Date(ad.createdAt as string).toLocaleString("fa-IR"),
        ]
          .map((f) => String(f ?? ""))
          .join(","),
      );
      const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
      const timestamp = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=vip-search-${timestamp}.csv`,
      );
      res.send(csvContent);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// توابع کمکی برچسب‌گذاری فارسی
// ═══════════════════════════════════════════════════════════════════════════════

function getAdTypeLabel(adType: string): string {
  const labels: Record<string, string> = {
    sale: "فروش",
    rent: "اجاره",
    daily_rent: "اجاره روزانه",
    exchange: "معاوضه",
    mortgage: "رهن و اجاره",
    pre_sale: "پیش‌فروش",
  };
  return labels[adType] || adType;
}

function getPropertyTypeLabel(propertyType?: string): string {
  if (!propertyType) return "";
  const labels: Record<string, string> = {
    apartment: "آپارتمان",
    villa: "ویلا",
    house: "خانه",
    land: "زمین",
    suite: "سوئیت",
    office: "دفتر",
    commercial: "تجاری",
    bare_land: "زمین خام",
    penthouse: "پنت‌هاوس",
    duplex: "دوبلکس",
    garden: "باغ",
    hotel: "هتل",
  };
  return labels[propertyType] || propertyType;
}

function getDocumentTypeLabel(docType?: string): string {
  if (!docType) return "";
  const labels: Record<string, string> = {
    official: "رسمی",
    conditional: "مشاع / شرطی",
    none: "بدون سند",
  };
  return labels[docType] || docType;
}

function getUsageLabel(usage?: string): string {
  if (!usage) return "";
  const labels: Record<string, string> = {
    maskani: "مسکونی",
    tejarati: "تجاری",
    sanati: "صنعتی",
    edari: "اداری",
    amozeshi: "آموزشی",
    behdashti: "بهداشتی",
    vardaneshi: "ورزشی",
    residential: "مسکونی",
    commercial: "تجاری",
    industrial: "صنعتی",
  };
  return labels[usage] || usage;
}

function getSourceLabel(source?: string): string {
  if (!source) return "";
  const labels: Record<string, string> = {
    divar: "دیوار",
    sheypoor: "شیپور",
    bama: "باما",
    manual: "ثبت دستی",
  };
  return labels[source] || source;
}

function getStatusLabel(status?: string): string {
  if (!status) return "";
  const labels: Record<string, string> = {
    active: "فعال",
    published: "منتشرشده",
    pending: "در انتظار تأیید",
    rejected: "رد شده",
    sold: "فروش رفته",
    expired: "منقضی",
  };
  return labels[status] || status;
}

function escapeCsvField(value: string): string {
  if (!value) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function buildFilterMetadata(): Promise<{
  availableProvinces: string[];
  availableCities: string[];
  priceRange: { min: number; max: number };
  areaRange: { min: number; max: number };
}> {
  try {
    const Ad = mongoose.model("Ad");
    const [provinceResult, cityResult, priceResult, areaResult] =
      await Promise.all([
        Ad.distinct("province").then((r) =>
          (r as string[]).filter(Boolean).sort(),
        ),
        Ad.distinct("city").then((r) => (r as string[]).filter(Boolean).sort()),
        Ad.aggregate([
          { $match: { price: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              min: { $min: "$price" },
              max: { $max: "$price" },
            },
          },
        ]).then((results) =>
          results.length > 0
            ? { min: results[0].min, max: results[0].max }
            : { min: 0, max: 0 },
        ),
        Ad.aggregate([
          { $match: { area: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              min: { $min: "$area" },
              max: { $max: "$area" },
            },
          },
        ]).then((results) =>
          results.length > 0
            ? { min: results[0].min, max: results[0].max }
            : { min: 0, max: 0 },
        ),
      ]);

    return {
      availableProvinces: provinceResult as string[],
      availableCities: cityResult as string[],
      priceRange: priceResult as { min: number; max: number },
      areaRange: areaResult as { min: number; max: number },
    };
  } catch (error) {
    console.warn("⚠️ خطا در ساخت متادیتای فیلترها:", error);
    return {
      availableProvinces: [],
      availableCities: [],
      priceRange: { min: 0, max: 0 },
      areaRange: { min: 0, max: 0 },
    };
  }
}
