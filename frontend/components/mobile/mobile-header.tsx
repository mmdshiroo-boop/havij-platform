// components/mobile/MobileHeader.tsx
import { SearchBox } from "../search/SearchBox";
import { NotificationBell } from "../notifcation/NotificationBell";
import { ThemeToggle } from "../common/theme-toggle";
import { MainLinksSheet } from "../common/header";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border/40 px-3 py-2 flex items-center gap-2">
      {/* دکمهٔ منو — فقط به اندازهٔ آیکون (حدود ۲۰٪ عرض) */}
      <div className="w-[10%] min-w-[48px] flex items-center justify-start">
        <MainLinksSheet />
      </div>

      {/* جستجو — تمام فضای باقی‌مانده (بزرگ‌تر از قبل) */}
      <div className="flex-1">
        <SearchBox placeholder="جستجو در آگهی‌ها..." className="w-full" />
      </div>

      {/* آیکون‌های سمت چپ */}
      <div className="flex items-center gap-1 shrink-0">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}