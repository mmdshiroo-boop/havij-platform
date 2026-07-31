// components/create-ad/PropertyDetailsStep.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  ChevronRight,
  Ruler,
  Building2,
  CalendarDays,
  CarFront,
  PlusCircle,
  Trash2,
} from "lucide-react";

interface Amenities {
  parking?: boolean;
  storage?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  pool?: boolean;
}

interface AdditionalProperty {
  name: string;
  value: string;
}

interface PropertyDetailsStepProps {
  data: Partial<{
    area?: number;
    rooms?: number;
    buildingAge?: number;
    yearBuilt?: number;
    parkingCount?: number;
    amenities?: Amenities;
    additionalProperties?: AdditionalProperty[];
  }>;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PropertyDetailsStep({
  data,
  updateData,
  onNext,
  onBack,
}: PropertyDetailsStepProps) {
  const [newPropName, setNewPropName] = useState("");
  const [newPropValue, setNewPropValue] = useState("");

  const handleNumberChange = (key: string, value: string) => {
    const num = value === "" ? undefined : Number(value);
    updateData({ [key]: num && !isNaN(num) ? num : undefined });
  };

  const toggleAmenity = (key: keyof Amenities) => {
    const current = data.amenities?.[key] ?? false;
    updateData({
      amenities: { ...data.amenities, [key]: !current },
    });
  };

  const addProperty = () => {
    if (!newPropName.trim() || !newPropValue.trim()) return;
    const newProp: AdditionalProperty = {
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

  return (
    <div className="space-y-8" dir="rtl">
      {/* مشخصات فیزیکی */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <Ruler className="w-4 h-4 text-primary" />
          مشخصات فیزیکی ملک
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">متراژ (متر مربع)</Label>
            <Input
              type="number"
              placeholder="مثال: ۸۵"
              value={data.area ?? ""}
              onChange={(e) => handleNumberChange("area", e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">تعداد اتاق</Label>
            <Input
              type="number"
              placeholder="مثال: ۲"
              value={data.rooms ?? ""}
              onChange={(e) => handleNumberChange("rooms", e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">سن بنا (سال)</Label>
            <Input
              type="number"
              placeholder="مثال: ۵"
              value={data.buildingAge ?? ""}
              onChange={(e) =>
                handleNumberChange("buildingAge", e.target.value)
              }
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">سال ساخت (اختیاری)</Label>
            <Input
              type="number"
              placeholder="مثال: ۱۴۰۰"
              value={data.yearBuilt ?? ""}
              onChange={(e) => handleNumberChange("yearBuilt", e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">تعداد پارکینگ</Label>
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

      {/* امکانات رفاهی */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          امکانات رفاهی
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["parking", "elevator", "storage", "balcony", "pool"] as const).map(
            (item) => (
              <div
                key={item}
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background"
              >
                <Label className="text-sm font-medium">
                  {item === "parking"
                    ? "پارکینگ"
                    : item === "elevator"
                      ? "آسانسور"
                      : item === "storage"
                        ? "انباری"
                        : item === "balcony"
                          ? "بالکن"
                          : "استخر"}
                </Label>
                <Switch
                  checked={data.amenities?.[item] ?? false}
                  onCheckedChange={() => toggleAmenity(item)}
                />
              </div>
            ),
          )}
        </div>
      </div>

      {/* مشخصات تکمیلی */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-primary" />
          مشخصات تکمیلی (اختیاری)
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="نام ویژگی"
            value={newPropName}
            onChange={(e) => setNewPropName(e.target.value)}
            className="h-11 rounded-xl flex-1"
          />
          <Input
            placeholder="مقدار"
            value={newPropValue}
            onChange={(e) => setNewPropValue(e.target.value)}
            className="h-11 rounded-xl flex-1"
          />
          <Button
            type="button"
            onClick={addProperty}
            size="icon"
            className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="w-5 h-5" />
          </Button>
        </div>
        {(data.additionalProperties?.length ?? 0) > 0 && (
          <div className="space-y-2">
            {data.additionalProperties?.map((prop, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="flex-1 flex gap-4 text-xs">
                  <span className="font-bold">{prop.name}</span>
                  <span className="text-muted-foreground">{prop.value}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProperty(idx)}
                  className="h-7 w-7 text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-border/40">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 rounded-xl h-10 px-6 text-xs font-bold"
        >
          <ChevronRight className="w-4 h-4" />
          مرحله قبل
        </Button>
        <Button
          onClick={onNext}
          className="gap-2 rounded-xl h-10 px-6 text-xs font-bold bg-primary"
        >
          ادامه و آپلود تصاویر
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
