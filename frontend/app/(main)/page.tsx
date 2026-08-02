//app/main/page

"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { adsApi, Ad } from "@/services/api/ads.api";
import { categoryApi, Category } from "@/services/api/category.api";
import { locationApi, Province } from "@/services/api/location.api";
import AdFeed from "@/components/common/AdFeed";
import { FullPageSpinner } from "@/components/ui/skeletons";
import { HeroSection } from "@/components/home/HeroSection";
import { MobileCategories } from "@/components/mobile/mobile-categories";

// ✅ کامپوننت داخلی جداگانه
function HomePageContent() {
  const [latestAds, setLatestAds] = useState<Ad[]>([]);
  const [urgentAds, setUrgentAds] = useState<Ad[]>([]);
  const [popularAds, setPopularAds] = useState<Ad[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const [allCategories, provs, latest, urgent, popular] =
          await Promise.all([
            categoryApi.getAll(),
            locationApi.getProvinces(),
            adsApi.getAll({ sortBy: "newest", limit: 8 }),
            adsApi.getAll({ isUrgent: true, limit: 8 }),
            adsApi.getAll({ sortBy: "most_viewed", limit: 8 }),
          ]);

        setCategories(allCategories);
        setProvinces(provs);
        setLatestAds(latest.data);
        setUrgentAds(urgent.data);
        setPopularAds(popular.data);
      } catch (e) {
        console.error("Error fetching initial data:", e);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  if (initialLoading) {
    return <FullPageSpinner />;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full md:hidden">
        <MobileCategories />
      </div>

      <main className="w-full mt-2 md:mt-6 space-y-6">
        <div className="hidden md:block">
          <HeroSection />
        </div>

        <AdFeed
          isFiltered={false}
          filterLoading={false}
          filteredAds={[]}
          urgentAds={urgentAds}
          popularAds={popularAds}
          latestAds={latestAds}
          categories={categories}
          appliedCategory=""
          appliedCity=""
          appliedMinPrice=""
          appliedMaxPrice=""
          appliedOnlyWithImage={false}
          appliedOnlyUrgent={false}
          currentPage={currentPage}
          totalPages={1}
          handleCategoryChange={() => {}}
          handleCityChange={() => {}}
          setAppliedMinPrice={() => {}}
          setAppliedMaxPrice={() => {}}
          setAppliedOnlyWithImage={() => {}}
          setAppliedOnlyUrgent={() => {}}
          setCurrentPage={setCurrentPage}
          clearFilters={() => {}}
        />
      </main>
    </div>
  );
}

// ✅ صفحه اصلی با Suspense wrap شده
export default function HomePage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <HomePageContent />
    </Suspense>
  );
}