"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateMobileHeader() {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 border-b border-border bg-background/80 backdrop-blur-md md:hidden"
      dir="rtl"
    >
      {/* دکمه بازگشت و عنوان */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="rounded-full hover:bg-accent shrink-0 transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-foreground" />
        </Button>
        <span
          className="font-bold text-base text-foreground cursor-pointer"
          onClick={() => router.push("/")}
        >
          برگشت
        </span>
      </div>

      {/* بخش خالی برای حفظ تعادل هدر (Symmetry) */}
      <div className="w-10" />
    </header>
  );
}
