"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api/auth.api";
import { toast } from "sonner";
import {
  Smartphone,
  KeyRound,
  ArrowRight,
  Send,
  User,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(120);
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !phone.match(/^09[0-9]{9}$/)) {
      setError("شماره موبایل وارد شده معتبر نیست");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.sendCode(phone);
      setStep("code");
      startCountdown();
      toast.success("کد تایید ارسال شد", {
        description: "کد ۶ رقمی به شماره موبایل شما ارسال گردید",
      });
    } catch (err: any) {
      if (err.response?.data?.message?.includes("قبلاً")) {
        toast.error("شماره موبایل تکراری است", {
          description:
            "این شماره موبایل قبلاً ثبت‌نام کرده است. لطفا وارد شوید.",
        });
        setError("این شماره موبایل قبلاً ثبت‌نام کرده است");
      } else {
        const errMsg = err.response?.data?.message || "خطا در ارسال کد";
        toast.error(errMsg);
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("لطفاً کد تایید ۶ رقمی را وارد کنید");
      return;
    }
    if (!firstName || !lastName) {
      setError("وارد کردن نام و نام خانوادگی الزامی است");
      return;
    }
    if (!password || password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    if (password !== confirmPassword) {
      setError("رمز عبور و تاییدیه آن مطابقت ندارند");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // ارسال اطلاعات بدون کد ملی به متد بک‌اند
      const response = await authApi.verifyCode({
        phone,
        code,
        firstName,
        lastName,
        password,
      });

      if (response.success) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.data));
        toast.success("ثبت‌نام با موفقیت انجام شد", {
          description: `خوش آمدید ${firstName} ${lastName}`,
        });
        onSuccess?.();
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        "کد تایید یا اطلاعات وارد شده نامعتبر است";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError("");
    try {
      await authApi.resendCode(phone);
      startCountdown();
      toast.success("کد جدید مجدداً ارسال شد");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "خطا در ارسال مجدد";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      {step === "phone" && (
        <form
          onSubmit={sendCode}
          className="space-y-5 animate-in fade-in-50 duration-200"
        >
          <div className="space-y-1.5 text-center sm:text-right">
            <h3 className="text-lg font-black text-foreground">
              ایجاد حساب کاربری
            </h3>
            <p className="text-xs font-medium text-muted-foreground">
              برای شروع ثبت‌نام اولیه، شماره موبایل خود را وارد کنید.
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="register-phone"
              className="text-xs font-bold text-muted-foreground mr-1"
            >
              شماره موبایل
            </Label>
            <div className="relative">
              <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                id="register-phone"
                type="tel"
                maxLength={11}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^0-9]/g, ""))
                }
                dir="ltr"
                className="pr-10 h-11 text-left tracking-wider font-bold rounded-xl bg-card border-border placeholder:text-right placeholder:text-xs placeholder:font-medium placeholder:tracking-normal focus-visible:ring-primary/20"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || phone.length < 11}
            className="w-full h-11 rounded-xl font-bold text-xs bg-primary hover:bg-primary/95 text-primary-foreground transition-all active:scale-[0.98] shadow-sm gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ارسال کد...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 shrink-0" />
                ارسال کد تایید
              </>
            )}
          </Button>

          <div className="text-center text-xs pt-2">
            <span className="text-muted-foreground font-medium">
              حساب کاربری دارید؟
            </span>{" "}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-primary font-black hover:underline underline-offset-4 transition-all"
            >
              وارد شوید
            </button>
          </div>
        </form>
      )}

      {step === "code" && (
        <form
          onSubmit={verifyCode}
          className="space-y-4 animate-in fade-in-50 duration-200"
        >
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError("");
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            تغییر شماره موبایل ({phone})
          </button>

          <div className="space-y-1.5 text-center sm:text-right mb-4">
            <h3 className="text-lg font-black text-foreground">
              تکمیل اطلاعات ثبت‌نام
            </h3>
            <p className="text-xs font-medium text-muted-foreground">
              کد تایید ارسال شده و اطلاعات هویتی و رمز عبور خود را وارد نمایید.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="register-code"
              className="text-xs font-bold text-muted-foreground mr-1"
            >
              کد تایید ۶ رقمی
            </Label>
            <div className="relative">
              <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                id="register-code"
                type="text"
                maxLength={6}
                placeholder="- - - - - -"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="pr-10 h-11 text-center tracking-[0.4em] font-black text-base rounded-xl bg-card border-border focus-visible:ring-primary/20 font-mono"
                dir="ltr"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="firstName"
                className="text-xs font-bold text-muted-foreground mr-1"
              >
                نام
              </Label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="مثال: علی"
                  className="pr-10 h-11 text-xs font-bold rounded-xl bg-card border-border focus-visible:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="lastName"
                className="text-xs font-bold text-muted-foreground mr-1"
              >
                نام خانوادگی
              </Label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="مثال: محمدی"
                  className="pr-10 h-11 text-xs font-bold rounded-xl bg-card border-border focus-visible:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="register-password"
                className="text-xs font-bold text-muted-foreground mr-1"
              >
                رمز عبور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="pr-10 pl-10 h-11 text-left tracking-wider font-bold rounded-xl bg-card border-border focus-visible:ring-primary/20"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="register-confirm-password"
                className="text-xs font-bold text-muted-foreground mr-1"
              >
                تکرار رمز عبور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  className="pr-10 h-11 text-left tracking-wider font-bold rounded-xl bg-card border-border focus-visible:ring-primary/20"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={
              loading ||
              code.length < 6 ||
              !firstName ||
              !lastName ||
              password.length < 6 ||
              password !== confirmPassword
            }
            className="w-full h-11 rounded-xl font-bold text-xs bg-primary hover:bg-primary/95 text-primary-foreground transition-all active:scale-[0.98] shadow-sm gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ثبت اطلاعات...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                تکمیل و ثبت‌نام نهایی
              </>
            )}
          </Button>

          <div className="text-center pt-1">
            {countdown > 0 ? (
              <span className="text-xs font-bold text-muted-foreground/80">
                ارسال مجدد کد تایید تا {Math.floor(countdown / 60)}:
                {String(countdown % 60).padStart(2, "0")} دیگر
              </span>
            ) : (
              <button
                type="button"
                onClick={resendCode}
                className="text-xs font-black text-primary hover:underline underline-offset-4 transition-all"
              >
                ارسال مجدد کد تایید
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
