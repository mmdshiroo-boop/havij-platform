// app/admin/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FolderTree,
  Layers,
  Hash,
  Image,
  ChevronRight,
  ChevronDown,
  Search,
  Save,
  X,
  AlertTriangle,
  Home,
  Car,
  Smartphone,
  Sofa,
  Shirt,
  Wrench,
  Briefcase,
  Factory,
  Package,
  Menu,
  Grid3x3,
  List,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api/client";

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string;
  level: number;
  order: number;
  isActive: boolean;
  children?: Category[];
  createdAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  icon: string;
  parentId: string;
  order: number;
  isActive: boolean;
}

const iconOptions = [
  { value: "Home", label: "خانه", icon: Home },
  { value: "Car", label: "ماشین", icon: Car },
  { value: "Smartphone", label: "موبایل", icon: Smartphone },
  { value: "Sofa", label: "مبل", icon: Sofa },
  { value: "Shirt", label: "لباس", icon: Shirt },
  { value: "Wrench", label: "ابزار", icon: Wrench },
  { value: "Briefcase", label: "کیف", icon: Briefcase },
  { value: "Factory", label: "کارخانه", icon: Factory },
  { value: "Package", label: "بسته", icon: Package },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [selectedMobileCategory, setSelectedMobileCategory] =
    useState<Category | null>(null);

  // مودال‌ها
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    icon: "Package",
    parentId: "",
    order: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
    // بررسی viewMode از localStorage
    const savedMode = localStorage.getItem("categoriesViewMode");
    if (savedMode === "grid" || savedMode === "table") {
      setViewMode(savedMode);
    }
  }, []);

  // ذخیره viewMode در localStorage
  useEffect(() => {
    localStorage.setItem("categoriesViewMode", viewMode);
  }, [viewMode]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/categories");
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("خطا در دریافت دسته‌بندی‌ها");
    } finally {
      setLoading(false);
    }
  };

  // تبدیل به ساختار درختی
  const buildCategoryTree = (
    items: Category[],
    parentId: string | null = null,
  ): Category[] => {
    const result: Category[] = [];
    for (const item of items) {
      if (item.parentId === parentId || (parentId === null && !item.parentId)) {
        const children = buildCategoryTree(items, item._id);
        result.push({ ...item, children });
      }
    }
    return result.sort((a, b) => a.order - b.order);
  };

  const categoryTree = buildCategoryTree(categories);

  // فیلتر بر اساس جستجو
  const filterCategories = (items: Category[]): Category[] => {
    if (!search) return items;
    return items
      .map((item) => ({
        ...item,
        children: filterCategories(item.children || []),
      }))
      .filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.children && item.children.length > 0),
      );
  };

  const filteredCategories = filterCategories(categoryTree);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getIconComponent = (iconName?: string) => {
    const icon = iconOptions.find((i) => i.value === iconName);
    if (icon) {
      const IconComponent = icon.icon;
      return <IconComponent className="w-5 h-5" />;
    }
    return <Package className="w-5 h-5" />;
  };

  // رندر درخت در حالت جدول
  const renderCategoryRow = (category: Category, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedItems.has(category._id);

    return (
      <React.Fragment key={category._id}>
        <TableRow className="border-b hover:bg-muted/30 transition-colors">
          <TableCell className="py-3">
            <div
              className="flex items-center gap-2 flex-wrap"
              style={{ paddingRight: depth * 20 }}
            >
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(category._id)}
                  className="p-1 hover:bg-muted rounded-md transition-colors shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6 shrink-0" />}
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {getIconComponent(category.icon)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm md:text-base truncate">
                  {category.name}
                </p>
                <p className="text-xs text-muted-foreground dir-ltr truncate hidden sm:block">
                  {category.slug}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Badge
              variant={category.isActive ? "default" : "secondary"}
              className={category.isActive ? "bg-emerald-500" : ""}
            >
              {category.isActive ? "فعال" : "غیرفعال"}
            </Badge>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            {category.level === 0
              ? "دسته اصلی"
              : `زیردسته سطح ${category.level}`}
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            {category.order}
          </TableCell>
          <TableCell className="hidden xl:table-cell text-sm dir-ltr">
            {new Date(category.createdAt).toLocaleDateString("fa-IR")}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(category)}>
                  <Edit className="ml-2 h-4 w-4" />
                  ویرایش
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCategory(category);
                    setDeleteDialogOpen(true);
                  }}
                  className="text-red-500"
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && (
          <>
            {category.children!.map((child) =>
              renderCategoryRow(child, depth + 1),
            )}
          </>
        )}
      </React.Fragment>
    );
  };

  // رندر کارت‌ها در حالت گرید (برای موبایل و تبلت)
  const renderCategoryCard = (category: Category, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedItems.has(category._id);

    return (
      <React.Fragment key={category._id}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all"
          style={{ marginRight: depth * 16 }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {getIconComponent(category.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-base truncate">
                      {category.name}
                    </p>
                    <Badge
                      variant={category.isActive ? "default" : "secondary"}
                      className={
                        category.isActive ? "bg-emerald-500 text-xs" : "text-xs"
                      }
                    >
                      {category.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 dir-ltr truncate">
                    {category.slug}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>
                      {category.level === 0
                        ? "دسته اصلی"
                        : `سطح ${category.level}`}
                    </span>
                    <span>•</span>
                    <span>ترتیب: {category.order}</span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(category)}>
                    <Edit className="ml-2 h-4 w-4" />
                    ویرایش
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCategory(category);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {hasChildren && (
              <div className="mt-3 pt-3 border-t">
                <button
                  onClick={() => toggleExpand(category._id)}
                  className="flex items-center gap-1 text-sm text-primary font-medium"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  {isExpanded
                    ? "بستن زیردسته‌ها"
                    : `نمایش زیردسته‌ها (${category.children!.length})`}
                </button>
              </div>
            )}
          </div>
        </motion.div>
        {hasChildren && isExpanded && (
          <div className="space-y-2 mr-4 md:mr-6 mt-2">
            {category.children!.map((child) =>
              renderCategoryCard(child, depth + 1),
            )}
          </div>
        )}
      </React.Fragment>
    );
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      icon: "Package",
      parentId: "",
      order: 0,
      isActive: true,
    });
    setFormDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || "Package",
      parentId: category.parentId || "",
      order: category.order,
      isActive: category.isActive,
    });
    setFormDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .replace(/[^\w\u0600-\u06FF\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("نام دسته‌بندی الزامی است");
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
      };

      if (editingCategory) {
        await apiClient.put(`/categories/${editingCategory._id}`, submitData);
        toast.success("دسته‌بندی با موفقیت ویرایش شد");
      } else {
        await apiClient.post("/categories", submitData);
        toast.success("دسته‌بندی با موفقیت ایجاد شد");
      }
      setFormDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.response?.data?.message || "خطا در ذخیره دسته‌بندی");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      const hasChildren = categories.some(
        (c) => c.parentId === selectedCategory._id,
      );

      if (hasChildren) {
        await apiClient.delete(
          `/categories/${selectedCategory._id}/with-children`,
        );
      } else {
        await apiClient.delete(`/categories/${selectedCategory._id}`);
      }

      toast.success("دسته‌بندی با موفقیت حذف شد");
      setDeleteDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.response?.data?.message || "خطا در حذف دسته‌بندی");
    } finally {
      setSubmitting(false);
    }
  };

  const parentCategories = categories.filter((c) => c.level === 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر - ریسپانسیو */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            مدیریت دسته‌بندی‌ها
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            مدیریت دسته‌بندی‌ها و زیردسته‌های سایت
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* دکمه تغییر view mode */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="نمایش جدولی"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="نمایش کارتی"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handleAdd}
            className="gap-2 rounded-full text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">دسته‌بندی جدید</span>
            <span className="sm:hidden">جدید</span>
          </Button>
        </div>
      </div>

      {/* فیلتر جستجو */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو در دسته‌بندی‌ها..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* نمایش محتوا بر اساس view mode */}
      {viewMode === "table" ? (
        /* حالت جدول - برای دسکتاپ */
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[300px] sm:w-[350px] md:w-[400px]">
                    نام دسته‌بندی
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">وضعیت</TableHead>
                  <TableHead className="hidden md:table-cell">نوع</TableHead>
                  <TableHead className="hidden lg:table-cell">ترتیب</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    تاریخ ایجاد
                  </TableHead>
                  <TableHead className="w-[80px]">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>هیچ دسته‌بندی یافت نشد</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) =>
                      renderCategoryRow(category),
                    )
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        /* حالت گرید - برای موبایل و تبلت */
        <div className="space-y-2">
          {filteredCategories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12 text-muted-foreground">
                <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>هیچ دسته‌بندی یافت نشد</p>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => renderCategoryCard(category))
          )}
        </div>
      )}

      {/* مودال افزودن/ویرایش دسته‌بندی - ریسپانسیو */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg rounded-xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingCategory ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingCategory
                ? "اطلاعات دسته‌بندی را ویرایش کنید"
                : "اطلاعات دسته‌بندی جدید را وارد کنید"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">نام دسته‌بندی *</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (!editingCategory && !formData.slug) {
                    setFormData({
                      ...formData,
                      slug: generateSlug(e.target.value),
                    });
                  }
                }}
                placeholder="مثال: املاک"
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">اسلاگ (slug)</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="real-estate"
                dir="ltr"
                className="text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">
                در صورت خالی بودن، به صورت خودکار از نام ساخته می‌شود
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">آیکون</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) =>
                  setFormData({ ...formData, icon: value })
                }
              >
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="انتخاب آیکون" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((icon) => {
                    const IconComponent = icon.icon;
                    return (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">دسته والد</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parentId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="بدون والد (دسته اصلی)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون والد (دسته اصلی)</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">ترتیب نمایش</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="text-sm sm:text-base"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label
                htmlFor="isActive"
                className="cursor-pointer text-sm sm:text-base"
              >
                فعال
              </Label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 w-full sm:w-auto"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingCategory ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ حذف - ریسپانسیو */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">
              حذف دسته‌بندی
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              آیا از حذف دسته‌بندی "{selectedCategory?.name}" اطمینان دارید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-3 sm:p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-semibold">هشدار!</span>
            </div>
            <p className="text-xs sm:text-sm text-red-600/80 mt-1">
              با حذف این دسته‌بندی، تمام زیردسته‌های آن نیز حذف خواهند شد.
              آگهی‌های مرتبط با این دسته‌بندی به "متفرقه" منتقل می‌شوند.
            </p>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
              disabled={submitting}
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// React import for JSX
import React from "react";import { Skeleton } from "@/components/ui/skeleton";

