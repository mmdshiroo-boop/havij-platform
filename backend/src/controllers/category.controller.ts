import { Response } from "express";
import { Category } from "../models/Category.model";
import { Ad } from "../models/Ad.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

// ==================== تابع کمکی برای پیدا کردن همه زیردسته‌ها ====================
const findAllChildren = async (parentId: string): Promise<string[]> => {
  const children = await Category.find({ parentId });
  let allChildren: string[] = children.map((c) => c._id.toString());

  for (const child of children) {
    const grandChildren = await findAllChildren(child._id.toString());
    allChildren = [...allChildren, ...grandChildren];
  }

  return allChildren;
};

// ==================== دریافت همه دسته‌بندی‌ها ====================
export const getCategories = async (req: AuthRequest, res: Response) => {
  // ... (بدون تغییر)
  try {
    const categories = await Category.find()
      .sort({ level: 1, order: 1 })
      .lean();

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت دسته‌بندی‌ها" });
  }
};

// ==================== دریافت دسته‌بندی با آیدی ====================
export const getCategoryById = async (req: AuthRequest, res: Response) => {
  // ... (بدون تغییر)
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "دسته‌بندی یافت نشد" });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    console.error("Get category error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت دسته‌بندی" });
  }
};

// ==================== دریافت دسته‌بندی با اسلاگ (جدید) ====================
export const getCategoryBySlug = async (req: AuthRequest, res: Response) => {
  // ... (بدون تغییر)
  try {
    const { slug } = req.params;

    console.log("📂 Getting category by slug:", slug);

    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی یافت نشد",
      });
    }

    // دریافت زیردسته‌ها
    const subcategories = await Category.find({ parentId: category._id }).sort({
      order: 1,
    });

    // دریافت آگهی‌های این دسته‌بندی
    const ads = await Ad.find({
      category: category._id,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "firstName lastName");

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        subcategories,
        ads,
      },
    });
  } catch (error) {
    console.error("Get category by slug error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت دسته‌بندی",
    });
  }
};

// ==================== ایجاد دسته‌بندی جدید ====================
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, icon, parentId, order, isActive } = req.body;

    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "دسته‌بندی با این نام یا اسلاگ قبلاً وجود دارد",
      });
    }

    let level = 0;
    if (parentId) {
      const parent = await Category.findById(parentId);
      if (parent) {
        level = parent.level + 1;
      }
    }

    const category = new Category({
      name,
      slug: slug || name.replace(/\s+/g, "-").toLowerCase(),
      icon: icon || "Package",
      parentId: parentId || null,
      level,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await category.save();

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM, // می‌توانید CATEGORY_CREATED به Enum اضافه کنید
      resource: "Category",
      resourceId: category._id.toString(),
      description: `ادمین ${req.user?.firstName || req.user?.phone} دسته‌بندی "${category.name}" را ایجاد کرد.`,
      req,
    });

    res.status(201).json({
      success: true,
      data: category,
      message: "دسته‌بندی با موفقیت ایجاد شد",
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ success: false, message: "خطا در ایجاد دسته‌بندی" });
  }
};

// ==================== ویرایش دسته‌بندی ====================
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, icon, parentId, order, isActive } = req.body;
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "دسته‌بندی یافت نشد" });
    }

    // بررسی تکراری نبودن برای دسته‌بندی دیگر
    if (name || slug) {
      const existingCategory = await Category.findOne({
        $or: [{ name }, { slug }],
        _id: { $ne: id },
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "دسته‌بندی با این نام یا اسلاگ قبلاً وجود دارد",
        });
      }
    }

    let level = 0;
    if (parentId) {
      const parent = await Category.findById(parentId);
      if (parent) {
        level = parent.level + 1;
      }
    }

    const oldName = category.name;

    category.name = name || category.name;
    category.slug = slug || category.slug;
    category.icon = icon || category.icon;
    category.parentId = parentId || null;
    category.level = level;
    category.order = order !== undefined ? order : category.order;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    await category.save();

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM, // می‌توانید CATEGORY_UPDATED به Enum اضافه کنید
      resource: "Category",
      resourceId: category._id.toString(),
      description: `ادمین ${req.user?.firstName || req.user?.phone} دسته‌بندی "${oldName}" را ویرایش کرد.`,
      metadata: { changes: req.body },
      req,
    });

    res.json({
      success: true,
      data: category,
      message: "دسته‌بندی با موفقیت ویرایش شد",
    });
  } catch (error) {
    console.error("Update category error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در ویرایش دسته‌بندی" });
  }
};

// ==================== حذف دسته‌بندی (ساده) ====================
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Deleting category:", id);

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی یافت نشد",
      });
    }

    // بررسی وجود زیردسته‌ها
    const children = await Category.find({ parentId: id });
    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        message: `این دسته‌بندی دارای ${children.length} زیردسته است. ابتدا زیردسته‌ها را حذف کنید.`,
        children: children.map((c) => ({ id: c._id, name: c.name })),
      });
    }

    // بررسی وجود آگهی‌های مرتبط
    const adsWithCategory = await Ad.countDocuments({ category: id });
    if (adsWithCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `این دسته‌بندی در ${adsWithCategory} آگهی استفاده شده است. ابتدا آگهی‌ها را به دسته دیگری منتقل کنید.`,
        adsCount: adsWithCategory,
      });
    }

    await Category.findByIdAndDelete(id);

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM, // می‌توانید CATEGORY_DELETED به Enum اضافه کنید
      resource: "Category",
      resourceId: id,
      description: `ادمین ${req.user?.firstName || req.user?.phone} دسته‌بندی "${category.name}" را حذف کرد.`,
      req,
    });

    res.json({
      success: true,
      message: "دسته‌بندی با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در حذف دسته‌بندی",
    });
  }
};

// ==================== حذف دسته‌بندی همراه با زیردسته‌ها ====================
export const deleteCategoryWithChildren = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const id = req.params.id as string;

    console.log("🗑️ Deleting category with children:", id);

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی یافت نشد",
      });
    }

    // پیدا کردن همه زیردسته‌ها
    const allChildrenIds = await findAllChildren(id);
    const allIdsToDelete = [id, ...allChildrenIds];

    // بررسی آگهی‌های مرتبط
    const adsWithCategories = await Ad.countDocuments({
      category: { $in: allIdsToDelete },
    });

    if (adsWithCategories > 0) {
      return res.status(400).json({
        success: false,
        message: `این دسته‌بندی و زیردسته‌های آن در ${adsWithCategories} آگهی استفاده شده است. ابتدا آگهی‌ها را به دسته دیگری منتقل کنید.`,
        adsCount: adsWithCategories,
      });
    }

    // حذف همه دسته‌بندی‌ها
    await Category.deleteMany({ _id: { $in: allIdsToDelete } });

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Category",
      resourceId: id,
      description: `ادمین ${req.user?.firstName || req.user?.phone} دسته‌بندی "${category.name}" را به‌همراه ${allChildrenIds.length} زیردسته حذف کرد.`,
      req,
    });

    res.json({
      success: true,
      message: `دسته‌بندی و ${allChildrenIds.length} زیردسته آن با موفقیت حذف شد`,
    });
  } catch (error) {
    console.error("Delete category with children error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در حذف دسته‌بندی",
    });
  }
};
