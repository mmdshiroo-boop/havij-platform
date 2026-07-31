// app/panel/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { PanelHeader } from "@/components/panel/PanelHeader";
import { PanelSidebar } from "@/components/layout/PanelSidebar";
import { BottomNav } from "@/components/mobile/bottom-nav";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ─── ۱. اگر لاگین نکرده، بره صفحه لاگین ───
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // ─── ۲. اگر نقش کاربر با مسیر پنل هماهنگ نیست ───
  useEffect(() => {
    if (!user || loading) return;

    const segments = pathname.split("/").filter(Boolean);
    // segments[0] = "panel", segments[1] = role (vip, admin, ...)
    const urlRole = segments[1];

    // فقط admin و super_admin میتونن پنل بقیه رو ببینن
    const canAccessAll = user.role === "admin" || user.role === "super_admin";

    if (urlRole && user.role !== urlRole && !canAccessAll) {
      router.replace(`/panel/${user.role}/dashboard`);
    }
  }, [user, loading, pathname, router]);

  // ─── ۳. حالت لودینگ ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">
            در حال بارگذاری پنل...
          </p>
        </div>
      </div>
    );
  }

  // ─── ۴. اگر کاربر وجود نداره، چیزی رندر نکن ───
  if (!user) return null;

  // ─── ۵. چک نقش (فال‌بک به userDashboard) ───
  const urlRole = pathname.split("/")[2];

  // اگه urlRole نداشته باشیم یا نادرست باشه
  if (!urlRole && pathname === "/panel") {
    const dashboardPath =
      user.role === "admin" || user.role === "super_admin"
        ? `/panel/${user.role}`
        : `/panel/${user.role}/dashboard`;
    router.replace(dashboardPath);
    return null;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20"
      dir="rtl"
    >
      {/* ─── هدر مشترک بالای صفحه ─── */}
      <PanelHeader />

      {/* ─── بدنه: سایدبار + محتوا ─── */}
      <div className="flex relative min-h-[calc(100vh-64px)]">
        {/* سایدبار دسکتاپ - ثابت */}
        <aside className="hidden lg:flex flex-col w-64 border-l border-border/30 bg-background/60 backdrop-blur-xl fixed right-0 top-16 bottom-0 z-30 overflow-y-auto shadow-sm">
          <PanelSidebar />
        </aside>

        {/* اسپیسر برای سایدبار ثابت */}
        <div className="hidden lg:block w-64 shrink-0" />

        {/* محتوای اصلی */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
      {/* ─── نوبار موبایل ثابت در پایین ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <BottomNav />
      </div>
    </div>
  );
}
