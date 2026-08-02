"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { authApi } from "@/services/api/auth.api";
import { toast } from "sonner";
import {
  Smartphone,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Send,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import {
  AuthField,
  AuthError,
  AuthButton,
  OtpCountdown,
  StepIndicator,
  PasswordStrength,
  authInputClass,
} from "./AuthShared";
import { cn } from "@/lib/utils";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function ForgotPasswordForm({
  onSuccess,
  onLoginClick,
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<"phone" | "code" | "newPassword">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const currentStepIndex =
    step === "phone" ? 0 : step === "code" ? 1 : 2;

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.match(/^09[0-9]{9}$/)) {
      setError("شماره موبایل معتبر نیست");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.sendCode(phone);
      setStep("code");
      setCountdown(120);
      toast.success("کد بازیابی ارسال شد");
    } catch (err: any) {
      const msg = err.response?.data?.message || "خطا در ارسال کد";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

// ── مرحله ۲ — فقط تایید کد، بدون فراخوانی API
// چون کد در مرحله ۳ همراه رمز جدید فرستاده می‌شود
const verifyCode = async (e: React.FormEvent) => {
  e.preventDefault();
  if (code.length !== 6) {
    setError("کد ۶ رقمی را وارد کنید");
    return;
  }

  // ✅ فقط اعتبارسنجی فرمی — بدون API call
  // کد در مرحله ۳ همراه با رمز جدید به resetPassword ارسال می‌شود
  setStep("newPassword");
  setError("");
};

// ── مرحله ۳ — ارسال phone + code + newPassword با هم
const resetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  if (newPassword.length < 6) {
    setError("رمز باید حداقل ۶ کاراکتر باشد");
    return;
  }
  if (newPassword !== confirmPassword) {
    setError("رمز عبور و تکرار آن مطابقت ندارند");
    return;
  }
  setLoading(true);
  setError("");
  try {
    // ✅ هر سه مقدار با هم فرستاده می‌شوند
    await authApi.resetPassword({
      phone,
      code,
      newPassword,
    });
    toast.success("رمز عبور با موفقیت تغییر کرد");
    setTimeout(() => onSuccess?.(), 600);
  } catch (err: any) {
    const msg =
      err.response?.data?.message || "خطا در تغییر رمز عبور";
    setError(msg);
    toast.error(msg);
  } finally {
    setLoading(false);
  }
};

 
  const resendCode = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await authApi.resendCode(phone);
      setCountdown(120);
      toast.success("کد مجدداً ارسال شد");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ارسال مجدد");
    } finally {
      setLoading(false);
    }
  };

  // ── مرحله ۱: شماره موبایل ──
  if (step === "phone") {
    return (
      <div className="space-y-5" dir="rtl">
        <StepIndicator currentStep={0} totalSteps={3} />

        <div className="space-y-1.5">
          <h2 className="text-[17px] font-black text-foreground">
            بازیابی رمز عبور
          </h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            شماره موبایل ثبت‌شده خود را وارد کنید.
          </p>
        </div>

        <form onSubmit={sendCode} className="space-y-4">
          <AuthField
            id="forgot-phone"
            label="شماره موبایل"
            icon={<Smartphone className="w-4 h-4" />}
          >
            <Input
              id="forgot-phone"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="09123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              dir="ltr"
              className={cn(authInputClass, "pr-11")}
              autoFocus
            />
          </AuthField>

          <AnimatePresence>
            {error && <AuthError message={error} />}
          </AnimatePresence>

          <AuthButton
            loading={loading}
            disabled={phone.length < 11}
            label="ارسال کد بازیابی"
            icon={<Send className="w-4 h-4" />}
          />
        </form>

        <p className="text-center text-[13px] text-muted-foreground">
          رمز را به یاد آوردید؟{" "}
          <button
            type="button"
            onClick={onLoginClick}
            className="text-primary font-bold hover:underline underline-offset-4 transition-colors"
          >
            ورود به حساب
          </button>
        </p>
      </div>
    );
  }

  // ── مرحله ۲: کد تایید ──
  if (step === "code") {
    return (
      <div className="space-y-5" dir="rtl">
        <StepIndicator currentStep={1} totalSteps={3} />

        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setError("");
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          <span>تغییر شماره</span>
          <span className="text-foreground/50 font-medium" dir="ltr">
            ({phone})
          </span>
        </button>

        <div className="space-y-1.5">
          <h2 className="text-[17px] font-black text-foreground">
            تایید هویت
          </h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            کد ۶ رقمی ارسال‌شده را وارد کنید.
          </p>
        </div>

        <form onSubmit={verifyCode} className="space-y-4">
          <AuthField
            id="forgot-code"
            label="کد تایید"
            icon={<KeyRound className="w-4 h-4" />}
          >
            <Input
              id="forgot-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="• • • • • •"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              dir="ltr"
              className={cn(
                authInputClass,
                "pr-11 text-center tracking-[0.5em] font-black font-mono text-base"
              )}
              autoFocus
            />
          </AuthField>

          <AnimatePresence>
            {error && <AuthError message={error} />}
          </AnimatePresence>

          <AuthButton
            loading={loading}
            disabled={code.length < 6}
            label="تایید کد"
            icon={<CheckCircle2 className="w-4 h-4" />}
          />

          <OtpCountdown countdown={countdown} onResend={resendCode} />
        </form>
      </div>
    );
  }

  // ── مرحله ۳: رمز عبور جدید ──
  return (
    <div className="space-y-5" dir="rtl">
      <StepIndicator currentStep={2} totalSteps={3} />

      <div className="space-y-1.5">
        <h2 className="text-[17px] font-black text-foreground">
          رمز عبور جدید
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          یک رمز عبور امن برای حساب خود انتخاب کنید.
        </p>
      </div>

      <form onSubmit={resetPassword} className="space-y-4">
        <div>
          <AuthField
            id="new-password"
            label="رمز عبور جدید"
            icon={<Lock className="w-4 h-4" />}
          >
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                dir="ltr"
                className={cn(authInputClass, "pr-11 pl-11")}
                autoFocus
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((p) => !p)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/70 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </AuthField>
          <PasswordStrength password={newPassword} />
        </div>

        <AuthField
          id="new-confirm"
          label="تکرار رمز عبور"
          icon={<Lock className="w-4 h-4" />}
        >
          <Input
            id="new-confirm"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="تکرار رمز عبور جدید"
            dir="ltr"
            className={cn(authInputClass, "pr-11")}
          />
        </AuthField>

        <AnimatePresence>
          {error && <AuthError message={error} />}
        </AnimatePresence>

        <AuthButton
          loading={loading}
          disabled={
            newPassword.length < 6 || newPassword !== confirmPassword
          }
          label="ذخیره رمز جدید"
          icon={<ShieldCheck className="w-4 h-4" />}
        />
      </form>
    </div>
  );
}