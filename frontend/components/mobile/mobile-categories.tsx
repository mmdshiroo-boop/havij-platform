"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import * as LucideIcons from "lucide-react";
import { categoryApi, Category } from "@/services/api/category.api";

export function MobileCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await categoryApi.getAll();
        // فقط دسته‌بندی‌های سطح اول (بدون parent) را برای منوی موبایل فیلتر می‌کنیم
        const rootCategories = data.filter((c) => !c.parentId);
        setCategories(rootCategories);
      } catch (error) {
        console.error("Error fetching mobile categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // تابع نمایش آیکون پویا
  const DynamicIcon = ({ name }: { name?: string }) => {
    const IconComponent =
      name && (LucideIcons as any)[name]
        ? (LucideIcons as any)[name]
        : LucideIcons.Package;
    return <IconComponent className="w-5 h-5 text-foreground/80" />;
  };

  if (loading) {
    return (
      <section className="w-full px-2 py-4 md:hidden">
        <div className="grid grid-cols-5 gap-y-4 gap-x-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="w-8 h-2 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-2 py-4 md:hidden">
      <div className="grid grid-cols-5 gap-y-4 gap-x-1">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/category/${cat.slug}`}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-muted/50 flex items-center justify-center transition-all hover:bg-primary/10">
              <DynamicIcon name={cat.icon} />
            </div>
            <span className="text-[9px] text-center font-bold text-muted-foreground truncate w-full px-1">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
