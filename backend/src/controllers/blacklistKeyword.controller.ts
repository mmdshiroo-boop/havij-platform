import { Request, Response } from "express";
import { BlacklistKeyword } from "../models/BlacklistKeyword.model";
import { AuthRequest } from "../middleware/auth.middleware";

// دریافت همهٔ کلمات
export const getKeywords = async (req: Request, res: Response) => {
  try {
    const { category, isActive, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    if (category && category !== "all") filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const [keywords, total] = await Promise.all([
      BlacklistKeyword.find(filter)
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .lean(),
      BlacklistKeyword.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: keywords,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در دریافت کلمات" });
  }
};

// افزودن کلمه جدید
export const addKeyword = async (req: AuthRequest, res: Response) => {
  try {
    const { word, category, severity } = req.body;
    if (!word)
      return res
        .status(400)
        .json({ success: false, message: "کلمه الزامی است" });

    const exists = await BlacklistKeyword.findOne({
      word: word.toLowerCase().trim(),
    });
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "این کلمه قبلاً ثبت شده است" });

    const keyword = await BlacklistKeyword.create({
      word: word.toLowerCase().trim(),
      category: category || "سایر",
      severity: severity || "medium",
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: keyword });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در افزودن کلمه" });
  }
};

// حذف کلمه
export const deleteKeyword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await BlacklistKeyword.findByIdAndDelete(id);
    res.json({ success: true, message: "کلمه حذف شد" });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در حذف کلمه" });
  }
};

// تغییر وضعیت فعال/غیرفعال
export const toggleKeyword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const keyword = await BlacklistKeyword.findById(id);
    if (!keyword)
      return res.status(404).json({ success: false, message: "کلمه یافت نشد" });

    keyword.isActive = !keyword.isActive;
    await keyword.save();
    res.json({ success: true, data: keyword });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در تغییر وضعیت" });
  }
};
