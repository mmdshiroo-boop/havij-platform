// hooks/useRegistrationGate.ts
// ============================================================
// محدودیت ۳ دقیقه‌ای برای ثبت‌نام
// کاربر ۳ دقیقه وقت داره فرم رو پر کنه
// اگه وقتش تموم شد، باید صفحه رو ریلود کنه
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";

const REGISTRATION_WINDOW_SECONDS = 180; // ۳ دقیقه

export function useRegistrationGate() {
  const [remaining, setRemaining] = useState<number>(
    REGISTRATION_WINDOW_SECONDS,
  );
  const [isExpired, setIsExpired] = useState(false);
  const [windowStarted, setWindowStarted] = useState(false);

  // شروع تایمر وقتی تب ثبت‌نام زده شد
  const startWindow = useCallback(() => {
    if (windowStarted) return;
    setWindowStarted(true);
    setRemaining(REGISTRATION_WINDOW_SECONDS);
  }, [windowStarted]);

  // شمارش معکوس
  useEffect(() => {
    if (!windowStarted || isExpired) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [windowStarted, isExpired]);

  // تبدیل ثانیه به دقیقه:ثانیه
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return {
    startWindow,
    isExpired,
    remaining,
    timeDisplay,
    message: isExpired
      ? "زمان ثبت‌نام به پایان رسید. لطفاً صفحه را ریلود کنید."
      : `برای ثبت‌نام ${timeDisplay} زمان دارید.`,
  };
}
