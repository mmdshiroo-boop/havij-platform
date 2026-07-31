"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  UserPlus,
  LogIn,
  Building2,
  Bookmark,
  Lock,
  Phone,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════════
   InlineBrowseGate — دیوار ثبت‌نام درون‌خطی (همان طراحی RegistrationWall)
   داخل گرید آگهی‌ها قرار می‌گیره و اسکرول رو متوقف می‌کنه
   ═══════════════════════════════════════════════════════════════════════════════ */

export function InlineBrowseGate() {
  const router = useRouter();
  const { user } = useAuth();

  // اگه لاگینه اصلاً رندر نکن
  if (user) return null;

  return (
    <div className="col-span-full" dir="rtl">
      <div className="relative bg-card rounded-2xl shadow-2xl shadow-black/20 border border-border/40 overflow-hidden">
        {/* هدر */}
        <div className="px-6 pt-7 pb-6 text-center">
          {/* آیکون */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>

          {/* عنوان */}
          <h2 className="text-lg font-extrabold text-foreground mb-1.5">
            دسترسی محدود شده
          </h2>
          <p className="text-sm text-muted-foreground leading-7 max-w-[380px] mx-auto">
            برای مشاهده ادامه آگهی‌ها و استفاده از تمام امکانات پلتفرم، نیاز است
            وارد حساب کاربری خود شوید.
          </p>
        </div>

        {/* جداکننده */}
        <div className="h-px bg-border/50 mx-6" />

        {/* مزایا */}
        <div className="grid grid-cols-3 gap-0 divide-x divide-border/50">
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
            onClick={() => router.push("/auth/register")}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
          >
            ثبت‌نام رایگان
            <UserPlus className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push("/auth/login")}
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
  );
}
