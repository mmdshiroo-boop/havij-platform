/* ============================================================
 * صفحه خطای پیش‌بینی‌نشده
 * کامپوننت Error Boundary برای Next.js App Router
 * طراحی: RTL، فارسی، تم نارنجی، Tailwind CSS
 * ============================================================ */

"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Copy, Check } from "lucide-react";
import { useState } from "react";

/**
 * صفحه خطای سرور
 * این کامپوننت به‌صورت خودکار توسط Next.js هنگام بروز خطا در رندر ریشه‌ای نمایش داده می‌شود.
 * پارامتر error حاوی پیام خطاست و reset باعث ری‌رندر مجدد بخش خطادار می‌شود.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  /** وضعیت کپی کردن شناسه خطا */
  const [copied, setCopied] = useState(false);

  /** کپی کردن digest خطا برای گزارش */
  const handleCopyDigest = async () => {
    if (error.digest) {
      try {
        await navigator.clipboard.writeText(error.digest);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-lg text-center space-y-8">
        {/* تصویرسازی CSS */}
        <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
          <div className="absolute inset-0 rounded-full bg-red-50 animate-pulse" />
          <div className="absolute inset-3 rounded-full border-2 border-dashed border-orange-300/50 animate-[spin_15s_linear_infinite_reverse]" />
          <div className="absolute inset-6 rounded-full border border-orange-200/40" />

          <div className="relative z-10">
            <div className="bg-orange-100 p-5 rounded-3xl shadow-lg shadow-orange-200/50">
              <AlertTriangle
                className="w-16 h-16 text-orange-500"
                strokeWidth={1.5}
              />
            </div>
            <span className="absolute -top-2 -right-3 w-3 h-3 rounded-full bg-orange-400 animate-ping" />
            <span className="absolute -bottom-1 -left-2 w-2 h-2 rounded-full bg-red-400 animate-ping [animation-delay:0.5s]" />
          </div>
        </div>

        {/* عنوان و توضیحات */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-orange-500 tracking-tight">
            خطا!
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            خطایی پیش‌بینی‌نشده رخ داد
          </h2>
          <p className="text-gray-500 max-w-md mx-auto leading-7">
            متأسفانه در پردازش درخواست شما مشکلی پیش آمده است. این مشکل موقتی
            است و تیم فنی در حال بررسی آن می‌باشد. لطفاً دوباره تلاش کنید.
          </p>
        </div>

        {/* نمایش جزئیات خطا (در محیط توسعه) */}
        {error.message && process.env.NODE_ENV === "development" && (
          <div className="max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-2xl p-4 text-right">
            <p className="text-xs font-mono text-red-500 break-all leading-6">
              {error.message}
            </p>
          </div>
        )}

        {/* شناسه خطا (در صورت وجود) */}
        {error.digest && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">
              شناسه خطا:{" "}
              <code className="font-mono text-gray-500">{error.digest}</code>
            </span>
            <button
              onClick={handleCopyDigest}
              className="text-gray-400 hover:text-orange-500 transition-colors"
              title="کپی شناسه خطا"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* دکمه‌های عملیاتی */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium px-6 py-3 rounded-2xl shadow-md shadow-orange-200 transition-all hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            تلاش مجدد
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 font-medium px-6 py-3 rounded-2xl transition-all hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            بازگشت به صفحه اصلی
          </Link>
        </div>

        {/* راهنمای کاربر */}
        <div className="max-w-sm mx-auto bg-orange-50/70 border border-orange-100 rounded-2xl p-5 text-right space-y-3">
          <p className="text-sm font-medium text-orange-700">
            چکار می‌توانم بکنم؟
          </p>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>صفحه را رفرش کنید و دوباره تلاش نمایید</li>
            <li>اگر از لینک خارجی استفاده کرده‌اید، آدرس را بررسی کنید</li>
            <li>بعد از چند دقیقه دوباره مراجعه کنید</li>
            <li>در صورت تداوم مشکل با پشتیبانی تماس بگیرید</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
