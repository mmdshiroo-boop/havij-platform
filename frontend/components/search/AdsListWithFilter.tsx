"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  Grid3X3,
  List,
  SearchX,
  MapPin,
  Loader2,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
} from "lucide-react";
import { AdvancedFilterModal } from "@/components/search/AdvancedFilterModal";
import { AdCard } from "../home/AdCard";
import { SearchBox } from "./SearchBox";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface SearchParams {
  q?: string;
  category?: string;
  province?: string;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  adType?: string;
  propertyType?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: string;
  floor?: string;
  floorCount?: string;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  documentType?: string;
  usage?: string;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasStorage?: boolean;
  hasBalcony?: boolean;
  hasYard?: boolean;
  heatingSystem?: string;
  coolingSystem?: string;
  flooring?: string;
  buildingFacade?: string;
  landWidth?: number;
  landLength?: number;
  landUsage?: string;
  officeType?: string;
  hasPool?: boolean;
  hasSauna?: boolean;
  isUrgent?: boolean;
  hasImage?: boolean;
  isVerified?: boolean;
}

interface PaginationInfo {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

interface AdItem {
  _id: string;
  title: string;
  price: number;
  userId?: { role?: string };
  priceString?: string;
  city: string;
  district?: string;
  images?: string[];
  createdAt: string;
  isUrgent?: boolean;
  isVerified?: boolean;
  adType?: string;
  propertyType?: string;
  area?: number;
  rooms?: number;
  floor?: number;
  yearBuilt?: number;
  description?: string;
}

interface AdsListWithFilterProps {
  initialFilters?: SearchParams;
  defaultLimit?: number;
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════ */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:5001";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toFa = (n: number) =>
  String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);

const formatPrice = (v: number) => {
  if (v >= 1e9) return `${toFa(Math.round(v / 1e9))} میلیارد`;
  if (v >= 1e6) return `${toFa(Math.round(v / 1e6))} میلیون`;
  if (v >= 1e3) return `${toFa(Math.round(v / 1e3))} هزار`;
  return toFa(v);
};

const getImageSrc = (img: string): string => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/uploads")) return `${API_BASE}${img}`;
  return `${API_BASE}/uploads/${img}`;
};

const AD_TYPE_LABELS: Record<string, string> = {
  sale: "فروش",
  rent: "اجاره",
  daily_rent: "اجاره روزانه",
  exchange: "معاوضه",
  mortgage: "رهن و اجاره",
  presale: "پیش‌فروش",
  construction: "مشارکت در ساخت",
};

const PROP_TYPE_LABELS: Record<string, string> = {
  apartment: "آپارتمان",
  villa: "ویلایی",
  house: "خانه حیاط‌دار",
  land: "زمین",
  suite: "سوئیت",
  office: "دفتر اداری",
  commercial: "مغازه تجاری",
  bare_land: "کلنگی",
  penthouse: "پنت‌هاوس",
  duplex: "دوبلکس",
  garden: "باغ",
  hotel: "مهمان‌پذیر",
};

const STRING_KEYS = new Set([
  "q", "category", "province", "city", "district",
  "rooms", "floor", "floorCount", "adType", "propertyType",
  "sortBy", "documentType", "usage", "heatingSystem", "coolingSystem",
  "flooring", "buildingFacade", "landUsage", "officeType",
]);

const countFilters = (p: SearchParams): number => {
  const skip = new Set(["page", "limit", "sortBy"]);
  let c = 0;
  for (const [k, v] of Object.entries(p)) {
    if (skip.has(k)) continue;
    if (v !== undefined && v !== null && v !== "" && v !== false) c++;
  }
  return c;
};

const parseInitialParams = (
  searchParams: URLSearchParams,
  initialFilters?: SearchParams,
): SearchParams => {
  if (initialFilters && Object.keys(initialFilters).length > 0)
    return initialFilters;

  const parsed: any = {};
  searchParams.forEach((value, key) => {
    if (value === "true") parsed[key] = true;
    else if (value === "false") parsed[key] = false;
    else if (!isNaN(Number(value)) && value !== "" && !STRING_KEYS.has(key))
      parsed[key] = Number(value);
    else parsed[key] = value;
  });
  return parsed;
};

