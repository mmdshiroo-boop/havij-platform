"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  LogIn,
  Building2,
  Bookmark,
  Lock,
  Phone,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════════
   RegistrationWall — دیوار ثبت‌نام (بدون امکان بستن — فقط با ثبت‌نام/ورود)
   ═══════════════════════════════════════════════════════════════════════════════ */

interface RegistrationWallProps {
  visible: boolean;
}

export function RegistrationWall({ visible }: RegistrationWallProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
      return () => cancelAnimationFrame(t);
    } else {
      setShow(false);
      const t = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[9000]" dir="rtl">
      {/* بک‌دراپ بلور — بدون کلیک */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* کارت */}
      <div
        className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-400 ease-out ${
          show
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-[0.96] translate-y-3"
        }`}
      >
        <div className="relative w-full max-w-[400px]">
          <div className="relative bg-card rounded-2xl shadow-2xl shadow-black/20 border border-border/40 overflow-hidden">
            {/* هدر */}
            <div className="relative px-6 pt-7 pb-6 text-center">
              {/* آیکون */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>

              {/* عنوان */}
              <h2 className="text-lg font-extrabold text-foreground mb-1.5">
                برای مشاهده ادامه آگهی‌ها و استفاده از تمام امکانات پلتفرم، نیاز
                است وارد حساب کاربری خود شوید.
              </h2>
            </div>

            {/* جداکننده */}
            <div className="h-px bg-border/50 mx-6" />

            {/* مزایا */}
            <div className="grid grid-cols-3 gap-0 divide-x divide-border/50 mx-0">
              {[
                { icon: Building2, title: "اعلام نیاز", desc: "آگهی رایگان" },
                {
                  icon: Bookmark,
                  title: "ذخیره‌سازی",
                  desc: "آگهی‌های مورد علاقه",
                },
                { icon: Phone, title: "تماس مستقیم", desc: "بدون واسطه" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="py-4 px-2 text-center">
                  <Icon className="w-4.5 h-4.5 text-primary mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-foreground leading-tight">
                    {title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* جداکننده */}
            <div className="h-px bg-border/50 mx-6" />

            {/* دکمه‌ها */}
            <div className="p-6 space-y-2.5">
              <button
                onClick={() => router.push("/auth")}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
              >
                ثبت‌نام رایگان
                <UserPlus className="w-4 h-4" />
              </button>

              <button
                onClick={() => router.push("/auth")}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm transition-colors border border-border/40"
              >
                ورود به حساب کاربری
                <LogIn className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-muted-foreground/60 pt-1 leading-relaxed">
                با ورود یا ثبت‌نام،{" "}
                <a
                  href="/rules"
                  className="underline-offset-2 underline hover:text-foreground transition-colors"
                >
                  قوانین سرویس
                </a>{" "}
                را می‌پذیرید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
