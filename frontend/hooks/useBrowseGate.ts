"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════════
   useBrowseGate — دیوار ثبت‌نام بر اساس تعداد آگهی دیده‌شده
   بعد از ۲۰ آگهی، صفحه کامل بلو میشه تا ثبت‌نام کنن
   ═══════════════════════════════════════════════════════════════════════════════ */

const MAX_FREE_ADS = 20;

export function useBrowseGate(isLoggedIn: boolean) {
  const pathname = usePathname();
  const [shouldBlock, setShouldBlock] = useState(false);
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    // ─── لاگین شد → دیوار بردار + شمارنده پاک کن ───
    if (isLoggedIn) {
      setShouldBlock(false);
      if (!wasLoggedIn.current) {
        sessionStorage.removeItem("browse_ad_count");
        wasLoggedIn.current = true;
      }
      return;
    }

    // ─── خارج شد → ریست کن ───
    wasLoggedIn.current = false;

    // ─── صفحات احراز هویت → بلوک نشه ───
    if (pathname.startsWith("/auth")) {
      setShouldBlock(false);
      return;
    }

    // ─── شمارنده آگهی‌ها ───
    const adCount = parseInt(
      sessionStorage.getItem("browse_ad_count") || "0",
      10,
    );

    if (adCount >= MAX_FREE_ADS) {
      setShouldBlock(true);
    } else {
      setShouldBlock(false);
    }
  }, [pathname, isLoggedIn]);

  return { shouldBlock };
}