/* ═══════════════════════════════════════════════════════
   SKELETON COMPONENTS
   ═══════════════════════════════════════════════════════ */

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-3 rounded-2xl border border-border/40"
        >
          <Skeleton className="w-32 sm:w-40 h-28 sm:h-32 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LIST VIEW CARD
   ═══════════════════════════════════════════════════════ */

function AdListItem({ ad }: { ad: AdItem }) {
  const img = ad.images?.[0] ? getImageSrc(ad.images[0]) : null;

  return (
    <Link
      href={`/ad/${ad._id}`}
      className="flex gap-4 p-3 rounded-2xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all group bg-card"
    >
      <div className="relative w-28 sm:w-36 md:w-40 h-24 sm:h-28 md:h-32 rounded-xl overflow-hidden bg-muted/20 shrink-0">
        {img ? (
          <img
            src={img}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <SearchX className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}
        {ad.isUrgent && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded">
            فوری
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1">
            {ad.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="line-clamp-1">
              {ad.district ? `${ad.city}، ${ad.district}` : ad.city}
            </span>
          </div>
          {ad.description && (
            <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed hidden sm:block">
              {ad.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5 sm:mt-2">
          <span className="font-black text-sm text-foreground">
            {ad.price === 0
              ? "توافقی"
              : ad.price
              ? `${ad.price.toLocaleString("fa-IR")} تومان`
              : ad.priceString || "توافقی"}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
            {ad.area != null && <span>{toFa(ad.area)} م²</span>}
            {ad.rooms != null && <span>{toFa(ad.rooms)} خوابه</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGINATION
   ═══════════════════════════════════════════════════════ */

function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;

  const nums = (): (number | "...")[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const r: (number | "...")[] = [1];
    if (page > 3) r.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(pages - 1, page + 1);
      i++
    )
      r.push(i);
    if (page < pages - 2) r.push("...");
    r.push(pages);
    return r;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-1 sm:gap-1.5 mt-8"
    >
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-xl text-sm disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </Button>
      {nums().map((n, i) =>
        n === "..." ? (
          <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={n}
            variant={page === n ? "default" : "outline"}
            size="icon"
            className="h-9 w-9 rounded-xl text-sm"
            onClick={() => onChange(n)}
          >
            {toFa(n)}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-xl text-sm disabled:opacity-40"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </Button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SORT OPTIONS
   ═══════════════════════════════════════════════════════ */

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین", icon: Clock },
  { value: "price_asc", label: "ارزان‌ترین", icon: TrendingDown },
  { value: "price_desc", label: "گران‌ترین", icon: TrendingUp },
  { value: "most_viewed", label: "پربازدیدترین", icon: Eye },
];

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function AdsListWithFilter({
  initialFilters,
  defaultLimit = 20,
}: AdsListWithFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pages: 1,
    total: 0,
    limit: defaultLimit,
  });

  const [applied, setApplied] = useState<SearchParams>(() =>
    parseInitialParams(searchParams, initialFilters),
  );

  const [categories, setCategories] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1_000_000_000 });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [contentKey, setContentKey] = useState(0);

  const LIMIT = defaultLimit;
  const isAppendingRef = useRef(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const provincesRef = useRef<any[]>([]);
  const citiesListRef = useRef<any[]>([]);
  const isUrlUpdateRef = useRef(false);

  useEffect(() => {
    provincesRef.current = provinces;
  }, [provinces]);

  // بارگذاری متادیتا
  useEffect(() => {
    let cancelled = false;
    const fetchMetaData = async () => {
      try {
        const { searchApi } = await import("@/services/api/search.api");
        const { categoryApi } = await import("@/services/api/category.api");
        const { locationApi } = await import("@/services/api/location.api");

        const [filterData, cats, provs] = await Promise.all([
          searchApi.getFilters().catch(() => ({
            cities: [],
            categories: [],
            priceRange: { min: 0, max: 1e9 },
          })),
          categoryApi.getAll().catch(() => []),
          locationApi.getProvinces().catch(() => []),
        ]);

        if (cancelled) return;
        setCategories(cats.length > 0 ? cats : filterData.categories || []);
        setProvinces(provs);
        setPriceRange(filterData.priceRange || { min: 0, max: 1e9 });
        citiesListRef.current = filterData.cities || [];
      } catch (err) {
        console.error("Metadata load error:", err);
      }
    };
    fetchMetaData();
    return () => { cancelled = true; };
  }, []);

  // همگام‌سازی URL → state (فقط وقتی URL از بیرون تغییر کند)
  useEffect(() => {
    if (isUrlUpdateRef.current) {
      isUrlUpdateRef.current = false;
      return;
    }
    const paramsFromUrl = parseInitialParams(searchParams, initialFilters);
    setApplied((prev) => {
      const isDiff =
        Object.keys(paramsFromUrl).length !== Object.keys(prev).length ||
        Object.entries(paramsFromUrl).some(
          ([k, v]) => prev[k as keyof SearchParams] !== v,
        );
      return isDiff ? paramsFromUrl : prev;
    });
  }, [searchParams]);

  // واکشی آگهی‌ها
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!isAppendingRef.current) {
        setLoading(true);
        setContentKey((k) => k + 1);
      }
      setError(null);

      try {
        const { searchApi } = await import("@/services/api/search.api");
        const p = applied;
        const apiParams: Record<string, any> = {
          page: p.page || 1,
          limit: LIMIT,
        };

        if (p.q) apiParams.q = p.q;
        if (p.category) apiParams.category = p.category;

        if (p.province) {
          if (/^[a-f0-9]{24}$/i.test(p.province)) {
            const prov = provincesRef.current.find(
              (pr: any) => pr._id === p.province,
            );
            apiParams.province = prov ? prov.name : p.province;
          } else {
            apiParams.province = p.province;
          }
        }

        if (p.city) apiParams.city = p.city;
        if (p.district) apiParams.district = p.district;
        if (p.minPrice && p.minPrice > 0) apiParams.minPrice = p.minPrice;
        if (p.maxPrice && p.maxPrice > 0) apiParams.maxPrice = p.maxPrice;
        if (p.adType) apiParams.adType = p.adType;
        if (p.propertyType) apiParams.propertyType = p.propertyType;
        if (p.sortBy) apiParams.sortBy = p.sortBy;
        if (p.minArea && p.minArea > 0) apiParams.minArea = p.minArea;
        if (p.maxArea && p.maxArea > 0) apiParams.maxArea = p.maxArea;
        if (p.rooms && p.rooms !== "any") apiParams.rooms = p.rooms;
        if (p.floor && p.floor !== "any") apiParams.floor = p.floor;
        if (p.floorCount && p.floorCount !== "any") apiParams.floorCount = p.floorCount;
        if (p.minYearBuilt && p.minYearBuilt > 0) apiParams.minYearBuilt = p.minYearBuilt;
        if (p.maxYearBuilt && p.maxYearBuilt > 0) apiParams.maxYearBuilt = p.maxYearBuilt;
        if (p.documentType) apiParams.documentType = p.documentType;
        if (p.usage) apiParams.usage = p.usage;
        if (p.heatingSystem) apiParams.heatingSystem = p.heatingSystem;
        if (p.coolingSystem) apiParams.coolingSystem = p.coolingSystem;
        if (p.flooring) apiParams.flooring = p.flooring;
        if (p.buildingFacade) apiParams.buildingFacade = p.buildingFacade;
        if (p.landWidth && p.landWidth > 0) apiParams.landWidth = p.landWidth;
        if (p.landLength && p.landLength > 0) apiParams.landLength = p.landLength;
        if (p.landUsage) apiParams.landUsage = p.landUsage;
        if (p.officeType) apiParams.officeType = p.officeType;
        if (p.hasElevator) apiParams.hasElevator = true;
        if (p.hasParking) apiParams.hasParking = true;
        if (p.hasStorage) apiParams.hasStorage = true;
        if (p.hasBalcony) apiParams.hasBalcony = true;
        if (p.hasYard) apiParams.hasYard = true;
        if (p.hasPool) apiParams.hasPool = true;
        if (p.hasSauna) apiParams.hasSauna = true;
        if (p.isUrgent) apiParams.isUrgent = true;
        if (p.hasImage) apiParams.hasImage = true;
        if (p.isVerified) apiParams.isVerified = true;

        let result: any;
        try {
          result = await searchApi.search(apiParams as any);
        } catch (apiErr: any) {
          if (apiErr.response?.status === 404) {
            result = { data: [], pagination: null };
          } else throw apiErr;
        }

        if (cancelled) return;

        // fallback استان اگر شهر نتیجه نداشت
        if (
          (!result.data || result.data.length === 0) &&
          !isAppendingRef.current &&
          p.city
        ) {
          let targetProvId = p.province;
          let targetProvName = "";

          if (targetProvId) {
            const found = provincesRef.current.find(
              (pr: any) => pr._id === targetProvId || pr.name === targetProvId,
            );
            targetProvName = found ? found.name : targetProvId;
          }

          if (!targetProvName) {
            for (const pr of provincesRef.current) {
              const cities = pr.cities || pr.counties || pr.children || [];
              if (cities.some((c: any) => (c.name || c) === p.city)) {
                targetProvId = pr._id || pr.name;
                targetProvName = pr.name;
                break;
              }
            }
          }

          toast.info(
            `آگهی در ${p.city} یافت نشد، جستجو در استان ${targetProvName || "مربوطه"}...`,
            { duration: 4000 },
          );

          setApplied((prev: any) => {
            const next = { ...prev };
            delete next.city;
            delete next.district;
            if (targetProvId) next.province = targetProvId;
            next.page = 1;
            return next;
          });
          return;
        }

        if (isAppendingRef.current) {
          setAds((prev) => {
            const existingIds = new Set(prev.map((a: any) => a._id));
            return [
              ...prev,
              ...(result.data || []).filter(
                (a: any) => !existingIds.has(a._id),
              ),
            ];
          });
          isAppendingRef.current = false;
        } else {
          setAds(result.data || []);
        }

        setPagination(
          result.pagination || { page: 1, pages: 1, total: 0, limit: LIMIT },
        );
      } catch (err: any) {
        if (cancelled) return;
        setError(err.response?.data?.message || err.message || "خطا در جستجو");
        if (!isAppendingRef.current) setAds([]);
        isAppendingRef.current = false;
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [applied, LIMIT]);

  // Infinite scroll (موبایل)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          window.innerWidth < 640 &&
          pagination.page < pagination.pages &&
          !loading &&
          !loadingMore &&
          !isAppendingRef.current
        ) {
          isAppendingRef.current = true;
          setLoadingMore(true);
          setApplied((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
        }
      },
      { threshold: 0.1 },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [pagination.page, pagination.pages, loading, loadingMore]);

  // همگام‌سازی state → URL
  useEffect(() => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(applied)) {
      if (v === undefined || v === null || v === "" || v === false) continue;
      if (k === "page" && v === 1) continue;
      if (k === "limit") continue;
      sp.set(k, String(v));
    }
    const qs = sp.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    const currentUrl = `${pathname}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;

    if (newUrl !== currentUrl) {
      isUrlUpdateRef.current = true;
      router.replace(newUrl, { scroll: false });
    }
  }, [applied]);

  /* ─── handlers ─────────────────────────────── */

  const handleApplyAdvanced = useCallback((filters: any) => {
    isAppendingRef.current = false;
    setApplied((prev) => {
      const next: any = { ...prev, page: 1 };
      const FILTER_KEYS = [
        "q", "category", "province", "city", "district",
        "minPrice", "maxPrice", "adType", "propertyType", "sortBy",
        "minArea", "maxArea", "rooms", "floor", "floorCount",
        "minYearBuilt", "maxYearBuilt", "documentType", "usage",
        "hasElevator", "hasParking", "hasStorage", "hasBalcony", "hasYard",
        "heatingSystem", "coolingSystem", "flooring", "buildingFacade",
        "landWidth", "landLength", "landUsage", "officeType",
        "hasPool", "hasSauna", "isUrgent", "hasImage", "isVerified",
      ];

      // اول همه فیلتر کی‌ها رو حذف کن
      for (const k of FILTER_KEYS) delete next[k];

      // بعد فقط مقادیر معتبر رو اضافه کن
      for (const k of FILTER_KEYS) {
        const v = filters[k];
        if (v === undefined || v === null || v === "" || v === false) continue;
        if (typeof v === "number" && v <= 0) continue;
        next[k] = v;
      }

      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    isAppendingRef.current = false;
    setApplied({ page: 1 });
  }, []);

  const removeFilter = useCallback((key: string) => {
    isAppendingRef.current = false;
    setApplied((prev) => {
      const next = { ...prev };
      // برای قیمت هر دو min و max را پاک کن
      if (key === "minPrice" || key === "price") {
        delete next.minPrice;
        delete next.maxPrice;
      } else {
        delete next[key as keyof SearchParams];
      }
      next.page = 1;
      return next;
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    isAppendingRef.current = false;
    setApplied((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSortChange = useCallback((sortValue: string) => {
    isAppendingRef.current = false;
    setApplied((prev) => ({ ...prev, sortBy: sortValue, page: 1 }));
  }, []);

  const handleViewMode = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  /* ─── computed ─────────────────────────────── */

  const activeCount = useMemo(() => countFilters(applied), [applied]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    const p = applied;
    if (p.q) chips.push({ key: "q", label: `جستجو: ${p.q}` });
    if (p.category) {
      const n = categories.find((c: any) => c.slug === p.category)?.name || p.category;
      chips.push({ key: "category", label: `دسته‌بندی: ${n}` });
    }
    if (p.province) {
      const n = provinces.find(
        (pr: any) => pr._id === p.province || pr.name === p.province,
      )?.name || p.province;
      chips.push({ key: "province", label: `استان: ${n}` });
    }
    if (p.city) chips.push({ key: "city", label: `شهر: ${p.city}` });
    if (p.district) chips.push({ key: "district", label: `محله: ${p.district}` });
    if (p.adType) chips.push({ key: "adType", label: AD_TYPE_LABELS[p.adType] || p.adType });
    if (p.propertyType) chips.push({ key: "propertyType", label: PROP_TYPE_LABELS[p.propertyType] || p.propertyType });
    if (p.rooms) chips.push({ key: "rooms", label: `${p.rooms} اتاق` });
    // قیمت — یک chip برای هر دو min و max
    if (p.minPrice || p.maxPrice) {
      const a = p.minPrice ? formatPrice(p.minPrice) : "";
      const b = p.maxPrice ? formatPrice(p.maxPrice) : "";
      chips.push({
        key: "price",
        label: `قیمت: ${a}${a && b ? " - " : ""}${b} تومان`,
      });
    }
    if (p.minArea || p.maxArea) {
      const a = p.minArea ? toFa(p.minArea) : "";
      const b = p.maxArea ? toFa(p.maxArea) : "";
      chips.push({ key: "area", label: `متراژ: ${a}${a && b ? "-" : ""}${b} م²` });
    }
    if (p.hasElevator) chips.push({ key: "hasElevator", label: "دارای آسانسور" });
    if (p.hasParking) chips.push({ key: "hasParking", label: "دارای پارکینگ" });
    if (p.hasStorage) chips.push({ key: "hasStorage", label: "دارای انباری" });
    if (p.isUrgent) chips.push({ key: "isUrgent", label: "فوری" });
    if (p.hasImage) chips.push({ key: "hasImage", label: "دارای عکس" });
    return chips;
  }, [applied, categories, provinces]);

  /* ─── انیمیشن محتوا ────────────────────────── */

  const contentVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(2px)",
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
};

  /* ─── RENDER ────────────────────────────────── */

  return (
    <section dir="rtl" className="w-full space-y-4 pb-24 md:pb-8">
      {/* ── هدر موبایل sticky ── */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pt-3 pb-3 border-b border-border/40 space-y-3 px-3 md:hidden">
        <SearchBox className="w-full" />
        <AdvancedFilterModal
          categories={categories}
          provinces={provinces}
          priceRange={priceRange}
          currentFilters={applied}
          activeFiltersCount={activeCount}
          onApply={handleApplyAdvanced}
          clearFilters={clearAllFilters}
        />
      </div>

      {/* ── نوار ابزار دسکتاپ ── */}
      <div className="hidden md:flex items-center justify-between gap-4 border-b border-border/40 pb-4 pt-1">
        {/* فیلتر + مرتب‌سازی */}
        <div className="flex items-center gap-3 flex-wrap">
          <AdvancedFilterModal
            categories={categories}
            provinces={provinces}
            priceRange={priceRange}
            currentFilters={applied}
            activeFiltersCount={activeCount}
            onApply={handleApplyAdvanced}
            clearFilters={clearAllFilters}
          />

          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = (applied.sortBy || "newest") === opt.value;
              return (
                <motion.div
                  key={opt.value}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    className={`h-8 px-3 text-xs font-bold rounded-lg transition-all gap-1.5 ${
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => handleSortChange(opt.value)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* حالت نمایش */}
        <div className="flex items-center rounded-xl border border-border overflow-hidden bg-card shrink-0">
          {(["grid", "list"] as const).map((mode) => (
            <motion.div key={mode} whileTap={{ scale: 0.9 }}>
              <Button
                variant={viewMode === mode ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => handleViewMode(mode)}
              >
                {mode === "grid" ? (
                  <Grid3X3 className="w-4 h-4" />
                ) : (
                  <List className="w-4 h-4" />
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── chip های فیلتر فعال ── */}
      <AnimatePresence>
        {activeChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-2 px-1 overflow-hidden"
          >
            <span className="text-xs text-muted-foreground font-medium shrink-0">
              فیلترهای فعال:
            </span>
            {activeChips.map((chip) => (
              <motion.div
                key={chip.key}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
              >
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 text-[11px] font-medium rounded-full bg-primary/8 text-foreground border-primary/15 hover:bg-primary/15 transition-colors cursor-pointer"
                  onClick={() => removeFilter(chip.key)}
                >
                  {chip.label}
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" />
                </Badge>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full px-2.5"
                onClick={clearAllFilters}
              >
                حذف همه
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── خطا ── */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs"
          >
            خطا: {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── محتوای اصلی با انیمیشن ── */}
      <AnimatePresence mode="wait">
        {loading && ads.length === 0 ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === "grid" ? <GridSkeleton /> : <ListSkeleton />}
          </motion.div>
        ) : ads.length === 0 ? (
          <motion.div
            key="empty"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center justify-center py-20 space-y-4 text-center"
          >
            <div className="p-5 rounded-2xl bg-muted/50">
              <SearchX className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">
                آگهی‌ای یافت نشد
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                با فیلترهای انتخابی آگهی‌ای پیدا نشد. فیلترها را تغییر دهید.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 rounded-xl mt-2"
              onClick={clearAllFilters}
            >
              <SlidersHorizontal className="w-4 h-4" />
              حذف فیلترها
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key={`content-${contentKey}-${viewMode}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {ads.map((ad) => (
                  <motion.div
                    key={ad._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <AdCard
                      _id={ad._id}
                      title={ad.title}
                      price={ad.price || 0}
                      city={ad.city}
                      district={ad.district}
                      images={ad.images}
                      createdAt={ad.createdAt}
                      userRole={ad.userId?.role}
                      isUrgent={ad.isUrgent}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {ads.map((ad, i) => (
                  <motion.div
                    key={ad._id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  >
                    <AdListItem ad={ad} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* پagination دسکتاپ */}
            <div className="hidden sm:block">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onChange={handlePageChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Infinite scroll موبایل */}
      <div
        ref={observerTarget}
        className="h-10 w-full flex items-center justify-center"
      >
        <AnimatePresence>
          {loadingMore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}