"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CreateAdData } from "@/services/api/ads.api";
import {
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  User,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactStepProps {
  data: Partial<CreateAdData>;
  updateData: (data: Partial<CreateAdData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function ContactStep({
  data,
  updateData,
  onSubmit,
  onBack,
  loading,
}: ContactStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.contactPhone) {
      newErrors.contactPhone = "وارد کردن شماره تماس الزامی است";
    } else if (!/^09[0-9]{9}$/.test(data.contactPhone)) {
      newErrors.contactPhone =
        "فرمت شماره موبایل وارد شده معتبر نیست (مثال: 09123456789)";
    }
    if (!acceptTerms) {
      newErrors.acceptTerms = "قبول قوانین و مقررات برای ثبت آگهی الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── بخش اطلاعات ارتباطی ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* شماره تماس */}
        <div className="space-y-1.5">
          <Label
            htmlFor="phone"
            className="text-xs font-bold text-foreground/80 flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            شماره تماس <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="phone"
              type="tel"
              placeholder="09123456789"
              value={data.contactPhone || ""}
              onChange={(e) => updateData({ contactPhone: e.target.value })}
              className="h-11 rounded-xl text-left font-mono tracking-wider pl-4"
              dir="ltr"
              disabled={loading}
            />
          </div>
          {errors.contactPhone && (
            <p className="text-xs font-bold text-destructive animate-in fade-in duration-200">
              {errors.contactPhone}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            این شماره به صورت عمومی در صفحه آگهی جهت تماس خریداران نمایش داده
            می‌شود.
          </p>
        </div>

        {/* نام تماس گیرنده */}
        <div className="space-y-1.5">
          <Label
            htmlFor="contactName"
            className="text-xs font-bold text-foreground/80 flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            نام تماس‌گیرنده (اختیاری)
          </Label>
          <Input
            id="contactName"
            placeholder="مثال: رضا کریمی"
            value={data.contactName || ""}
            onChange={(e) => updateData({ contactName: e.target.value })}
            className="h-11 rounded-xl"
            disabled={loading}
          />
        </div>
      </div>

      {/* ─── آپشن آگهی فوری ─── */}
      <div
        className={cn(
          "flex items-center justify-between p-4 rounded-xl border transition-all duration-300 select-none",
          data.isUrgent
            ? "bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10"
            : "bg-muted/20 border-border/40",
        )}
      >
        <div className="flex gap-3 items-start">
          <div
            className={cn(
              "p-2 rounded-lg mt-0.5 shadow-xs border transition-colors",
              data.isUrgent
                ? "bg-amber-500 text-white border-amber-600"
                : "bg-background text-muted-foreground border-border",
            )}
          >
            <Zap className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <Label
              className="text-sm font-black text-foreground cursor-pointer"
              onClick={() => updateData({ isUrgent: !data.isUrgent })}
            >
              ارتقا به آگهی فوری
            </Label>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              آگهی شما با برچسب متمایز مایل به فروش سریع‌تر، در بالای لیست نتایج
              نمایش داده می‌شود.
            </p>
          </div>
        </div>
        <Switch
          checked={data.isUrgent || false}
          onCheckedChange={(checked) => updateData({ isUrgent: checked })}
          disabled={loading}
          className="data-[state=checked]:bg-amber-500"
        />
      </div>

      {/* ─── چک‌باکس پذیرش قوانین پلتفرم ─── */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <div
          className={cn(
            "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-colors",
            acceptTerms
              ? "bg-muted/10 border-border"
              : "bg-background border-border/40",
          )}
          onClick={() => setAcceptTerms(!acceptTerms)}
        >
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 accent-primary rounded mt-0.5 cursor-pointer"
            checked={acceptTerms}
            onChange={() => {}} // مدیریت کلیک روی کامپوننت مادر انجام می‌شود
            disabled={loading}
          />
          <label
            htmlFor="terms"
            className="text-xs font-semibold text-foreground/90 cursor-pointer leading-relaxed"
          >
            شرایط، قوانین انتشار آگهی و حریم خصوصی فعالیت در پلتفرم را مطالعه
            کرده و تمام مفاد آن را می‌پذیرم.
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-xs font-bold text-destructive flex items-center gap-1.5 animate-in fade-in duration-200">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.acceptTerms}
          </p>
        )}
      </div>

      {/* ─── دکمه‌های کنترل ناوبری فوتر ─── */}
      <div className="flex justify-between items-center pt-6 border-t border-border/40 select-none">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="gap-2 rounded-xl h-10 px-6 text-xs font-bold border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
          مرحله قبل
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className={cn(
            "gap-2 rounded-xl h-10 px-8 text-xs font-bold shadow-md transition-all min-w-[130px]",
            loading
              ? "bg-muted text-muted-foreground"
              : "bg-emerald-600 hover:bg-emerald-600/95 text-white shadow-emerald-600/10",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال ثبت...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              تایید و ثبت نهایی آگهی
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
