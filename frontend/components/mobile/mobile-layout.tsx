"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MobileHeader } from "./mobile-header";
import { BottomNav } from "./bottom-nav";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string; // عنوان هدر صفحه
  showBack?: boolean; // نمایش دکمه بازگشت در هدر
  showNav?: boolean; // نمایش یا عدم نمایش نوار ناوبری پایین
  headerAction?: React.ReactNode; // دکمه یا آیکون اختصاصی سمت چپ هدر
}

export function MobileLayout({
  children,
  title,
  showBack = false,
  showNav = true,
  headerAction,
}: MobileLayoutProps) {
  const pathname = usePathname();

  // 🔴 تشخیص هوشمند: آیا کاربر داخل یک گفتگوی فعال است؟ (مثلاً /chat/65a123...)
  const isInsideActiveChat =
    pathname?.startsWith("/chat/") && pathname.split("/").length > 2;

  // اگر داخل چت بود، ناوبری پایین کلاً نباید رندر شود
  const shouldRenderNav = showNav && !isInsideActiveChat;

  return (
    <div className="flex justify-center min-h-screen bg-slate-100 dark:bg-zinc-950">
      {/* شبیه‌ساز بدنه موبایل (در دسکتاپ وسط‌چین و محدود می‌شود، در موبایل تمام‌صفحه) */}
      <div className="relative flex flex-col w-full max-w-md min-h-screen bg-white dark:bg-zinc-900 shadow-xl border-x border-slate-200/50 dark:border-zinc-800">
        {/* هدر بالایی موبایل (در صورت داشتن عنوان نشان داده می‌شود) */}
        {title && (
        <MobileHeader {...({ title, showBack, action: headerAction } as any)} />

        )}

        {/* 
          محتوای اصلی صفحه 
          🔴 اصلاح ساختاری: اگر کاربر داخل چت باشد، کلاس‌های p-0 و overflow-hidden اعمال می‌شوند
          تا کامپوننت چت کل فضا را بگیرد و اسکرول دوتایی ایجاد نشود.
        */}
        <main
          className={cn(
            "flex-1 flex flex-col",
            isInsideActiveChat
              ? "overflow-hidden p-0 pt-0" // حالت تمام‌صفحه و اختصاصی برای چت روان موبایل
              : `overflow-y-auto px-4 pb-24 ${title ? "pt-16" : "pt-4"}`, // حالت استاندارد برای بقیه صفحات
          )}
        >
          {children}
        </main>

        {/* نوار ناوبری پایینی موبایل - فقط در صورتی که داخل چت نباشد نشان داده می‌شود */}
        {shouldRenderNav && <BottomNav />}
      </div>
    </div>
  );
}
