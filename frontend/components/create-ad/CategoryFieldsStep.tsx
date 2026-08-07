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
  HelpCircle,
} from "lucide-react";

interface CategoryFieldsStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  categorySlug?: string;
}

// تشخیص گروه دسته‌بندی از slug
const detectCategory = (slug: string) => {
  const s = slug.toLowerCase();
  const isRealEstate =
    s.includes("real-estate") ||
    s.includes("apartment") ||
    s.includes("villa") ||
    s.includes("land") ||
    s.includes("office") ||
    s.includes("shop") ||
    s.includes("rent") ||
    s.includes("sale") ||
    s.includes("mlk") ||
    s.includes("makan") ||
    s.includes("property") ||
    s.includes("home");

  const isVehicle =
    s.includes("car") ||
    s.includes("vehicle") ||
    s.includes("motor") ||
    s.includes("sedan") ||
    s.includes("truck") ||
    s.includes("khodro") ||
    s.includes("motorcycl");

  const isJob =
    s.includes("job") ||
    s.includes("employ") ||
    s.includes("work") ||
    s.includes("karyab") ||
    s.includes("shoghl") ||
    s.includes("estekhdam");

  const isGoods =
    s.includes("electronic") ||
    s.includes("mobile") ||
    s.includes("laptop") ||
    s.includes("appliance") ||
    s.includes("digital") ||
    s.includes("loazem");

  return { isRealEstate, isVehicle, isJob, isGoods };
};

