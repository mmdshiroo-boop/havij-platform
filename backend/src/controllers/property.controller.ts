// backend/src/controllers/property.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Property } from "../models/Property.model";
import { AuthRequest } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  sendNotificationToUser,
  notifyExperts,
  notifyAdmins,
} from "../services/notification.service";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// ==================== تنظیمات آپلود ====================
const uploadDir = path.join(process.cwd(), "uploads", "properties");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `property-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("فقط فایل‌های تصویری مجاز هستند"));
    }
  },
});

// ==================== دریافت یک ملک (عمومی) ====================
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    // ✅ تبدیل id به رشته
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "شناسه ملک معتبر نیست" });
    }

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: "ملک یافت نشد" });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    console.error("Error in getPropertyById:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت ملک" });
  }
};
// ==================== هوش صنف و تحلیل بازار مسکن (VIP) ====================
export const getMarketAnalysis = async (req: Request, res: Response) => {
  // (بدون تغییر – خواندنی)
  try {
    const city = (req.query.city as string) || "تهران";

    const rawProperties = await Property.find({
      $or: [{ city: city }, { province: city }],
      "location.coordinates": { $exists: true, $ne: [] },
    }).select("title price location area district province city");

    const propertiesWithLocation = rawProperties.map((prop) => {
      const p = prop.toObject();
      return {
        ...p,
        latitude: p.location?.coordinates?.[1] || null,
        longitude: p.location?.coordinates?.[0] || null,
      };
    });

    const districtStats = await Property.aggregate([
      {
        $match: {
          $or: [{ city: city }, { province: city }],
          district: {
            $exists: true,
            $ne: null,
            $nin: ["نامشخص", "", " "],
          },
        },
      },
      {
        $group: {
          _id: "$district",
          totalAds: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          avgArea: { $avg: "$area" },
          sampleLocation: { $first: "$location" },
        },
      },
    ]);

    let districtAnalysis = districtStats.map((item) => {
      const avgArea = item.avgArea || 100;
      const avgPricePerMeter =
        avgArea > 0 ? Math.round((item.avgPrice || 0) / avgArea) : 0;
      const marketLiquidityScore = Math.min(item.totalAds * 5 + 50, 95);

      return {
        district: item._id,
        totalAds: item.totalAds,
        avgPricePerMeter: avgPricePerMeter || 65000000,
        marketLiquidityScore: marketLiquidityScore,
        monthlyGrowth: 3.5,
        location: item.sampleLocation || {
          type: "Point",
          coordinates: [51.4043, 35.7261],
        },
      };
    });

    if (districtAnalysis.length === 0) {
      districtAnalysis = [
        {
          district: "منطقه ۱ (نمونه تست دیتابیس)",
          totalAds: 12,
          avgPricePerMeter: 125000000,
          marketLiquidityScore: 85,
          monthlyGrowth: 4.2,
          location: { type: "Point", coordinates: [51.4643, 35.8061] },
        },
        {
          district: "منطقه ۲ (نمونه تست دیتابیس)",
          totalAds: 8,
          avgPricePerMeter: 95000000,
          marketLiquidityScore: 78,
          monthlyGrowth: 3.1,
          location: { type: "Point", coordinates: [51.3643, 35.7661] },
        },
        {
          district: "منطقه ۵ (نمونه تست دیتابیس)",
          totalAds: 15,
          avgPricePerMeter: 78000000,
          marketLiquidityScore: 92,
          monthlyGrowth: 5.0,
          location: { type: "Point", coordinates: [51.3143, 35.7461] },
        },
      ];
    }

    const monthlyTrend = [
      { name: "آذر", avgPrice: 62 },
      { name: "دی", avgPrice: 64 },
      { name: "بهمن", avgPrice: 65 },
      { name: "اسفند", avgPrice: 68 },
      { name: "فروردین", avgPrice: 67 },
      { name: "اردیبهشت", avgPrice: 71 },
    ];

    return res.status(200).json({
      success: true,
      data: {
        marketStatus: "رشد آرام پایدار",
        marketLiquidityScore: 82,
        avgSellingDays: 14,
        districtAnalysis,
        monthlyTrend,
        propertiesWithLocation,
        properties: propertiesWithLocation,
      },
    });
  } catch (error) {
    console.error("Error in getMarketAnalysis:", error);
    return res
      .status(500)
      .json({ success: false, message: "خطای سرور در تحلیل بازار" });
  }
};

// ==================== دریافت املاک آژانس ====================
export const getAgentProperties = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    // 🆕 همیشه از userId خود کاربر به‌عنوان agentId استفاده کن
    const agentId = userId;

    const { page = 1, limit = 20, status } = req.query;
    const query: any = { agentId: agentId };
    if (status && status !== "all") query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getAgentProperties:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت املاک" });
  }
};
// ==================== ثبت ملک جدید ====================
export const createProperty = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    const {
      title,
      description,
      price,
      priceType,
      propertyType,
      city,
      district,
      address,
      latitude,
      longitude,
      area,
      rooms,
      yearBuilt,
      images,
      categoryId,
    } = req.body;

    if (!title || !price || !city || !address) {
      return res.status(400).json({
        success: false,
        message: "عنوان، قیمت، شهر و آدرس الزامی است",
      });
    }

    let locationGeometry = undefined;
    if (latitude && longitude) {
      locationGeometry = {
        type: "Point" as const,
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    const property = await Property.create({
      title,
      description,
      price: Number(price),
      priceType: priceType || "sale",
      propertyType: propertyType || "apartment",
      city,
      district: district || "نامشخص",
      address,
      location: locationGeometry,
      area: Number(area) || 0,
      rooms: Number(rooms) || 0,
      yearBuilt: Number(yearBuilt) || 0,
      images: images || [],
      categoryId: categoryId || null,
      agentId: userId,
      status: "pending",
    });

    // Audit log
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.AD_CREATED,
      resource: "Property",
      resourceId: property._id.toString(),
      description: `کاربر ${req.user?.firstName || req.user?.phone} ملک "${property.title}" را ثبت کرد.`,
      req,
    });

    // 🆕 اعلان به کاربر (agent)
    await sendNotificationToUser(
      userId.toString(),
      "🏠 ملک جدید ثبت شد",
      `ملک "${property.title}" با موفقیت ثبت شد و در انتظار تایید است.`,
      "property_submitted",
      `/panel/agent/properties/${property._id}`,
      { propertyId: property._id.toString(), propertyTitle: property.title },
    );

    // 🆕 اعلان به ادمین‌ها
    await notifyAdmins(
      "🏠 ملک جدید در انتظار تایید",
      `ملک "${property.title}" توسط کاربر ثبت شد. لطفاً بررسی کنید.`,
      "new_property_pending",
      `/admin/properties/${property._id}`,
      { propertyId: property._id.toString(), propertyTitle: property.title },
    );

    // 🆕 اعلان به کارشناسان
    await notifyExperts(
      "🏠 ملک جدید برای بررسی",
      `ملک "${property.title}" ثبت شده و نیاز به بررسی دارد.`,
      "property_assigned",
      `/panel/expert/properties/${property._id}`,
      { propertyId: property._id.toString(), propertyTitle: property.title },
    );

    res.status(201).json({
      success: true,
      data: property,
      message: "ملک با موفقیت ثبت شد",
    });
  } catch (error) {
    console.error("Error in createProperty:", error);
    res.status(500).json({ success: false, message: "خطا در ثبت ملک" });
  }
};

// ==================== ویرایش ملک ====================
export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    const property = await Property.findOne({ _id: id, agentId: userId });
    if (!property) {
      return res.status(404).json({ success: false, message: "ملک یافت نشد" });
    }

    const oldStatus = property.status;
    const oldTitle = property.title;

    // به‌روزرسانی فیلدها
    const {
      title,
      description,
      price,
      priceType,
      propertyType,
      city,
      district,
      address,
      latitude,
      longitude,
      area,
      rooms,
      yearBuilt,
      images,
      status,
    } = req.body;

    if (title) property.title = title;
    if (description !== undefined) property.description = description;
    if (price) property.price = Number(price);
    if (priceType) property.priceType = priceType;
    if (propertyType) property.propertyType = propertyType;
    if (city) property.city = city;
    if (district) property.district = district;
    if (address) property.address = address;
    if (area !== undefined) property.area = Number(area);
    if (rooms !== undefined) property.rooms = Number(rooms);
    if (yearBuilt !== undefined) property.yearBuilt = Number(yearBuilt);
    if (images) property.images = images;
    if (status) property.status = status;

    if (latitude !== undefined && longitude !== undefined) {
      property.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    await property.save();

    // Audit log
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.AD_UPDATED,
      resource: "Property",
      resourceId: property._id.toString(),
      description: `کاربر ${req.user?.firstName || req.user?.phone} ملک "${property.title}" را ویرایش کرد.`,
      metadata: { updatedFields: req.body },
      req,
    });

    // 🆕 اعلان‌ها (تغییر وضعیت)
    if (status && status !== oldStatus) {
      if (status === "active") {
        await sendNotificationToUser(
          userId.toString(),
          "✅ ملک شما تایید شد",
          `ملک "${property.title}" با موفقیت تایید و منتشر شد.`,
          "property_approved",
          `/panel/agent/properties/${property._id}`,
          {
            propertyId: property._id.toString(),
            propertyTitle: property.title,
          },
        );
      } else if (status === "rejected") {
        const { rejectReason } = req.body;
        await sendNotificationToUser(
          userId.toString(),
          "❌ ملک شما رد شد",
          `ملک "${property.title}" به دلیل "${rejectReason || "دلیل مشخص نشده"}" رد شد.`,
          "property_rejected",
          `/panel/agent/properties/${property._id}`,
          {
            propertyId: property._id.toString(),
            propertyTitle: property.title,
            reason: rejectReason,
          },
        );
      }
    }

    // 🆕 اعلان تغییر عنوان
    if (title && title !== oldTitle) {
      await sendNotificationToUser(
        userId.toString(),
        "✏️ ملک شما ویرایش شد",
        `عنوان ملک از "${oldTitle}" به "${title}" تغییر یافت.`,
        "property_updated",
        `/panel/agent/properties/${property._id}`,
        { propertyId: property._id.toString(), oldTitle, newTitle: title },
      );
    }

    res.json({
      success: true,
      data: property,
      message: "ملک با موفقیت ویرایش شد",
    });
  } catch (error) {
    console.error("Error in updateProperty:", error);
    res.status(500).json({ success: false, message: "خطا در ویرایش ملک" });
  }
};

// ==================== حذف ملک ====================
export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "لطفاً وارد شوید" });
    }

    const property = await Property.findOneAndDelete({
      _id: id,
      agentId: userId,
    });
    if (!property) {
      return res.status(404).json({ success: false, message: "ملک یافت نشد" });
    }

    // Audit log
    await createAuditLog({
      userId: userId.toString(),
      action: AuditAction.AD_DELETED,
      resource: "Property",
      resourceId: id,
      description: `کاربر ${req.user?.firstName || req.user?.phone} ملک "${property.title}" را حذف کرد.`,
      req,
    });

    // 🆕 اعلان به کاربر (اختیاری)
    await sendNotificationToUser(
      userId.toString(),
      "🗑️ ملک حذف شد",
      `ملک "${property.title}" با موفقیت حذف شد.`,
      "property_updated",
      `/panel/agent/properties`,
    );

    res.json({ success: true, message: "ملک با موفقیت حذف شد" });
  } catch (error) {
    console.error("Error in deleteProperty:", error);
    res.status(500).json({ success: false, message: "خطا در حذف ملک" });
  }
};

// ==================== آپلود تصویر ملک ====================
export const uploadPropertyImage = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "لطفاً وارد شوید" });
  }

  upload.single("image")(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "هیچ فایلی انتخاب نشده است" });
    }

    const port = process.env.PORT || 5001;
    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    const imageUrl = `${baseUrl}/uploads/properties/${req.file.filename}`;

    // Audit log (اختیاری)
    await createAuditLog({
      userId: req.user._id.toString(),
      action: AuditAction.SYSTEM,
      resource: "PropertyImage",
      description: `کاربر ${req.user.firstName || req.user.phone} یک تصویر برای ملک آپلود کرد (${req.file.filename}).`,
      req,
    });

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      message: "تصویر با موفقیت آپلود شد",
    });
  });
};

// ==================== دریافت همه املاک (فقط ادمین) ====================
export const getAllProperties = async (req: AuthRequest, res: Response) => {
  // (بدون تغییر)
  try {
    const userRole = req.user?.role;
    if (userRole !== "admin" && userRole !== "super_admin") {
      return res
        .status(403)
        .json({ success: false, message: "دسترسی غیرمجاز" });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (search) query.title = { $regex: search, $options: "i" };

    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("agentId", "firstName lastName phone"),
      Property.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getAllProperties:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت املاک" });
  }
};

// ==================== تغییر وضعیت ملک (فقط ادمین/کارشناس) ====================
export const updatePropertyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (
      userRole !== "admin" &&
      userRole !== "super_admin" &&
      userRole !== "expert"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "دسترسی غیرمجاز" });
    }

    // ✅ تبدیل id به رشته
    const id = String(req.params.id);
    const { status, rejectReason } = req.body;

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: "ملک یافت نشد" });
    }

    const oldStatus = property.status;
    const propertyTitle = property.title;
    const agentId = property.agentId;

    property.status = status;
    if (status === "rejected" && rejectReason) {
      property.rejectReason = rejectReason;
    }
    if (status === "active") {
      // ✅ استفاده از any برای فیلد ناموجود verifiedAt
      (property as any).verifiedAt = new Date();
    }
    await property.save();

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.AD_STATUS_CHANGED,
      resource: "Property",
      resourceId: property._id.toString(),
      description: `ادمین/کارشناس ${req.user?.firstName || req.user?.phone} وضعیت ملک "${propertyTitle}" را از "${oldStatus}" به "${status}" تغییر داد.`,
      metadata: { oldStatus, newStatus: status, reason: rejectReason },
      req,
    });

    // 🆕 اعلان‌ها (بدون تغییر)
    if (agentId) {
      if (status === "active" && oldStatus !== "active") {
        await sendNotificationToUser(
          agentId.toString(),
          "✅ ملک شما تایید شد",
          `ملک "${propertyTitle}" با موفقیت تایید و منتشر شد.`,
          "property_approved",
          `/panel/agent/properties/${property._id}`,
          { propertyId: property._id.toString(), propertyTitle },
        );
      } else if (status === "rejected" && oldStatus !== "rejected") {
        await sendNotificationToUser(
          agentId.toString(),
          "❌ ملک شما رد شد",
          `ملک "${propertyTitle}" به دلیل "${rejectReason || "دلیل مشخص نشده"}" رد شد. لطفاً اطلاعات را ویرایش کنید.`,
          "property_rejected",
          `/panel/agent/properties/${property._id}`,
          {
            propertyId: property._id.toString(),
            propertyTitle,
            reason: rejectReason,
          },
        );
      } else if (status === "sold" && oldStatus !== "sold") {
        await sendNotificationToUser(
          agentId.toString(),
          "💰 ملک شما فروخته شد",
          `ملک "${propertyTitle}" با موفقیت به فروش رسید.`,
          "property_sold",
          `/panel/agent/properties/${property._id}`,
          { propertyId: property._id.toString(), propertyTitle },
        );
      }
    }

    // 🆕 اعلان به کارشناسان
    if (status === "pending" && oldStatus !== "pending") {
      await notifyExperts(
        "🏠 ملک نیاز به بررسی مجدد دارد",
        `ملک "${propertyTitle}" توسط ادمین برای بررسی مجدد ارسال شد.`,
        "property_assigned",
        `/panel/expert/properties/${property._id}`,
        { propertyId: property._id.toString(), propertyTitle },
      );
    }

    res.json({
      success: true,
      data: property,
      message: `وضعیت ملک به ${status} تغییر یافت`,
    });
  } catch (error) {
    console.error("Error in updatePropertyStatus:", error);
    res.status(500).json({ success: false, message: "خطا در تغییر وضعیت ملک" });
  }
};

// ==================== پردازش و امپورت آگهی‌های اسکرپ شده ====================
export const importScrapedPropertyService = async (scrapedData: any) => {
  try {
    const rawJsonLd = scrapedData.data?.rawJsonLd || scrapedData.rawJsonLd;
    const mainEntity =
      rawJsonLd?.mainEntity ||
      rawJsonLd?.["@graph"]?.find(
        (x: any) => x["@type"] === "RealEstateListing",
      )?.mainEntity;

    const geoData =
      mainEntity?.itemOffered?.geo ||
      mainEntity?.geo ||
      rawJsonLd?.geo ||
      scrapedData.data?.geo;

    const lat = geoData?.latitude;
    const lng = geoData?.longitude;

    let locationGeometry = undefined;

    if (lat && lng) {
      locationGeometry = {
        type: "Point" as const,
        coordinates: [Number(lng), Number(lat)],
      };
    }

    const priceInRials =
      mainEntity?.price ||
      mainEntity?.offers?.Price ||
      mainEntity?.offers?.price;
    let priceInToman = priceInRials ? priceInRials / 10 : 0;
    if (priceInToman === 0 && scrapedData.data?.price) {
      priceInToman = Number(scrapedData.data.price.replace(/[^0-9]/g, "")) || 0;
    }

    const addressLocality = mainEntity?.itemOffered?.address?.addressLocality;
    const breadcrumbs = rawJsonLd?.isPartOf?.breadcrumb?.itemListElement;
    const districtName =
      addressLocality ||
      breadcrumbs?.[2]?.item?.name ||
      scrapedData.data?.location ||
      "نامشخص";

    let mappedType: "apartment" | "villa" | "office" | "commercial" | "land" =
      "apartment";
    const itemType = mainEntity?.itemOffered?.["@type"] || "";
    const category = mainEntity?.category || scrapedData.data?.category || "";

    if (itemType === "Apartment" || category.includes("آپارتمان"))
      mappedType = "apartment";
    else if (category.includes("زمین") || category.includes("باغ"))
      mappedType = "land";
    else if (category.includes("ویلا")) mappedType = "villa";
    else if (category.includes("تجاری")) mappedType = "commercial";
    else if (category.includes("دفتر")) mappedType = "office";

    const areaValue =
      mainEntity?.itemOffered?.floorSize?.value ||
      Number(scrapedData.data?.area) ||
      0;
    const roomsValue =
      Number(mainEntity?.itemOffered?.numberOfRooms) ||
      Number(scrapedData.data?.rooms) ||
      0;

    const cleanedProperty = {
      title: mainEntity?.name || scrapedData.data?.title || "بدون عنوان",
      description:
        mainEntity?.description || scrapedData.data?.description || "",
      price: priceInToman,
      priceType: "sale" as const,
      propertyType: mappedType,
      city: scrapedData.data?.province || "تهران",
      district: districtName,
      address:
        mainEntity?.itemOffered?.address?.addressLocality ||
        scrapedData.data?.location ||
        "آدرس ثبت نشده",
      location: locationGeometry,
      area: areaValue,
      rooms: roomsValue,
      yearBuilt: 0,
      images: scrapedData.data?.images || [],
      status: "active" as const,
      isScraped: true,
      sourceUrl: scrapedData.url || scrapedData.sourceUrl,
      views: Math.floor(Math.random() * 150) + 10,
    };

    return await Property.findOneAndUpdate(
      { sourceUrl: cleanedProperty.sourceUrl },
      cleanedProperty,
      { upsert: true, new: true },
    );
  } catch (error) {
    console.error("خطا در پردازش انفرادی آگهی اسکرپ شده:", error);
    return null;
  }
};
