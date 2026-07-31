"use client";

import AdsListWithFilter from "@/components/search/AdsListWithFilter";
import { useParams } from "next/navigation";

export default function CategorySlugPage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return null;

  // دقیقاً همان کامپوننت جستجو، اما با category از پیش تعیین‌شده
  return (
    <AdsListWithFilter initialFilters={{ category: slug }} defaultLimit={20} />
  );
}
