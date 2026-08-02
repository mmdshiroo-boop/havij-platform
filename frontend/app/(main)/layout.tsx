"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/common/Footer";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { Header } from "@/components/common/header";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { useLocationTracking } from "@/hooks/useLocationTracking";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useLocationTracking();

  const pathname = usePathname();
  const isAdDetail = pathname.startsWith("/ad/");

  // شرط برای تشخیص صفحات چت
  const isChat = pathname.startsWith("/chat");

  // شرط برای تشخیص صفحه اصلی (مخصوص موبایل)
  const isHome = pathname === "/";

  return (
    /* 
      اگر در صفحه چت بودیم، ارتفاع کل صفحه روی h-[100dvh] قفل می‌شود 
      تا هدر دسکتاپ لود شود و چت دقیقاً باقی‌مانده ارتفاع را بدون اسکرول سراسری پر کند.
    */
    <div
      className={`flex flex-col relative ${isChat ? "h-[100dvh] overflow-hidden" : "min-h-screen"}`}
    >
      {/* ۱. هدر دسکتاپ و تبلت (با کلاس shrink-0 تا فشرده نشود) */}
      <div className="hidden md:block w-full shrink-0">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
      </div>

      {/* ۲. هدر موبایل: فقط در صفحه اصلی (/) */}
      {isHome && (
        <div className="md:hidden w-full shrink-0">
          <MobileHeader />
        </div>
      )}

      {/* 
        محتوای اصلی: 
        کلاس min-h-0 برای صفحات چت حیاتی است تا مرورگر اجازه دهد محتوای داخلی چت اسکرول بخورد.
      */}
      <main
        className={`flex-1 w-full min-h-0 ${!isAdDetail && !isChat ? "max-w-[1400px] mx-auto pb-20 md:pb-6" : ""}`}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </main>

      {/* فوتر و نویگیشن پایین */}
      {!isAdDetail && (
        <>
          {/* فوتر دسکتاپ در صفحه چت مخفی می‌شود */}
          {!isChat && (
            <div className="hidden md:block shrink-0">
              <Footer />
            </div>
          )}

          {/* 
            نویگیشن پایین موبایل:
            به این تگ یک id دادیم تا بتوانیم در صورت باز بودن گفتگو در موبایل، 
            آن را به صورت پویا مخفی کنیم.
          */}
          <div id="mobile-bottom-nav" className="md:hidden shrink-0">
            <BottomNav />
          </div>
        </>
      )}
    </div>
  );
}
