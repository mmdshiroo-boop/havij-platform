"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { authApi } from "@/services/api/auth.api";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { Smartphone, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import {
  AuthField,
  AuthError,
  AuthButton,
  AuthDivider,
  authInputClass,
} from "./AuthShared";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره موبایل معتبر نیست"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onForgotClick?: () => void;
}

export function LoginForm({
  onSuccess,
  onRegisterClick,
  onForgotClick,
}: LoginFormProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

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

      // ✅ از متد login در AuthContext استفاده می‌کنیم
      // این هم localStorage را ست می‌کند و هم state را آپدیت می‌کند
      login(response.token, response.data);

      toast.success("ورود موفق", {
        description: `خوش آمدید ${response.data.firstName || response.data.phone}`,
      });

      // ✅ router.replace به جای push + router.refresh برای آپدیت سرور کامپوننت‌ها
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace("/");
          router.refresh();
        }
      }, 300);
    } catch (err: any) {
      setError(err.response?.data?.message || "خطا در برقراری ارتباط");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="space-y-1.5">
        <h2 className="text-[17px] font-black text-foreground">
          ورود به حساب
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          شماره موبایل و رمز عبور خود را وارد کنید.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          id="login-phone"
          label="شماره موبایل"
          icon={<Smartphone className="w-4 h-4" />}
          error={errors.phone?.message}
        >
          <Input
            id="login-phone"
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder="09123456789"
            {...register("phone")}
            dir="ltr"
            className={cn(authInputClass, "pr-11")}
            autoFocus
          />
        </AuthField>

        <AuthField
          id="login-password"
          label="رمز عبور"
          icon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          labelAction={
            onForgotClick ? (
              <button
                type="button"
                onClick={onForgotClick}
                className="text-[11px] font-bold text-primary/70 hover:text-primary transition-colors"
              >
                فراموشی رمز؟
              </button>
            ) : undefined
          }
        >
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="رمز عبور"
              {...register("password")}
              dir="ltr"
              className={cn(authInputClass, "pr-11 pl-11")}
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

        <AnimatePresence>
          {error && <AuthError message={error} />}
        </AnimatePresence>

        <AuthButton
          loading={loading}
          label="ورود به حساب"
          icon={<LogIn className="w-4 h-4" />}
        />
      </form>

      <AuthDivider />

      <p className="text-center text-[13px] text-muted-foreground">
        حساب کاربری ندارید؟{" "}
        <button
          type="button"
          onClick={onRegisterClick}
          className="text-primary font-bold hover:underline underline-offset-4 transition-colors"
        >
          ثبت‌نام کنید
        </button>
      </p>
    </div>
  );
}