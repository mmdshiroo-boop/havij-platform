"use client";

import { useState, useEffect, memo, useCallback, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin?: number;
  valueMax?: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  formatLabel?: (value: number) => string;
}

export const PriceRangeSlider = memo(function PriceRangeSlider({
  min,
  max,
  valueMin = min,
  valueMax = max,
  onChangeMin,
  onChangeMax,
  formatLabel = (v) => v.toLocaleString(),
}: PriceRangeSliderProps) {
  // state محلی برای نمایش روان حین کشیدن
  const [localMin, setLocalMin] = useState(valueMin);
  const [localMax, setLocalMax] = useState(valueMax);

  // state برای فیلدهای ورودی (نمایش عدد خام)
  const [inputMin, setInputMin] = useState(String(valueMin));
  const [inputMax, setInputMax] = useState(String(valueMax));

  const isDragging = useRef(false);

  // همگام‌سازی با props در صورت تغییر از بیرون (مثلاً پاک‌سازی فیلترها)
  useEffect(() => {
    if (!isDragging.current) {
      setLocalMin(valueMin);
      setLocalMax(valueMax);
      setInputMin(String(valueMin));
      setInputMax(String(valueMax));
    }
  }, [valueMin, valueMax]);

  // هنگام کشیدن اسلایدر: فقط state محلی را تغییر بده
  const handleSliderChange = useCallback((values: number[]) => {
    const [newMin, newMax] = values;
    setLocalMin(newMin);
    setLocalMax(newMax);
    setInputMin(String(newMin));
    setInputMax(String(newMax));
  }, []);

  // هنگام رها کردن دسته: والد را صدا بزن
  const handleSliderCommit = useCallback(
    (values: number[]) => {
      isDragging.current = false;
      const [newMin, newMax] = values;
      const finalMin = newMin === min ? min : newMin;
      const finalMax = newMax === max ? max : newMax;
      onChangeMin(finalMin);
      onChangeMax(finalMax);
    },
    [min, max, onChangeMin, onChangeMax],
  );

  // مدیریت تغییرات فیلدهای ورودی (با debounce ساده برای اعمال)
  const commitInputs = useCallback(() => {
    const nMin = parseInt(inputMin, 10);
    const nMax = parseInt(inputMax, 10);
    if (!isNaN(nMin) && !isNaN(nMax)) {
      const clampedMin = Math.max(min, Math.min(max, nMin));
      const clampedMax = Math.max(min, Math.min(max, nMax));
      const finalMin = Math.min(clampedMin, clampedMax);
      const finalMax = Math.max(clampedMin, clampedMax);
      setLocalMin(finalMin);
      setLocalMax(finalMax);
      setInputMin(String(finalMin));
      setInputMax(String(finalMax));
      onChangeMin(finalMin);
      onChangeMax(finalMax);
    } else {
      // در صورت نامعتبر بودن، به مقادیر قبلی برگردان
      setInputMin(String(localMin));
      setInputMax(String(localMax));
    }
  }, [
    inputMin,
    inputMax,
    localMin,
    localMax,
    min,
    max,
    onChangeMin,
    onChangeMax,
  ]);

  const handleInputBlur = () => commitInputs();

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitInputs();
      (e.target as HTMLInputElement).blur();
    }
  };

  const displayMin = formatLabel(localMin);
  const displayMax = formatLabel(localMax);

  return (
    <div className="space-y-4">
      {/* برچسب‌های قیمت انتخاب‌شده */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-center bg-primary/5 rounded-xl py-2 px-3">
          <span className="text-[11px] text-muted-foreground">حداقل</span>
          <p className="text-sm font-extrabold text-primary tabular-nums">
            {displayMin}
          </p>
        </div>
        <div className="text-muted-foreground text-xs font-bold">تا</div>
        <div className="flex-1 text-center bg-primary/5 rounded-xl py-2 px-3">
          <span className="text-[11px] text-muted-foreground">حداکثر</span>
          <p className="text-sm font-extrabold text-primary tabular-nums">
            {displayMax}
          </p>
        </div>
      </div>

      {/* اسلایدر دوطرفهٔ شادسیان */}
      <Slider
        value={[localMin, localMax]}
        min={min}
        max={max}
        step={Math.max(100000, Math.floor((max - min) / 100))}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        className="my-4"
        dir="rtl" // RTL شادسیان به‌خوبی پشتیبانی می‌کند
      />

      {/* فیلدهای ورودی برای وارد کردن دستی */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">
            از (تومان)
          </Label>
          <Input
            type="number"
            value={inputMin}
            onChange={(e) => setInputMin(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="حداقل"
            className="h-9 text-xs rounded-xl bg-muted/20 border-border text-center"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">
            تا (تومان)
          </Label>
          <Input
            type="number"
            value={inputMax}
            onChange={(e) => setInputMax(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="حداکثر"
            className="h-9 text-xs rounded-xl bg-muted/20 border-border text-center"
            dir="ltr"
          />
        </div>
      </div>

      {/* نمایش حداقل و حداکثر کلی */}
      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>{formatLabel(min)}</span>
        <span>{formatLabel(max)}</span>
      </div>
    </div>
  );
});
