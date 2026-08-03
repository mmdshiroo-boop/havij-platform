"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Flame,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  ArrowUp,
  Tag,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdCard } from "../home/AdCard";
import { Skeleton } from "../ui/skeleton";
import { AdBanner } from "@/components/common/AdBanner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────
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

// ─── Section Header ──────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  colorClass,
  actionHref,
  actionLabel,
}: {
  icon: React.ElementType;
  title: string;
  colorClass?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5 max-sm:px-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-muted/60 ${colorClass || "text-primary"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-base md:text-lg font-extrabold tracking-tight">
          {title}
        </h2>
      </div>
      {actionHref && (
        <Link
          href={actionHref}
          className="group text-sm font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all"
        >
          {actionLabel || "مشاهده همه"}
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
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
  const activeFilters: { label: string; icon?: React.ElementType; onRemove: () => void }[] = [];
  if (appliedCategory) {
    const cat = categories.find((c) => c.slug === appliedCategory);
    activeFilters.push({
      label: cat?.name || appliedCategory,
      icon: Tag,
      onRemove: () => handleCategoryChange(""),
    });
  }
  if (appliedCity) {
    activeFilters.push({
      label: appliedCity,
      icon: MapPin,
      onRemove: () => handleCityChange(""),
    });
  }
  if (appliedMinPrice) {
    activeFilters.push({
      label: `حداقل ${Number(appliedMinPrice).toLocaleString("fa-IR")} تومان`,
      icon: undefined,
      onRemove: () => setAppliedMinPrice(""),
    });
  }
  if (appliedMaxPrice) {
    activeFilters.push({
      label: `حداکثر ${Number(appliedMaxPrice).toLocaleString("fa-IR")} تومان`,
      icon: undefined,
      onRemove: () => setAppliedMaxPrice(""),
    });
  }
  if (appliedOnlyWithImage) {
    activeFilters.push({
      label: "فقط عکس‌دار",
      icon: undefined,
      onRemove: () => setAppliedOnlyWithImage(false),
    });
  }
  if (appliedOnlyUrgent) {
    activeFilters.push({
      label: "فقط فوری",
      icon: undefined,
      onRemove: () => setAppliedOnlyUrgent(false),
    });
  }

  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-0 md:px-4 relative">
      {/* ═══════════════ FILTERED RESULTS ═══════════════ */}
      {isFiltered && (
        <section className="mt-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 max-sm:px-4"
          >
            <div>
              <h2 className="text-lg md:text-2xl font-black flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                نتایج جستجو و فیلتر
              </h2>
              {!filterLoading && (
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredAds.length} آگهی یافت شد
                </p>
              )}
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                {activeFilters.map((f, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer gap-1 pl-2 pr-1 py-1.5 text-xs font-medium bg-muted/80 backdrop-blur-sm border border-border/50"
                    onClick={f.onRemove}
                  >
                    {f.icon && <f.icon className="w-3 h-3 ml-0.5" />}
                    {f.label}
                    <X className="w-3 h-3 mr-0.5 hover:text-destructive transition-colors" />
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 px-3 text-xs text-destructive hover:bg-destructive/10 rounded-full"
                >
                  پاک‌سازی همه
                </Button>
              </div>
            )}
          </motion.div>

          {filterLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-sm:px-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[280px] rounded-2xl" />
              ))}
            </div>
          ) : filteredAds.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 border-2 border-dashed border-border/60 rounded-3xl bg-muted/5 max-sm:mx-4 flex flex-col items-center gap-4"
            >
              <Search className="w-16 h-16 opacity-20" />
              <h3 className="font-bold text-xl">هیچ آگهی‌ای با این شرایط پیدا نشد</h3>
              <p className="text-muted-foreground max-w-md">
                شاید این جستجوها را دوست داشته باشید:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["آپارتمان تهران", "خودرو زیر ۵۰۰ میلیون", "اجاره روزانه"].map((q) => (
                  <Link
                    key={q}
                    href={`/search?q=${encodeURIComponent(q)}`}
                    className="px-4 py-2 bg-card border border-border/60 rounded-full text-sm font-medium hover:bg-primary/5 hover:border-primary/40 transition-all"
                  >
                    {q}
                  </Link>
                ))}
              </div>
              <Button variant="outline" onClick={clearFilters} className="mt-2 gap-2">
                <X className="w-4 h-4" /> پاک کردن فیلترها
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-3 max-sm:border-t max-sm:border-border/40 auto-rows-fr">
                {filteredAds.map((ad, index) => (
                  <React.Fragment key={ad._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      whileHover={{ y: -4 }}
                      className="h-full transition-shadow"
                    >
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
                    </motion.div>
                    {/* بنر جستجو بعد از هر 8 آگهی */}
                    {(index + 1) % 8 === 0 && (
                      <div className="col-span-full w-full py-4 max-sm:px-4">
                        <AdBanner position="search_top" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 pb-8">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg min-w-[2.5rem] ${page === currentPage ? "shadow-md" : ""}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ═══════════════ DEFAULT SECTIONS ═══════════════ */}
      {!isFiltered && (
        <div className="space-y-6 md:space-y-8 mt-6 md:mt-10">
          {/* فوری‌ها */}
          {urgentAds.length > 0 && (
            <section id="urgent-ads">
              <SectionHeader
                icon={Flame}
                title="فروش فوری"
                colorClass="text-red-500"
                actionHref="/search?urgent=true"
                actionLabel="همه فوری‌ها"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-3 max-sm:border-t max-sm:border-border/40 auto-rows-fr">
                {urgentAds.slice(0, 8).map((ad, index) => (
                  <React.Fragment key={ad._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      whileHover={{ y: -4 }}
                      className="h-full transition-shadow"
                    >
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
                    </motion.div>
                    {/* بنر بعد از آگهی چهارم (مطابق کد اصلی) */}
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

     {popularAds.length > 0 && (
  <section id="popular-ads">
    <SectionHeader
      icon={TrendingUp}
      title="همه آگهی‌ها در ایران"
      actionHref="/search"
      actionLabel="مشاهده همه"
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-3 max-sm:border-t max-sm:border-border/40">
      {popularAds.map((ad, index) => (
        <React.Fragment key={ad._id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            whileHover={{ y: -4 }}
            className="flex flex-col h-full transition-shadow"
          >
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
          </motion.div>
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
            <section id="latest-ads">
              <SectionHeader
                icon={Clock}
                title="آخرین آگهی‌های ثبت شده"
                colorClass="text-orange-500"
                actionHref="/search?sort=newest"
                actionLabel="آگهی‌های جدید"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-3 max-sm:border-t max-sm:border-border/40 auto-rows-fr">
                {latestAds.map((ad, index) => (
                  <React.Fragment key={ad._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      whileHover={{ y: -4 }}
                      className="h-full transition-shadow"
                    >
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
                    </motion.div>
                    {/* بنر هر 4 آگهی یکبار */}
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
        </div>
      )}

      {/* دکمه برگشت به بالا */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}