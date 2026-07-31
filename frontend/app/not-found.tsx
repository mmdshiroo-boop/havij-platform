/* ============================================================
 * صفحه ۴۰۴ - آگهی یاب
 * صفحه نمایش داده‌شده وقتی مسیر درخواستی یافت نمی‌شود
 * طراحی: RTL، فارسی، تم نارنجی، Tailwind CSS
 * ============================================================ */
"use client"
import Link from "next/link";
import { Home, Search, Building2, MapPin, KeyRound, ArrowRight } from "lucide-react";

/** دسته‌بندی‌های پیشنهادی برای جستجوی سریع */
const suggestedCategories = [
  { label: "آپارتمان", href: "/search?type=apartment", icon: Building2 },
  { label: "ویلا", href: "/search?type=villa", icon: Home },
  { label: "زمین", href: "/search?type=land", icon: MapPin },
  { label: "اجاره", href: "/search?deal=rent", icon: KeyRound },
];

export default function NotFound() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4 py-12">
      {/* ---- کنتینر اصلی ---- */}
      <div className="w-full max-w-2xl text-center space-y-10">

        {/* ---- بخش تصویرسازی CSS ---- */}
        <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
          {/* دایره‌های پس‌زمینه */}
          <div className="absolute inset-0 rounded-full bg-orange-100/70 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-orange-200/40" />
          <div className="absolute inset-8 rounded-full border-2 border-dashed border-orange-300/60 animate-[spin_20s_linear_infinite]" />

          {/* آیکون ساختمان اصلی */}
          <div className="relative z-10 flex flex-col items-center">
            <Building2
              className="w-20 h-20 text-orange-400 drop-shadow-lg"
              strokeWidth={1.2}
            />
            {/* علامت سؤال روی ساختمان */}
            <span className="absolute -top-1 -right-2 text-3xl font-black text-orange-600 select-none">
              ؟
            </span>
          </div>

          {/* المان‌های تزئینی شناور */}
          <div className="absolute top-4 left-6 w-4 h-4 rounded-full bg-orange-300 animate-bounce [animation-delay:0.3s]" />
          <div className="absolute bottom-8 right-8 w-3 h-3 rounded-sm bg-orange-400 rotate-45 animate-bounce [animation-delay:0.7s]" />
          <div className="absolute top-12 right-4 w-5 h-5 rounded-full border-2 border-orange-300 animate-bounce [animation-delay:0.5s]" />
        </div>

        {/* ---- عنوان و توضیحات ---- */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-orange-500 tracking-tight">
            ۴۰۴
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            صفحه‌ای که دنبالش بودید پیدا نشد
          </h2>
          <p className="text-gray-500 max-w-md mx-auto leading-7">
            متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد، حذف شده یا آدرس آن تغییر
            کرده است. می‌توانید از بخش‌های زیر کمک بگیرید.
          </p>
        </div>

        {/* ---- فیلد جستجوی سریع ---- */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative max-w-md mx-auto"
        >
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="مثلاً: آپارتمان ۲ خوابه در تهران"
            className="w-full pr-12 pl-4 py-3.5 rounded-2xl border-2 border-orange-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all text-sm"
            dir="rtl"
          />
          <button
            type="submit"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            جستجو
          </button>
        </form>

        {/* ---- دکمه‌های اصلی ---- */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium px-6 py-3 rounded-2xl shadow-md shadow-orange-200 transition-all hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            بازگشت به صفحه اصلی
          </Link>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 font-medium px-6 py-3 rounded-2xl transition-all hover:-translate-y-0.5"
          >
            <Search className="w-5 h-5" />
            جستجوی آگهی‌ها
          </Link>
        </div>

        {/* ---- لینک‌های پیشنهادی ---- */}
        <div className="pt-4">
          <p className="text-sm text-gray-400 mb-4">شاید به این بخش‌ها نیاز داشته باشید:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {suggestedCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-full px-4 py-2 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all"
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                  <ArrowRight className="w-3 h-3 rotate-180" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}