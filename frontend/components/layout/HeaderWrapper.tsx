"use client"; // این خط الزامی است چون از هوک استفاده می‌کنیم

import { usePathname } from "next/navigation";
import { Header } from "../common/header";

export default function HeaderWrapper() {
  const pathname = usePathname();

  // اگر صفحه اصلی بود نمایش بده، در غیر این صورت null برگردان (مخفی کن)
  if (pathname !== "/") {
    return null;
  }

  return <Header />;
}
