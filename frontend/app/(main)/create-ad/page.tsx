"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Footer } from "@/components/common/Footer";
import { CreateAdWizard } from "@/components/create-ad/CreateAdWizard";
import { Header } from "@/components/common/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  UserCheck,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import apiClient from "@/services/api/client";
import { toast } from "sonner";

export default function CreateAdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // بررسی احراز هویت و تکمیل اطلاعات ضروری پروفایل
  const checkUserProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth?redirect=/create-ad");
      return;
    }

    setIsLoggedIn(true);

    try {
      const res = await apiClient.get("/users/profile");
      const profile = res?.data?.data || res?.data || {};

      // استخراج فیلدهای ضروری
      const firstName = (profile.firstName || "").trim();
      const lastName = (profile.lastName || "").trim();
      const phone = (
        profile.phone ||
        profile.mobile ||
        profile.phoneNumber ||
        ""
      ).trim();
      const nationalCode = (
        profile.nationalCode ||
        profile.melliCode ||
        profile.nationalId ||
        ""
      ).trim();
      const province = (profile.province || "").trim();
      const city = (profile.city || "").trim();

      // تمام ۶ فیلد اجباری باید پر شده باشند
      const hasRequiredData = Boolean(
        firstName && lastName && phone && nationalCode && province && city,
      );

      setIsProfileComplete(hasRequiredData);
    } catch (error) {
      console.error("Profile check error:", error);
      toast.error("خطا در دریافت اطلاعات حساب کاربری");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUserProfile();
  }, [checkUserProfile]);

  // اسکلتون لودینگ اولیه
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl flex items-center justify-center">
          <Skeleton className="h-[420px] w-full rounded-3xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  // ─── در صورت ناقص بودن پروفایل (کارت هشدار مدرن و شیک) ───
  if (!isProfileComplete) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col justify-between"
        dir="rtl"
      >
        {/* هدر مخصوص موبایل */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/60 bg-background/80 backdrop-blur-md md:hidden sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="rounded-full hover:bg-accent shrink-0"
            >
              <ArrowRight className="w-5 h-5 text-foreground" />
            </Button>
            <span
              className="font-bold text-sm text-foreground cursor-pointer"
              onClick={() => router.push("/")}
            >
              بازگشت به خانه
            </span>
          </div>
          <span className="font-black text-xs text-primary">تکمیل پروفایل</span>
        </div>

        <main className="flex-1 container mx-auto px-4 py-10 max-w-xl flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full"
          >
            <Card className="border-amber-500/20 bg-card shadow-2xl rounded-3xl overflow-hidden relative">
              {/* افکت نوری پس‌زمینه */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <CardHeader className="text-center pt-8 pb-3 px-6 relative z-10">
                {/* آیکون همراه با پالس نوری */}
                <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-500/15 rounded-3xl rotate-6 animate-pulse" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-600 rounded-3xl flex items-center justify-center shadow-sm">
                    <ShieldAlert className="w-10 h-10" />
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className="mx-auto mb-3 px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> احراز هویت کاربری
                </Badge>

                <CardTitle className="text-xl sm:text-2xl font-black text-foreground leading-snug">
                  تکمیل پروفایل جهت ثبت آگهی الزامی است
                </CardTitle>
              </CardHeader>

              <CardContent className="px-6 sm:px-8 pb-8 pt-2 text-center relative z-10 space-y-6">
                <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed sm:leading-loose font-medium">
                  برای جلوگیری از آگهی‌های فیک و افزایش اعتماد خریداران، تمامی
                  کاربران (عادی، VIP و مشاورین) جهت ثبت آگهی ملزم به تکمیل
                  اطلاعات هویتی و آدرس خود هستند.
                </CardDescription>

                {/* ویژگی‌های کلیدی کوتاه به‌صورت Pills شیک */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs font-semibold text-foreground/80">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/50">
                    <UserCheck className="w-3.5 h-3.5 text-primary" /> اطلاعات
                    هویتی
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/50">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ثبت
                    امن آگهی
                  </span>
                </div>

                {/* دکمه‌های اقدام */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                  <Button
                    onClick={() => router.push("/panel/user/profile")}
                    size="lg"
                    className="w-full sm:flex-1 font-bold h-12 rounded-2xl text-sm gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                  >
                    تکمیل پروفایل و ادامه
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    size="lg"
                    className="w-full sm:w-auto font-bold h-12 rounded-2xl text-sm px-6 border-border/80"
                  >
                    انصراف
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  // ─── در صورت کامل بودن پروفایل (نمایش فرم ثبت آگهی) ───
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* هدر مخصوص موبایل */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border/60 bg-background/80 backdrop-blur-md md:hidden sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full hover:bg-accent shrink-0"
          >
            <ArrowRight className="w-5 h-5 text-foreground" />
          </Button>
          <span
            className="font-bold text-sm text-foreground cursor-pointer"
            onClick={() => router.push("/")}
          >
            بازگشت به خانه
          </span>
        </div>
        <span className="font-black text-xs text-primary">ثبت آگهی</span>
      </div>

      <main className="flex-1">
        <CreateAdWizard />
      </main>
    </div>
  );
}
