"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  categoryApi,
  Category as CategoryType,
} from "@/services/api/category.api";

// استفاده از آیکون‌های خطی و مدرن سری fa6
import {
  FaHouse,
  FaCar,
  FaMobileScreenButton,
  FaCouch,
  FaShirt,
  FaWrench,
  FaBriefcase,
  FaIndustry,
  FaTv,
  FaGamepad,
  FaBicycle,
  FaBookOpen,
  FaHeartPulse,
  FaBaby,
  FaPalette,
  FaUtensils,
  FaBoxOpen,
  FaGrip,
  FaChevronDown,
  FaChevronLeft,
  FaArrowLeft,
} from "react-icons/fa6";

interface CategoryMenuProps {
  onCategoryClick?: (slug: string) => void;
}

// 🔹 تابع هوشمند و هماهنگ‌شده نگاشت آیکون‌ها (قابل استفاده برای مگامنو و CategoryNav)
export const getCategoryIcon = (
  iconName?: string,
  className?: string,
  name?: string,
  slug?: string,
) => {
  // 🔹 تغییر رنگ پیش‌فرض به زغال‌سنگی تیره (zinc-800) و در حالت دارک مود به سفید مایل به خاکستری (zinc-100)
  const defaultClass = className || "w-5 h-5 text-zinc-800 dark:text-zinc-100";
  const props = { className: cn(defaultClass, "transition-colors shrink-0") };

  const identifier =
    `${iconName || ""} ${name || ""} ${slug || ""}`.toLowerCase();

  // ۱. املاک
  if (
    identifier.includes("home") ||
    identifier.includes("estate") ||
    identifier.includes("املاک") ||
    identifier.includes("خانه") ||
    identifier.includes("مسکن") ||
    identifier.includes("آپارتمان") ||
    identifier.includes("ویلا") ||
    identifier.includes("زمین") ||
    identifier.includes("باغ") ||
    identifier.includes("رهن") ||
    identifier.includes("اجاره") ||
    identifier.includes("فروش") ||
    identifier.includes("خرید") ||
    identifier.includes("پیش فروش") ||
    identifier.includes("مشاع")
  ) {
    return <FaHouse {...props} />;
  }

  // ۲. وسایل نقلیه
  if (
    identifier.includes("car") ||
    identifier.includes("خودرو") ||
    identifier.includes("وسایل نقلیه") ||
    identifier.includes("موتور") ||
    identifier.includes("سواری") ||
    identifier.includes("vehicle") ||
    identifier.includes("ماشین")
  ) {
    return <FaCar {...props} />;
  }

  // ۳. موبایل، تبلت و لوازم جانبی
  if (
    identifier.includes("smartphone") ||
    identifier.includes("mobile") ||
    identifier.includes("موبایل") ||
    identifier.includes("تلفن") ||
    identifier.includes("تبلت") ||
    identifier.includes("سیم کارت")
  ) {
    return <FaMobileScreenButton {...props} />;
  }

  // ۴. لوازم الکترونیکی (مانیتور و تلویزیون)
  if (
    identifier.includes("tv") ||
    identifier.includes("monitor") ||
    identifier.includes("صوتی") ||
    identifier.includes("تصویری") ||
    identifier.includes("تلویزیون") ||
    identifier.includes("مانیتور") ||
    identifier.includes("الکترونیکی") ||
    identifier.includes("دیجیتال") ||
    identifier.includes("کامپیوتر") ||
    identifier.includes("لپ تاپ")
  ) {
    return <FaTv {...props} />;
  }

  // ۵. لوازم خانگی و مبلمان
  if (
    identifier.includes("sofa") ||
    identifier.includes("couch") ||
    identifier.includes("لوازم خانگی") ||
    identifier.includes("مبلمان") ||
    identifier.includes("مبل") ||
    identifier.includes("فرش") ||
    identifier.includes("آشپزخانه") ||
    identifier.includes("دکوراسیون")
  ) {
    return <FaCouch {...props} />;
  }

  // ۶. لوازم شخصی، لباس و پوشاک
  if (
    identifier.includes("shirt") ||
    identifier.includes("cloth") ||
    identifier.includes("لباس") ||
    identifier.includes("پوشاک") ||
    identifier.includes("شخصی") ||
    identifier.includes("کفش") ||
    identifier.includes("ساعت") ||
    identifier.includes("آرایشی") ||
    identifier.includes("زیبایی")
  ) {
    return <FaShirt {...props} />;
  }

  // ۷. خدمات، کسب و کار و تعمیرات
  if (
    identifier.includes("wrench") ||
    identifier.includes("service") ||
    identifier.includes("ابزار") ||
    identifier.includes("خدمات") ||
    identifier.includes("تعمیرات") ||
    identifier.includes("پیشه") ||
    identifier.includes("کسب و کار")
  ) {
    return <FaWrench {...props} />;
  }

  // ۸. استخدام و کاریابی
  if (
    identifier.includes("briefcase") ||
    identifier.includes("job") ||
    identifier.includes("استخدام") ||
    identifier.includes("کاریابی") ||
    identifier.includes("شغل") ||
    identifier.includes("کیف")
  ) {
    return <FaBriefcase {...props} />;
  }

  // ۹. صنعتی، اداری و تجاری
  if (
    identifier.includes("factory") ||
    identifier.includes("industry") ||
    identifier.includes("صنعتی") ||
    identifier.includes("تجهیزات") ||
    identifier.includes("ماشین آلات") ||
    identifier.includes("تجاری") ||
    identifier.includes("اداری") ||
    identifier.includes("دستگاه")
  ) {
    return <FaIndustry {...props} />;
  }

  // ۱۰. ورزش، فرهنگ و فراغت
  if (
    identifier.includes("sport") ||
    identifier.includes("ورزش") ||
    identifier.includes("فراغت") ||
    identifier.includes("فرهنگ") ||
    identifier.includes("دوچرخه") ||
    identifier.includes("کتاب") ||
    identifier.includes("سرگرمی") ||
    identifier.includes("بازی")
  ) {
    return <FaBicycle {...props} />;
  }

  return <FaBoxOpen {...props} />;
};
export function CategoryMenu({ onCategoryClick }: CategoryMenuProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(
    null,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        const mainCategories = data.filter((cat) => !cat.parentId);
        setCategories(mainCategories);
        if (mainCategories.length > 0) {
          setActiveCategory(mainCategories[0]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (slug: string) => {
    if (onCategoryClick) {
      onCategoryClick(slug);
    } else {
      router.push(`/search?category=${slug}`);
    }
    setIsMenuOpen(false);
  };

  const handleSubcategoryClick = (slug: string) => {
    router.push(`/search?category=${slug}`);
    setIsMenuOpen(false);
  };

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 rounded-xl h-10 px-4 font-bold border-border/60 transition-all duration-300",
            "hover:bg-primary/5 hover:text-primary hover:border-primary/30",
            isMenuOpen &&
              "bg-primary/10 text-primary border-primary/30 shadow-sm",
          )}
        >
          <FaGrip
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-300",
              isMenuOpen && "scale-110",
            )}
          />
          <span>دسته‌بندی‌ها</span>
          <FaChevronDown
            className={cn(
              "w-3 h-3 opacity-75 transition-transform duration-300",
              isMenuOpen && "rotate-180",
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        className="w-[700px] p-0 rounded-2xl shadow-2xl mt-2 border-border/50 overflow-hidden bg-background/95 backdrop-blur-md animate-in fade-in-50 slide-in-from-top-2 duration-300"
        sideOffset={6}
      >
        {loading ? (
          <div className="flex justify-center items-center py-20 w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div
            className="flex h-[460px] divide-x divide-x-reverse divide-border/40"
            dir="rtl"
          >
            {/* ستون سمت راست: لیست دسته‌بندی‌های اصلی */}
            <div className="w-[280px] bg-muted/20 p-2 space-y-0.5 overflow-y-auto border-l border-border/40">
              {categories.map((category) => {
                const isActive = activeCategory?._id === category._id;
                return (
                  <button
                    key={category._id}
                    onMouseEnter={() => setActiveCategory(category)}
                    onClick={() => handleCategoryClick(category.slug)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-all duration-200 group relative",
                      isActive
                        ? "bg-background text-primary font-bold shadow-sm"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <span className="absolute right-0 top-2 bottom-2 w-1 bg-primary rounded-l-full" />
                    )}

                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground",
                      )}
                    >
                      {getCategoryIcon(
                        category.icon,
                        "w-4 h-4",
                        category.name,
                        category.slug,
                      )}
                    </div>

                    <span className="text-sm flex-1">{category.name}</span>

                    <FaChevronLeft
                      className={cn(
                        "w-2.5 h-2.5 opacity-40 transition-transform duration-300",
                        isActive
                          ? "opacity-100 text-primary -translate-x-0.5"
                          : "group-hover:translate-x-[-2px]",
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* ستون سمت چپ: نمایش زیردسته‌ها بر اساس بخش فعال */}
            <div className="flex-1 bg-background p-5 flex flex-col">
              {activeCategory && (
                <>
                  <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground/70">
                        زیردسته‌های
                      </span>
                      <h3 className="font-semibold text-sm text-foreground">
                        {activeCategory.name}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCategoryClick(activeCategory.slug)}
                      className="text-xs text-primary hover:text-primary/80 gap-1.5 rounded-lg h-8 px-2.5 hover:bg-primary/5 font-medium"
                    >
                      <span>همه آگهی‌ها</span>
                      <FaArrowLeft className="w-3 h-3 mt-0.5" />
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 pl-1">
                    {activeCategory.children &&
                    activeCategory.children.length > 0 ? (
                      <div className="grid grid-cols-1 gap-y-0.5">
                        {activeCategory.children.map((child) => (
                          <button
                            key={child._id}
                            onClick={() => handleSubcategoryClick(child.slug)}
                            className="text-right px-3 py-2 text-[13px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150 truncate"
                          >
                            • {child.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground/60">
                        <FaBoxOpen className="w-8 h-8 stroke-[1.5] mb-2" />
                        <p className="text-xs">
                          هیچ زیردسته‌ای برای این بخش ثبت نشده است.
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </>
              )}
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
