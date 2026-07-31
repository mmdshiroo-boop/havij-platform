"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryApi, Category } from "@/services/api/category.api";
import { CreateAdData } from "@/services/api/ads.api";
import { Textarea } from "../ui/textarea";
import {
  ChevronLeft,
  FileText,
  Tag,
  Banknote,
  Layers,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BasicInfoStepProps {
  data: Partial<CreateAdData>;
  updateData: (data: Partial<CreateAdData>) => void;
  onNext: () => void;
}

export function BasicInfoStep({
  data,
  updateData,
  onNext,
}: BasicInfoStepProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch((err) => console.error("Error categories:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (value: number | undefined) => {
    if (!value) return "";
    return new Intl.NumberFormat("fa-IR").format(value);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.title?.trim())
      newErrors.title = "وارد کردن عنوان آگهی الزامی است";
    else if (data.title.length < 5)
      newErrors.title = "عنوان باید حداقل ۵ کاراکتر باشد";

    if (!data.categoryId) newErrors.categoryId = "انتخاب دسته‌بندی الزامی است";

    if (data.priceType !== "negotiable") {
      if (!data.price || data.price <= 0)
        newErrors.price = "قیمت معتبر وارد کنید";
    }

    if (!data.description?.trim()) newErrors.description = "توضیحات الزامی است";
    else if (data.description.length < 20)
      newErrors.description = "توضیحات حداقل ۲۰ کاراکتر باشد";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const isDescriptionValid = (data.description?.length || 0) >= 20;

  return (
    <div className="space-y-6" dir="rtl">
      {/* عنوان */}
      <div className="space-y-1.5">
        <Label
          htmlFor="title"
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
          عنوان آگهی <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="مثال: گوشی آیفون ۱۳ پرومکس ۲۵۶ گیگ / استخدام برنامه‌نویس وب"
          value={data.title || ""}
          onChange={(e) => updateData({ title: e.target.value })}
          className="h-11 rounded-xl text-xs sm:text-sm"
        />
        {errors.title && (
          <p className="text-xs font-bold text-destructive flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.title}
          </p>
        )}
      </div>

      {/* دسته‌بندی و نوع معامله */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            دسته‌بندی <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.categoryId || ""}
            onValueChange={(val) => updateData({ categoryId: val })}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background border-border font-semibold text-xs sm:text-sm">
              <SelectValue placeholder="انتخاب دسته‌بندی" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60 overflow-y-auto">
              {loading ? (
                <SelectItem value="loading" disabled>
                  در حال دریافت...
                </SelectItem>
              ) : (
                categories.map((cat) => (
                  <SelectItem
                    key={cat._id}
                    value={cat._id}
                    className="rounded-lg text-xs sm:text-sm"
                  >
                    {cat.parentId ? `ــ ${cat.name}` : `• ${cat.name}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-xs font-bold text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.categoryId}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            نوع آگهی / معامله <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.adType || "sale"}
            onValueChange={(val: any) => updateData({ adType: val })}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background border-border font-semibold text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="sale">ارائه / فروش</SelectItem>
              <SelectItem value="rent">رهن و اجاره</SelectItem>
              <SelectItem value="daily_rent">اجاره روزانه</SelectItem>
              <SelectItem value="exchange">معاوضه</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* قیمت */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold flex items-center gap-1.5">
          <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
          قیمت / حقوق (تومان) <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Input
              type="number"
              placeholder="مثال: ۱۲۵۰۰۰۰۰"
              value={data.price || ""}
              disabled={data.priceType === "negotiable"}
              onChange={(e) =>
                updateData({ price: parseInt(e.target.value) || 0 })
              }
              className="h-11 rounded-xl font-mono text-left pl-12"
              dir="ltr"
            />
            {data.priceType !== "negotiable" && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                تومان
              </span>
            )}
          </div>

          <Select
            value={data.priceType || "fixed"}
            onValueChange={(val: any) => {
              if (val === "negotiable")
                updateData({ priceType: val, price: 0 });
              else updateData({ priceType: val });
            }}
          >
            <SelectTrigger className="w-[120px] sm:w-[140px] h-11 rounded-xl bg-background font-semibold text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="fixed">قیمت مقطوع</SelectItem>
              <SelectItem value="negotiable">توافقی</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.price && data.price > 0 && data.priceType !== "negotiable" ? (
          <p className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-lg w-fit mt-1">
            مبلغ: {formatPrice(data.price)} تومان
          </p>
        ) : null}

        {errors.price && data.priceType !== "negotiable" && (
          <p className="text-xs font-bold text-destructive flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.price}
          </p>
        )}
      </div>

      {/* توضیحات */}
      <div className="space-y-1.5">
        <Label
          htmlFor="description"
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          توضیحات تکمیلی <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="شرح دقیق کالا، خدمات یا ویژگی‌ها..."
          value={data.description || ""}
          onChange={(e) => updateData({ description: e.target.value })}
          rows={4}
          className="rounded-xl resize-none leading-relaxed text-xs sm:text-sm"
        />
        <div className="flex justify-between items-center px-1">
          {errors.description && (
            <p className="text-xs font-bold text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.description}
            </p>
          )}
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-md ml-auto",
              isDescriptionValid
                ? "text-emerald-600 bg-emerald-500/10"
                : "text-amber-600 bg-amber-500/10",
            )}
          >
            {data.description?.length || 0} / ۲۰ کاراکتر
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border/40">
        <Button
          onClick={handleNext}
          className="gap-2 rounded-xl h-10 px-6 text-xs font-bold bg-primary"
        >
          ادامه مراحل
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
