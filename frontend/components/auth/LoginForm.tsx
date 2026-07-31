"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api/auth.api";
import { toast } from "sonner";
import {
  Smartphone,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  Send,
  CheckCircle2,
} from "lucide-react";

// =========================================================================
// ۱. فرم ورود با شماره موبایل و رمز عبور (LoginForm)
// =========================================================================

const loginSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره موبایل وارد شده معتبر نیست"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

export function LoginForm({ onSuccess, onRegisterClick }: LoginFormProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError("");

    try {
      const response = await authApi.login(data);

      // ذخیره‌سازی توکن و اطلاعات کاربر
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.data));

      // شلیک رویداد برای بروزرسانی هدر و آواتار سایت
      window.dispatchEvent(new Event("avatar-updated"));

      toast.success("ورود با موفقیت انجام شد", {
        description: `خوش آمدید ${response.data.firstName || response.data.phone}`,
      });

      setTimeout(() => onSuccess?.(), 500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "مشکلی در برقراری ارتباط رخ داده است.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      <div className="space-y-1.5 text-center sm:text-right">
        <h3 className="text-lg font-black text-foreground">خوش آمدید</h3>
        <p className="text-xs font-medium text-muted-foreground">
          جهت ورود به حساب کاربری، مشخصات خود را وارد کنید.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* فیلد شماره موبایل */}
        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="text-xs font-bold text-muted-foreground mr-1"
          >
            شماره موبایل
          </Label>
          <div className="relative">
            <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              id="phone"
              type="tel"
              maxLength={11}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              {...register("phone")}
              className="pr-10 h-11 text-left tracking-wider font-bold rounded-xl bg-card border-border placeholder:text-right placeholder:text-xs placeholder:font-medium placeholder:tracking-normal focus-visible:ring-primary/20"
              dir="ltr"
            />
          </div>
          {errors.phone && (
            <p className="text-[11px] font-bold text-destructive/90 flex items-center gap-1 mr-1">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* فیلد رمز عبور همراه با دکمه چشم */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-xs font-bold text-muted-foreground mr-1"
          >
            رمز عبور
          </Label>
          <div className="relative">
            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className="pr-10 pl-10 h-11 text-left tracking-wider font-bold rounded-xl bg-card border-border focus-visible:ring-primary/20 placeholder:text-muted-foreground/30"
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
          {errors.password && (
            <p className="text-[11px] font-bold text-destructive/90 flex items-center gap-1 mr-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in-50 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 rounded-xl font-bold text-xs bg-primary hover:bg-primary/95 text-primary-foreground transition-all active:scale-[0.98] shadow-sm"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال بررسی اطلاعات...
            </span>
          ) : (
            "ورود به حساب کاربری"
          )}
        </Button>

        <div className="text-center text-xs pt-2">
          <span className="text-muted-foreground font-medium">
            حساب کاربری ندارید؟
          </span>{" "}
          <button
            type="button"
            onClick={onRegisterClick}
            className="text-primary font-black hover:underline underline-offset-4 transition-all"
          >
            یک حساب جدید بسازید
          </button>
        </div>
      </form>
    </div>
  );
}

// =========================================================================
// ۲. فرم ورود یکبار مصرف پیامکی (PhoneLoginForm)
// =========================================================================

interface PhoneLoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

export function PhoneLoginForm({
  onSuccess,
  onRegisterClick,
}: PhoneLoginFormProps) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
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
        description: "کد ۶ رقمی به شماره موبایل شما پیامک گردید.",
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "خطا در ارسال کد تایید";
      toast.error(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("لطفاً کد تایید ۶ رقمی را به صورت کامل وارد کنید");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.verifyCode({ phone, code });
      const { data, token } = response;

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          phone: data.phone,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          role: data.role,
          avatar: data.avatar || "",
          phoneVerified: data.phoneVerified,
          nationalCodeVerified: data.nationalCodeVerified,
        }),
      );

      window.dispatchEvent(new Event("avatar-updated"));

      toast.success("ورود موفقیت‌آمیز", {
        description: `خوش آمدید ${data.firstName || data.phone}`,
      });

      setTimeout(() => onSuccess?.(), 500);
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message || "کد تایید وارد شده نامعتبر است";
      toast.error(errMsg);
      setError(errMsg);
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
      toast.success("کد تایید مجدداً ارسال شد");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "خطا در ارسال مجدد کد";
      toast.error(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* مرحله اول: دریافت شماره تلفن */}
      {step === "phone" && (
        <form
          onSubmit={sendCode}
          className="space-y-5 animate-in fade-in-50 duration-200"
        >
          <div className="space-y-1.5 text-center sm:text-right">
            <h3 className="text-lg font-black text-foreground">
              ورود با شماره موبایل
            </h3>
            <p className="text-xs font-medium text-muted-foreground">
              کد تایید پیامکی برای ورود یا ثبت‌نام به این شماره ارسال خواهد شد.
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="login-phone"
              className="text-xs font-bold text-muted-foreground mr-1"
            >
              شماره موبایل
            </Label>
            <div className="relative">
              <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                id="login-phone"
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
                در حال ارسال کد تایید...
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
              حساب کاربری ندارید؟
            </span>{" "}
            <button
              type="button"
              onClick={onRegisterClick}
              className="text-primary font-black hover:underline underline-offset-4 transition-all"
            >
              یک حساب جدید بسازید
            </button>
          </div>
        </form>
      )}

      {/* مرحله دوم: تایید کد OTP */}
      {step === "code" && (
        <form
          onSubmit={verifyCode}
          className="space-y-5 animate-in fade-in-50 duration-200"
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

          <div className="space-y-1.5 text-center sm:text-right">
            <h3 className="text-lg font-black text-foreground">
              کد تایید را وارد کنید
            </h3>
            <p className="text-xs font-medium text-muted-foreground">
              کد ۶ رقمی پیامک شده به شماره فوق را در کادر زیر بنویسید.
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="login-code"
              className="text-xs font-bold text-muted-foreground mr-1"
            >
              کد تایید ۶ رقمی
            </Label>
            <div className="relative">
              <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                id="login-code"
                type="text"
                maxLength={6}
                placeholder="- - - - - -"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="pr-10 h-12 text-center tracking-[0.4em] font-black text-lg rounded-xl bg-card border-border placeholder:text-muted-foreground/30 focus-visible:ring-primary/20 font-mono"
                dir="ltr"
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
            disabled={loading || code.length < 6}
            className="w-full h-11 rounded-xl font-bold text-xs bg-primary hover:bg-primary/95 text-primary-foreground transition-all active:scale-[0.98] shadow-sm gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال بررسی کد تایید...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                تایید و ورود به سیستم
              </>
            )}
          </Button>

          <div className="text-center pt-2">
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
                ارسال مجدد کد پیامکی
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
