"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  DollarSign,
  Image as ImageIcon,
  Flame,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdCard } from "../home/AdCard";
import { Skeleton } from "../ui/skeleton";
import { AdBanner } from "@/components/common/AdBanner";

interface AdFeedProps {
  isFiltered: boolean;
  filterLoading: boolean;
  filteredAds: any[];
  urgentAds: any[];
  popularAds: any[];
  latestAds: any[];
  categories: any[];
  appliedCategory: string;
  appliedCity: string;
  appliedMinPrice: string;
  appliedMaxPrice: string;
  appliedOnlyWithImage: boolean;
  appliedOnlyUrgent: boolean;
  currentPage: number;
  totalPages: number;
  handleCategoryChange: (slug: string) => void;
  handleCityChange: (city: string) => void;
  setAppliedMinPrice: (price: string) => void;
  setAppliedMaxPrice: (price: string) => void;
  setAppliedOnlyWithImage: (value: boolean) => void;
  setAppliedOnlyUrgent: (value: boolean) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  clearFilters: () => void;
}

export default function AdFeed({
  isFiltered,
  filterLoading,
  filteredAds,
  urgentAds,
  popularAds,
  latestAds,
  categories,
  appliedCategory,
  appliedCity,
  appliedMinPrice,
  appliedMaxPrice,
  appliedOnlyWithImage,
  appliedOnlyUrgent,
  currentPage,
  totalPages,
  handleCategoryChange,
  handleCityChange,
  setAppliedMinPrice,
  setAppliedMaxPrice,
  setAppliedOnlyWithImage,
  setAppliedOnlyUrgent,
  setCurrentPage,
  clearFilters,
}: AdFeedProps) {
  return (
    <>
      {isFiltered && (
        <section className="mt-8 mb-12 animate-in fade-in-50 duration-300">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5 max-sm:px-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                نتایج جستجو و فیلتر آگهی‌ها
              </h2>
              {/* خلاصه کردن نمایش تگ‌ها برای تمیزی کد (در فایل اصلی شما وجود دارند) */}
            </div>
          </div>

          {filterLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-4 max-sm:border-t max-sm:border-border/40">
              {/* Skeletons... */}
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border/60 rounded-3xl text-muted-foreground bg-muted/5 max-sm:mx-4">
              <p className="font-bold text-sm">هیچ آگهی مشخصی پیدا نشد</p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
              >
                پاک کردن فیلترها
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-4 max-sm:border-t max-sm:border-border/40">
                {filteredAds.map((ad, index) => (
                  <React.Fragment key={ad._id}>
                    <AdCard
                      _id={ad._id}
                      title={ad.title}
                      price={ad.price || 0}
                      city={ad.city}
                      district={ad.district}
                      images={ad.images}
                      createdAt={ad.createdAt}
                      isUrgent={ad.isUrgent}
                      isVerified={ad.isVerified}
                      adType={ad.adType}
                      userRole={ad.userId?.role}
                    />

                    {/* تزریق بنر در صفحه جستجو بعد از هر 8 آگهی */}
                    {(index + 1) % 8 === 0 && (
                      <div className="col-span-full w-full py-4 max-sm:px-4">
                        <AdBanner position="search_top" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* بخش Pagination (دست‌نخورده) ... */}
            </>
          )}
        </section>
      )}

      {!isFiltered && (
        <div className="space-y-12 mt-8">
          {/* آگهی‌های فوری */}
          {urgentAds.length > 0 && (
            <section className="border p-4 rounded-2xl max-sm:border-0 max-sm:p-0 max-sm:rounded-none">
              <div className="flex justify-between items-center mb-5 max-sm:px-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                  <h2 className="text-base font-black tracking-tight text-red-600">
                    فروش فوری
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-4 max-sm:border-t max-sm:border-border/40">
                {urgentAds.map((ad, index) => (
                  <React.Fragment key={ad._id}>
                    <AdCard
                      {...ad}
                      price={ad.price || 0}
                      userRole={ad.userId?.role}
                    />

                    {/* در صفحه اصلی چون تعداد آگهی‌ها محدود به 8 است، بنر بعد از آگهی 4 نمایش داده می‌شود */}
                    {index + 1 === 4 && (
                      <div className="col-span-full w-full py-4 max-sm:px-4">
                        <AdBanner position="home_top" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          {/* آگهی‌های پربازدید */}
          {popularAds.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-5 max-sm:px-4 max-sm:mt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-black tracking-tight">
                    همه آگهی ها در ایران
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-4 max-sm:border-t max-sm:border-border/40">
                {popularAds.map((ad, index) => (
                  <React.Fragment key={ad._id}>
                    <AdCard
                      {...ad}
                      price={ad.price || 0}
                      userRole={ad.userId?.role}
                    />
                    {(index + 1) % 4 === 0 && (
                      <div className="col-span-full w-full py-4 max-sm:px-4">
                        <AdBanner position="home_top" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          {/* آخرین آگهی‌ها */}
          {latestAds.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-5 max-sm:px-4 max-sm:mt-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h2 className="text-base font-black tracking-tight">
                    آخرین آگهی‌های ثبت شده
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-4 max-sm:border-t max-sm:border-border/40">
                {latestAds.map((ad, index) => (
                  <React.Fragment key={ad._id}>
                    <AdCard
                      {...ad}
                      price={ad.price || 0}
                      userRole={ad.userId?.role}
                    />

                    {/* قرار دادن یک بنر دیگر بعد از 4 آگهی در این بخش */}
                    {index + 1 === 4 && (
                      <div className="col-span-full w-full py-4 max-sm:px-4">
                        <AdBanner position="home_top" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
