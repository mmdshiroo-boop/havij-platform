"use client";

import React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// AuthField — فیلد ورودی یکپارچه
// ─────────────────────────────────────────────────────────────
interface AuthFieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  labelAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AuthField({
  id,
  label,
  icon,
  error,
  labelAction,
  children,
  className,
}: AuthFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-[13px] font-bold text-foreground/80 mr-0.5"
        >
          {label}
        </Label>
        {labelAction && <span>{labelAction}</span>}
      </div>

      <div className="relative group">
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none z-10 transition-colors group-focus-within:text-primary/60">
          {icon}
        </span>
        {children}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-bold text-destructive flex items-center gap-1 mr-0.5"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AuthError — خطای سراسری فرم
// ─────────────────────────────────────────────────────────────
export function AuthError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2.5 p-3.5 bg-destructive/8 border border-destructive/15 text-destructive rounded-xl text-xs font-bold"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{message}</span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// AuthButton — دکمه اصلی فرم
// ─────────────────────────────────────────────────────────────
interface AuthButtonProps {
  loading: boolean;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function AuthButton({
  loading,
  label,
  icon,
  disabled,
  className,
}: AuthButtonProps) {
  return (
    <Button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        "w-full h-12 rounded-xl font-bold text-sm",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "transition-all duration-200 active:scale-[0.98]",
        "shadow-[0_2px_12px_hsl(var(--primary)/0.25)]",
        "hover:shadow-[0_4px_20px_hsl(var(--primary)/0.35)]",
        "flex items-center justify-center gap-2.5",
        "disabled:opacity-50 disabled:shadow-none",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="w-4.5 h-4.5 animate-spin" />
          <span>لطفاً صبر کنید...</span>
        </>
      ) : (
        <>
          {icon && icon}
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}

// ─────────────────────────────────────────────────────────────
// OtpCountdown — تایمر ارسال مجدد کد
// ─────────────────────────────────────────────────────────────
interface OtpCountdownProps {
  countdown: number;
  onResend: () => void;
}

export function OtpCountdown({ countdown, onResend }: OtpCountdownProps) {
  const minutes = Math.floor(countdown / 60);
  const seconds = String(countdown % 60).padStart(2, "0");

  return (
    <div className="text-center pt-2">
      {countdown > 0 ? (
        <div className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          <span>ارسال مجدد تا</span>
          <span className="text-primary font-black tabular-nums min-w-[36px]">
            {minutes}:{seconds}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onResend}
          className="text-xs font-bold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
        >
          ارسال مجدد کد تایید
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AuthDivider — خط جداکننده
// ─────────────────────────────────────────────────────────────
export function AuthDivider({ text }: { text?: string }) {
  return (
    <div className="relative flex items-center py-1">
      <div className="flex-1 border-t border-border/50" />
      {text && (
        <span className="mx-3 text-[11px] font-medium text-muted-foreground/60">
          {text}
        </span>
      )}
      <div className="flex-1 border-t border-border/50" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StepIndicator — نشانگر مرحله (برای فرم‌های چند مرحله‌ای)
// ─────────────────────────────────────────────────────────────
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-1">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 rounded-full transition-all duration-300",
            i < currentStep
              ? "bg-primary w-6"
              : i === currentStep
                ? "bg-primary/60 w-4"
                : "bg-border w-3"
          )}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PasswordStrength — نمایشگر قدرت رمز عبور
// ─────────────────────────────────────────────────────────────
export function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  };

  const strength = getStrength();
  if (!password) return null;

  const labels = ["خیلی ضعیف", "ضعیف", "متوسط", "قوی", "عالی"];
  const colors = [
    "bg-destructive",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-primary",
  ];

  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < strength ? colors[strength] : "bg-border"
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground">
          {labels[strength]}
        </span>
        {strength >= 3 && (
          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
            <CheckCircle className="w-2.5 h-2.5" />
            امن
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// inputClassName — استایل یکپارچه inputها
// ─────────────────────────────────────────────────────────────
export const authInputClass = cn(
  "h-12 rounded-xl bg-background border-border/60",
  "text-sm font-medium placeholder:text-muted-foreground/40",
  "focus-visible:ring-2 focus-visible:ring-primary/20",
  "focus-visible:border-primary/40",
  "hover:border-border transition-all duration-200"
);