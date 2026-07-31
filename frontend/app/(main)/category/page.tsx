"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Search,
  Package,
  Grid3X3,
} from "lucide-react";
import * as LucideIcons from "lucide-react"; // وارد کردن تمام آیکون‌ها برای استفاده پویا
import { categoryApi, Category } from "@/services/api/category.api";

// تایپ برای گره‌های درخت
type TreeNode = Category & { children: TreeNode[] };

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await categoryApi.getAll();
        setCategories(data);
      } catch (err) {
        console.error("Fetch categories error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // تابع پویا برای دریافت آیکون از نام آن در دیتابیس
  const getIcon = (cat: Category) => {
    if (cat.icon && (LucideIcons as any)[cat.icon]) {
      const IconComponent = (LucideIcons as any)[cat.icon];
      return <IconComponent className="w-5 h-5" />;
    }
    // آیکون پیش‌فرض اگر آیکون موجود نبود یا اشتباه بود
    return <Package className="w-5 h-5" />;
  };

  // ساخت درخت
  const buildTree = (list: Category[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];
    list.forEach((cat) => map.set(cat._id, { ...cat, children: [] }));
    list.forEach((cat) => {
      const node = map.get(cat._id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else if (!cat.parentId) {
        roots.push(node);
      }
    });
    return roots;
  };

  const tree = buildTree(categories);

  // فیلتر جستجو
  const filterTree = (items: TreeNode[]): TreeNode[] => {
    if (!search.trim()) return items;
    const lowered = search.toLowerCase();
    return items
      .map(
        (item): TreeNode => ({
          ...item,
          children: filterTree(item.children),
        }),
      )
      .filter(
        (item) =>
          item.name.toLowerCase().includes(lowered) || item.children.length > 0,
      );
  };

  const filteredTree = filterTree(tree);
  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderCategory = (cat: TreeNode, depth = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expanded[cat._id];

    return (
      <motion.div
        key={cat._id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: depth * 0.03 }}
        style={{ marginRight: depth * 20 }}
      >
        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
            isExpanded
              ? "bg-primary/5 border border-primary/20 shadow-sm"
              : "hover:bg-muted/40 border border-transparent"
          }`}
          onClick={() => hasChildren && toggleExpand(cat._id)}
        >
          {hasChildren && (
            <motion.span
              animate={{ rotate: isExpanded ? 0 : -90 }}
              className="shrink-0 text-muted-foreground"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          )}

          <Link
            href={`/category/${cat.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3 flex-1 min-w-0 group"
          >
            <span
              className={`shrink-0 p-1.5 rounded-lg transition-all ${
                isExpanded
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
              }`}
            >
              {getIcon(cat)}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold truncate block group-hover:text-primary transition-colors">
                {cat.name}
              </span>
              {hasChildren && (
                <span className="text-[10px] text-muted-foreground">
                  {cat.children?.length} زیردسته
                </span>
              )}
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </Link>
        </div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="border-r-2 border-primary/20 pr-2 overflow-hidden"
            >
              {cat.children!.map((child: TreeNode) =>
                renderCategory(child, depth + 1),
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6" dir="rtl">
        <Skeleton className="h-12 w-56 mx-auto rounded-2xl" />
        <Skeleton className="h-10 w-full max-w-md mx-auto rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center" dir="rtl">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4 opacity-60" />
        <h2 className="text-2xl font-bold mb-2">خطا در دریافت دسته‌بندی‌ها</h2>
        <p className="text-muted-foreground">لطفاً بعداً دوباره تلاش کنید.</p>
      </div>
    );
  }

  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
          <Grid3X3 className="w-4 h-4" />
          مرور دسته‌بندی‌ها
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          همهٔ دسته‌بندی‌ها
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          دسته‌بندی مورد نظر خود را انتخاب کنید و آگهی‌های مرتبط را ببینید.
        </p>
      </motion.div>

      <div className="relative max-w-md mx-auto">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Search className="w-5 h-5 text-primary/60" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در دسته‌بندی‌ها..."
          className="w-full pr-12 pl-4 py-3 rounded-2xl border-2 border-border/60 bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/10 text-sm font-bold transition-all placeholder:text-muted-foreground/50"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <Card className="border-0 shadow-xl shadow-primary/5 bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {filteredTree.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-bold text-lg">هیچ دسته‌بندی یافت نشد.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTree.map((cat) => renderCategory(cat))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground/60">
        دسته‌بندی‌ها به‌صورت سلسله‌مراتبی نمایش داده شده‌اند. روی هر کدام کلیک
        کنید تا آگهی‌هایش را ببینید.
      </p>
    </div>
  );
}
