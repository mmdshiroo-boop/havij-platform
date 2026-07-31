"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

/**
 * CookieConsentBanner — نسخه سفارشی (بدون react-cookie-consent)
 * -------------------------------------------------
 * کتابخانه react-cookie-consent با React 19 / Next.js 16 سازگار نیست
 * و داخلی‌اش فرم و event handler رندر می‌کند که خطای Server Component می‌دهد.
 * این نسخه کاملاً سفارشی است و هیچ وابستگی خارجی ندارد.
 */

const COOKIE_KEY = "cookie_consent_accepted";
const COOKIE_DAYS = 365;

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // بررسی اینکه آیا قبلاً کاربر تایید کرده
    const accepted = document.cookie
      .split("; ")
      .find((row) => row.startsWith(COOKIE_KEY + "="));

    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_DAYS);
    document.cookie = `${COOKIE_KEY}=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    setVisible(false);
  };

  const declineCookies = () => {
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_DAYS);
    document.cookie = `${COOKIE_KEY}=false; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-4 sm:p-6 backdrop-blur-xl bg-opacity-95">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* متن توضیحات */}
          <div className="flex-1 text-right">
            <p className="text-sm font-bold text-foreground mb-1">
              🍪 استفاده از کوکی‌ها
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ما از کوکی‌ها برای بهبود تجربه کاربری، تحلیل ترافیک و ارائه محتوای
              شخصی‌سازی‌شده استفاده می‌کنیم. با ادامه استفاده از سایت، با{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline font-semibold"
              >
                سیاست حریم خصوصی
              </Link>{" "}
              ما موافقت می‌کنید.
            </p>
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={declineCookies}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-200 cursor-pointer"
            >
              رد کردن
            </button>
            <button
              onClick={acceptCookies}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all duration-200 cursor-pointer"
            >
              تایید و ادامه
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
