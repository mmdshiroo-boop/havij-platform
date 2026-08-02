import { Suspense } from "react";
import { Header } from "@/components/common/header";
import { BottomNav } from "@/components/mobile/bottom-nav";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      {/* Header فقط دسکتاپ */}
      <div className="hidden md:block border-b border-border/40">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
      </div>

      {/* محتوای فرم */}
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-10 md:py-14 pb-24 md:pb-14">
        {children}
      </main>

      {/* BottomNav فقط موبایل */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}