export function CategoryFieldsStep({
  data,
  updateData,
  onNext,
  onBack,
  categorySlug = "",
}: CategoryFieldsStepProps) {
  const [newPropName, setNewPropName] = useState("");
  const [newPropValue, setNewPropValue] = useState("");

  const { isRealEstate, isVehicle, isJob, isGoods } =
    detectCategory(categorySlug);
  const isGeneral = !isRealEstate && !isVehicle && !isJob && !isGoods;

  const handleNumberChange = (key: string, value: string) => {
    const num = value === "" ? undefined : Number(value);
    updateData({ [key]: num && !isNaN(num) ? num : undefined });
  };

  const toggleAmenity = (key: string) => {
    const current = data.amenities?.[key] ?? false;
    updateData({ amenities: { ...data.amenities, [key]: !current } });
  };

  const addProperty = () => {
    if (!newPropName.trim() || !newPropValue.trim()) return;
    updateData({
      additionalProperties: [
        ...(data.additionalProperties || []),
        { name: newPropName.trim(), value: newPropValue.trim() },
      ],
    });
    setNewPropName("");
    setNewPropValue("");
  };

  const removeProperty = (index: number) => {
    const updated = [...(data.additionalProperties || [])];
    updated.splice(index, 1);
    updateData({ additionalProperties: updated });
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* ══ ۱. فرم اختصاصی املاک ══ */}
      {isRealEstate && (
        <div className="space-y-6">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b pb-2 border-border/40">
            <Ruler className="w-4 h-4 text-primary" />
            مشخصات فیزیکی ملک
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">متراژ (متر مربع)</Label>
              <Input
                type="number"
                placeholder="مثال: 85"
                value={data.area ?? ""}
                onChange={(e) => handleNumberChange("area", e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">تعداد اتاق خواب</Label>
              <Input
                type="number"
                placeholder="مثال: 2"
                value={data.rooms ?? ""}
                onChange={(e) => handleNumberChange("rooms", e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">طبقه</Label>
              <Input
                type="number"
                placeholder="مثال: 3"
                value={data.floor ?? ""}
                onChange={(e) => handleNumberChange("floor", e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">تعداد طبقات کل</Label>
              <Input
                type="number"
                placeholder="مثال: 7"
                value={data.floorCount ?? ""}
                onChange={(e) => handleNumberChange("floorCount", e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">سال ساخت</Label>
              <Input
                type="number"
                placeholder="مثال: 1400"
                value={data.yearBuilt ?? ""}
                onChange={(e) => handleNumberChange("yearBuilt", e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">تعداد پارکینگ</Label>
              <Input
                type="number"
                placeholder="مثال: 1"
                value={data.parkingCount ?? ""}
                onChange={(e) => handleNumberChange("parkingCount", e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-foreground flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              امکانات رفاهی
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: "parking", label: "پارکینگ" },
                { id: "elevator", label: "آسانسور" },
                { id: "storage", label: "انباری" },
                { id: "balcony", label: "بالکن" },
                { id: "pool", label: "استخر" },
                { id: "sauna", label: "سونا و جکوزی" },
                { id: "yard", label: "حیاط" },
                { id: "lobby", label: "لابی" },
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نوع سند</Label>
              <Select
                value={data.documentType || ""}
                onValueChange={(val) => updateData({ documentType: val })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="انتخاب نوع سند" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="official">سند رسمی / شش‌دانگ</SelectItem>
                  <SelectItem value="private">قولنامه / مبایعه‌نامه</SelectItem>
                  <SelectItem value="partnership">مشاع / شراکتی</SelectItem>
                  <SelectItem value="court">در رهن / بازداشت</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نوع کاربری</Label>
              <Select
                value={data.usage || ""}
                onValueChange={(val) => updateData({ usage: val })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="کاربری ملک" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="residential">مسکونی</SelectItem>
                  <SelectItem value="commercial">تجاری</SelectItem>
                  <SelectItem value="office">اداری</SelectItem>
                  <SelectItem value="industrial">صنعتی</SelectItem>
                  <SelectItem value="agricultural">کشاورزی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ══ ۲. فرم اختصاصی خودرو ══ */}
      {isVehicle && (
        <div className="space-y-6">
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
                placeholder="مثال: 1399"
                value={data.yearBuilt ?? ""}
                onChange={(e) => handleNumberChange("yearBuilt", e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">کارکرد (کیلومتر)</Label>
              <Input
                type="number"
                placeholder="مثال: 45000"
                value={data.usageKilometers ?? ""}
                onChange={(e) => handleNumberChange("usageKilometers", e.target.value)}
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="healthy">بدون رنگ / سالم</SelectItem>
                  <SelectItem value="some_paint">چند لکه رنگ</SelectItem>
                  <SelectItem value="full_paint">دور رنگ</SelectItem>
                  <SelectItem value="accident">تصادفی / نیاز به تعمیر</SelectItem>
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="gasoline">بنزینی</SelectItem>
                  <SelectItem value="dual">دوگانه‌سوز</SelectItem>
                  <SelectItem value="diesel">دیزلی</SelectItem>
                  <SelectItem value="electric">برقی / هیبرید</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">گیربکس</Label>
              <Select
                value={data.gearbox || "manual"}
                onValueChange={(val) => updateData({ gearbox: val })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="manual">دنده‌ای (manual)</SelectItem>
                  <SelectItem value="automatic">اتوماتیک</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ══ ۳. فرم اختصاصی استخدام ══ */}
      {isJob && (
        <div className="space-y-6">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b pb-2 border-border/40">
            <Briefcase className="w-4 h-4 text-primary" />
            شرایط فرصت شغلی
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">سمت / عنوان شغلی</Label>
              <Input
                placeholder="مثال: برنامه‌نویس React"
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="full_time">تمام وقت</SelectItem>
                  <SelectItem value="part_time">پاره وقت</SelectItem>
                  <SelectItem value="remote">دورکاری</SelectItem>
                  <SelectItem value="project">پروژه‌ای</SelectItem>
                  <SelectItem value="internship">کارآموزی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">حداقل سابقه (سال)</Label>
              <Input
                type="number"
                placeholder="مثال: 2"
                value={data.minExperience ?? ""}
                onChange={(e) => handleNumberChange("minExperience", e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">وضعیت بیمه</Label>
              <Select
                value={data.hasInsurance ? "yes" : "no"}
                onValueChange={(val) => updateData({ hasInsurance: val === "yes" })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="yes">دارد (از روز اول)</SelectItem>
                  <SelectItem value="no">ندارد / توافقی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">جنسیت</Label>
              <Select
                value={data.genderRequirement || "no_matter"}
                onValueChange={(val) => updateData({ genderRequirement: val })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="no_matter">مهم نیست</SelectItem>
                  <SelectItem value="male">آقا</SelectItem>
                  <SelectItem value="female">خانم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">حقوق پایه (تومان)</Label>
              <Input
                type="number"
                placeholder="مثال: 15000000"
                value={data.baseSalary ?? ""}
                onChange={(e) => handleNumberChange("baseSalary", e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ══ ۴. فرم اختصاصی کالا / الکترونیک ══ */}
      {isGoods && (
        <div className="space-y-6">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b pb-2 border-border/40">
            <Smartphone className="w-4 h-4 text-primary" />
            مشخصات کالا
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">برند / سازنده</Label>
              <Input
                placeholder="مثال: سامسونگ، اپل، ال‌جی"
                value={data.brand || ""}
                onChange={(e) => updateData({ brand: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">وضعیت کالا</Label>
              <Select
                value={data.itemCondition || "like_new"}
                onValueChange={(val) => updateData({ itemCondition: val })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="new">نو (پلمپ / آکبند)</SelectItem>
                  <SelectItem value="like_new">در حد نو</SelectItem>
                  <SelectItem value="used">دست دوم / کارکرده</SelectItem>
                  <SelectItem value="for_parts">نیاز به تعمیر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">گارانتی</Label>
              <Select
                value={data.hasWarranty ? "yes" : "no"}
                onValueChange={(val) => updateData({ hasWarranty: val === "yes" })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="yes">دارد (شرکتی)</SelectItem>
                  <SelectItem value="no">ندارد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ══ عمومی: اگر دسته مشخصی نبود ══ */}
      {isGeneral && (
        <div className="p-5 rounded-2xl bg-muted/20 border border-border/40 text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">
            مشخصات اختصاصی برای این دسته‌بندی پیدا نشد
          </p>
          <p className="text-xs text-muted-foreground">
            می‌توانید از بخش ویژگی‌های سفارشی زیر استفاده کنید.
          </p>
        </div>
      )}

      {/* ══ ویژگی‌های سفارشی (همه دسته‌ها) ══ */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-primary" />
          ویژگی‌های تکمیلی (اختیاری)
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="نام ویژگی (مثال: رنگ)"
            value={newPropName}
            onChange={(e) => setNewPropName(e.target.value)}
            className="h-11 rounded-xl flex-1 text-sm"
          />
          <Input
            placeholder="مقدار (مثال: آبی)"
            value={newPropValue}
            onChange={(e) => setNewPropValue(e.target.value)}
            className="h-11 rounded-xl flex-1 text-sm"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.additionalProperties?.map((prop: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40"
              >
                <div className="flex-1 flex gap-2 text-xs truncate">
                  <span className="font-bold text-foreground">{prop.name}:</span>
                  <span className="text-muted-foreground truncate">{prop.value}</span>
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

      {/* دکمه‌های ناوبری */}
      <div className="flex justify-between items-center pt-6 border-t border-border/40">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 rounded-xl h-10 px-6 text-sm font-bold"
        >
          <ChevronRight className="w-4 h-4" />
          مرحله قبل
        </Button>
        <Button
          onClick={onNext}
          className="gap-2 rounded-xl h-10 px-6 text-sm font-bold bg-primary"
        >
          ادامه و آپلود تصاویر
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}