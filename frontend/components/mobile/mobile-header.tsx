// components/mobile/MobileHeader.tsx

import { SearchBox } from "../search/SearchBox";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border/40 px-3 py-3">
      <SearchBox placeholder="جستجو در آگهی‌ها..." />
    </header>
  );
}
