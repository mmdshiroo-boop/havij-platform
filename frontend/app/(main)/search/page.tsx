"use client";

import { Suspense } from "react";
import { FullPageSpinner } from "@/components/ui/skeletons";
import AdsListWithFilter from "@/components/search/AdsListWithFilter";

export default function SearchPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<FullPageSpinner />}>
        <AdsListWithFilter />
      </Suspense>
    </div>
  );
}
