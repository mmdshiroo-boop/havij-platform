"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authApi } from "@/services/api/auth.api";

interface EmailLoginFormProps {
  onSuccess?: () => void;
}

export function EmailLoginForm({ onSuccess }: EmailLoginFormProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);

  const sendCode = async () => {
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("ایمیل معتبر نیست");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.sendCode(email);
      setStep("code");
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.message || "خطا در ارسال کد");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("کد ۶ رقمی را وارد کنید");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.verifyCode({
        email,
        code,
        firstName: isNewUser ? firstName : undefined,
        lastName: isNewUser ? lastName : undefined,
      });

      if (response.success) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.data));
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "کد نامعتبر است");
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(120);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await authApi.resendCode(email);
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.message || "خطا در ارسال مجدد");
    } finally {
      setLoading(false);
    }
  };

  // مرحله 1: وارد کردن ایمیل
  if (step === "email") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">ورود / ثبت‌نام</CardTitle>
          <CardDescription className="text-center">
            ایمیل خود را وارد کنید، کد تایید برای شما ارسال می‌شود
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">آدرس ایمیل</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          {error && (
            <div className="text-sm text-red-500 text-center">{error}</div>
          )}
          <Button
            onClick={sendCode}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "در حال ارسال..." : "ارسال کد تایید"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // مرحله 2: وارد کردن کد و اطلاعات کاربر جدید
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">تایید کد</CardTitle>
        <CardDescription className="text-center">
          کد ۶ رقمی ارسال شده به {email} را وارد کنید
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">کد تایید</Label>
          <Input
            id="code"
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
            dir="ltr"
          />
        </div>

        {!isNewUser && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              حساب کاربری ندارید؟
            </span>
            <Button
              variant="link"
              onClick={() => setIsNewUser(true)}
              className="text-primary"
            >
              ثبت‌نام کنید
            </Button>
          </div>
        )}

        {isNewUser && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">نام</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="رضا"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">نام خانوادگی</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="کریمی"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 text-center">{error}</div>
        )}

        <Button
          onClick={verifyCode}
          disabled={loading || !code}
          className="w-full"
        >
          {loading ? "در حال بررسی..." : "تایید و ورود"}
        </Button>

        <div className="text-center">
          {countdown > 0 ? (
            <span className="text-sm text-muted-foreground">
              ارسال مجدد کد تا {Math.floor(countdown / 60)}:
              {String(countdown % 60).padStart(2, "0")}
            </span>
          ) : (
            <Button variant="link" onClick={resendCode} className="text-sm">
              ارسال مجدد کد
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={() => setStep("email")}
          className="w-full text-sm"
        >
          ← تغییر ایمیل
        </Button>
      </CardContent>
    </Card>
  );
}
