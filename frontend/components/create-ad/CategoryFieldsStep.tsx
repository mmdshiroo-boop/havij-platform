"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Ruler,
  Building2,
  Car,
  Briefcase,
  Smartphone,
  PlusCircle,
  Trash2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface CategoryFieldsStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  categorySlug?: string;
}

export function CategoryFieldsStep({
  data,
  updateData,
  onNext,
  onBack,
  categorySlug = "",
}: CategoryFieldsStepProps) {
  const [newPropName, setNewPropName] = useState("");
  const [newPropValue, setNewPropValue] = useState("");

  const handleNumberChange = (key: string, value: string) => {
    const num = value === "" ? undefined : Number(value);
    updateData({ [key]: num && !isNaN(num) ? num : undefined });
  };

  const toggleAmenity = (key: string) => {
    const current = data.amenities?.[key] ?? false;
    updateData({
      amenities: { ...data.amenities, [key]: !current },
    });
  };

  const addProperty = () => {
    if (!newPropName.trim() || !newPropValue.trim()) return;
    const newProp = {
      name: newPropName.trim(),
      value: newPropValue.trim(),
    };
    updateData({
      additionalProperties: [...(data.additionalProperties || []), newProp],
    });
    setNewPropName("");
    setNewPropValue("");
  };

  const removeProperty = (index: number) => {
    const updated = [...(data.additionalProperties || [])];
    updated.splice(index, 1);
    updateData({ additionalProperties: updated });
  };

  // تشخیص گروه دسته‌بندی از روی Slug
  const isRealEstate = [
    "apartment-for-sale",
    "apartment-for-rent",
    "villa-for-sale",
    "real-estate",
  ].some((s) => categorySlug.includes(s));

  const isVehicle = ["cars", "sedan", "motorcycle", "vehicles"].some((s) =>
    categorySlug.includes(s),
  );

  const isJob = ["jobs", "programming", "marketing", "employment"].some((s) =>
    categorySlug.includes(s),
  );

  const isGoods = [
    "electronics",
    "mobile-phones",
    "laptops",
    "home-appliances",
  ].some((s) => categorySlug.includes(s));

  return (
    <div className="space-y-8" dir="rtl">
      {/* 🟢 ۱. فرم اختصاصی املاک */}
      {isRealEstate && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b pb-2 border-border/40">
              <Ruler className="w-4 h-4 text-primary" />
              مشخصات فیزیکی ملک
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">متراژ (متر مربع)</Label>
                <Input
                  type="number"
                  placeholder="مثال: ۸۵"
                  value={data.area ?? ""}
                  onChange={(e) => handleNumberChange("area", e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">تعداد اتاق</Label>
                <Input
                  type="number"
                  placeholder="مثال: ۲"
                  value={data.rooms ?? ""}
                  onChange={(e) => handleNumberChange("rooms", e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">سال ساخت</Label>
                <Input
                  type="number"
                  placeholder="مثال: ۱۴۰۰"
                  value={data.yearBuilt ?? ""}
                  onChange={(e) =>
                    handleNumberChange("yearBuilt", e.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">تعداد پارکینگ</Label>
                <Input
                  type="number"
                  placeholder="مثال: ۱"
                  value={data.parkingCount ?? ""}
                  onChange={(e) =>
                    handleNumberChange("parkingCount", e.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b pb-2 border-border/40">
              <Building2 className="w-4 h-4 text-primary" />
              امکانات رفاهی ملک
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: "parking", label: "پارکینگ" },
                { id: "elevator", label: "آسانسور" },
                { id: "storage", label: "انباری" },
                { id: "balcony", label: "بالکن" },
                { id: "pool", label: "استخر" },
                { id: "sauna", label: "سونا و جکوزی" },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background"
                >
                  <Label className="text-xs font-semibold cursor-pointer">
                    {item.label}
                  </Label>
                  <Switch
                    checked={data.amenities?.[item.id] ?? false}
                    onCheckedChange={() => toggleAmenity(item.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔴 ۲. فرم اختصاصی خودرو و موتورسیکلت */}
      {isVehicle && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b pb-2 border-border/40">
              <Car className="w-4 h-4 text-primary" />
              مشخصات فنی وسیله نقلیه
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">برند و مدل</Label>
                <Input
                  placeholder="مثال: پژو ۲۰۶ تیپ ۵"
                  value={data.brand || ""}
                  onChange={(e) => updateData({ brand: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">سال تولید (شمسی)</Label>
                <Input
                  type="number"
                  placeholder="مثال: ۱۳۹۹"
                  value={data.yearBuilt ?? ""}
                  onChange={(e) =>
                    handleNumberChange("yearBuilt", e.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  میزان کارکرد (کیلومتر)
                </Label>
                <Input
                  type="number"
                  placeholder="مثال: ۴۵۰۰۰"
                  value={data.usageKilometers ?? ""}
                  onChange={(e) =>
                    handleNumberChange("usageKilometers", e.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">رنگ بدنه</Label>
                <Input
                  placeholder="مثال: سفید، مشکی متالیک"
                  value={data.color || ""}
                  onChange={(e) => updateData({ color: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">وضعیت بدنه</Label>
                <Select
                  value={data.bodyStatus || "healthy"}
                  onValueChange={(val) => updateData({ bodyStatus: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="healthy">بدون رنگ / سالم</SelectItem>
                    <SelectItem value="some_paint">چند لکه رنگ</SelectItem>
                    <SelectItem value="full_paint">دور رنگ</SelectItem>
                    <SelectItem value="accident">
                      تصادفی / نیاز به تعمیر
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">نوع سوخت</Label>
                <Select
                  value={data.fuelType || "gasoline"}
                  onValueChange={(val) => updateData({ fuelType: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="نوع سوخت" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="gasoline">بنزینی</SelectItem>
                    <SelectItem value="dual">دوگانه سوز</SelectItem>
                    <SelectItem value="diesel">دیزلی</SelectItem>
                    <SelectItem value="electric">برقی / هیبرید</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔵 ۳. فرم اختصاصی استخدام و کاریابی */}
      {isJob && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b pb-2 border-border/40">
              <Briefcase className="w-4 h-4 text-primary" />
              شرایط فرصت شغلی
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">سمت / عنوان شغلی</Label>
                <Input
                  placeholder="مثال: برنامه‌نویس React / مدیر فروش"
                  value={data.jobTitle || ""}
                  onChange={(e) => updateData({ jobTitle: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">نوع همکاری</Label>
                <Select
                  value={data.cooperationType || "full_time"}
                  onValueChange={(val) => updateData({ cooperationType: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="نوع همکاری" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="full_time">تمام وقت</SelectItem>
                    <SelectItem value="part_time">پاره وقت</SelectItem>
                    <SelectItem value="remote">دورکاری / پروژه ای</SelectItem>

                    <SelectItem value="internship">کارآموزی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  حداقل سابقه کار (سال)
                </Label>
                <Input
                  type="number"
                  placeholder="مثال: ۲"
                  value={data.minExperience ?? ""}
                  onChange={(e) =>
                    handleNumberChange("minExperience", e.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">وضعیت بیمه</Label>
                <Select
                  value={data.hasInsurance ? "yes" : "no"}
                  onValueChange={(val) =>
                    updateData({ hasInsurance: val === "yes" })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="دارد / ندارد" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="yes">دارد (از روز اول)</SelectItem>
                    <SelectItem value="no">ندارد / توافقی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">جنسیت مورد نیاز</Label>
                <Select
                  value={data.genderRequirement || "no_matter"}
                  onValueChange={(val) =>
                    updateData({ genderRequirement: val })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="جنسیت" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="no_matter">مهم نیست</SelectItem>
                    <SelectItem value="male">آقا</SelectItem>
                    <SelectItem value="female">خانم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟡 ۴. فرم اختصاصی لوازم خانگی و الکترونیک */}
      {isGoods && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b pb-2 border-border/40">
              <Smartphone className="w-4 h-4 text-primary" />
              مشخصات و وضعیت کالا
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">برند / شرکت سازنده</Label>
                <Input
                  placeholder="مثال: سامسونگ، اپل، ال‌جی"
                  value={data.brand || ""}
                  onChange={(e) => updateData({ brand: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">وضعیت سلامت کالا</Label>
                <Select
                  value={data.itemCondition || "like_new"}
                  onValueChange={(val) => updateData({ itemCondition: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="new">نو (پلمپ / آکبند)</SelectItem>
                    <SelectItem value="like_new">
                      در حد نو (بسیار تمیز)
                    </SelectItem>
                    <SelectItem value="used">دست دوم / کارکرده</SelectItem>
                    <SelectItem value="for_parts">
                      نیازمند تعمیر / اوراقی
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ضمانت / گارانتی</Label>
                <Select
                  value={data.hasWarranty ? "yes" : "no"}
                  onValueChange={(val) =>
                    updateData({ hasWarranty: val === "yes" })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="وضعیت گارانتی" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="yes">دارد (شرکتی)</SelectItem>
                    <SelectItem value="no">ندارد / مهلت تست شخصی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚪ ۵. اگر هیچ کدام نبود (ویژگی‌های عمومی سفارشی) */}
      {!isRealEstate && !isVehicle && !isJob && !isGoods && (
        <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-xs font-bold text-foreground">
            ویژگی اختصاصی برای این دسته‌بندی یافت نشد. می‌توانید مشخصات تکمیلی
            را در بخش زیر اضافه کنید.
          </p>
        </div>
      )}

      {/* ─── بخش مشترک: افزودن ویژگی‌های سفارشی/تکمیلی (برای تمامی دسته‌ها) ─── */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-primary" />
          مشخصات تکمیلی دلخواه (اختیاری)
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="نام ویژگی (مثال: رنگ، مهلت تست)"
            value={newPropName}
            onChange={(e) => setNewPropName(e.target.value)}
            className="h-11 rounded-xl flex-1 text-xs"
          />
          <Input
            placeholder="مقدار (مثال: آبی، ۴۸ ساعت)"
            value={newPropValue}
            onChange={(e) => setNewPropValue(e.target.value)}
            className="h-11 rounded-xl flex-1 text-xs"
          />
          <Button
            type="button"
            onClick={addProperty}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0 bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="w-5 h-5" />
          </Button>
        </div>

        {(data.additionalProperties?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {data.additionalProperties?.map((prop: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40"
              >
                <div className="flex-1 flex gap-2 text-xs truncate">
                  <span className="font-bold text-foreground">
                    {prop.name}:
                  </span>
                  <span className="text-muted-foreground truncate">
                    {prop.value}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProperty(idx)}
                  className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── دکمه‌های ناوبری ─── */}
      <div className="flex justify-between items-center pt-6 border-t border-border/40 select-none">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 rounded-xl h-10 px-6 text-xs font-bold border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
          مرحله قبل
        </Button>
        <Button
          onClick={onNext}
          className="gap-2 rounded-xl h-10 px-6 text-xs font-bold bg-primary hover:bg-primary/95 shadow-xs"
        >
          ادامه و آپلود تصاویر
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
