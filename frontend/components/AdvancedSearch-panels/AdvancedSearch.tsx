"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileX,
  Eye,
  MapPin,
  Printer,
  CheckSquare,
  Square,
  Download,
  Loader2,
} from "lucide-react";
import apiClient from "@/services/api/client";
import {
  printSingleAd,
  printBulkAds,
  printSingleAdBrowser,
  printBulkAdsBrowser,
  mapBackendAdToPrintAd,
} from "@/lib/printAds";
import type { PrintAd } from "@/lib/printAds";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface AdResult {
  _id: string;
  title: string;
  price: number;
  priceString?: string;
  city: string;
  district?: string;
  province?: string;
  propertyType?: string;
  adType?: string;
  status: string;
  createdAt: string;
  views: number;
  images?: string[];
  area?: number;
  rooms?: number;
  floor?: number;
  yearBuilt?: number;
  description?: string;
}

interface PaginationInfo {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

const STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  active: { label: "فعال", variant: "default" },
  pending: { label: "در انتظار تایید", variant: "outline" },
  sold: { label: "فروخته‌شده", variant: "secondary" },
  expired: { label: "منقضی", variant: "destructive" },
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const PROPERTY_LABELS: Record<string, string> = {
  apartment: "آپارتمان",
  villa: "ویلایی",
  house: "خانه حیاط‌دار",
  land: "زمین",
  suite: "سوئیت",
  office: "دفتر اداری",
  commercial: "تجاری",
  bare_land: "کلنگی",
  penthouse: "پنت‌هاوس",
  duplex: "دوبلکس",
  garden: "باغ",
  hotel: "مهمان‌پذیر",
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

const ROOM_OPTIONS = ["any", "1", "2", "3", "4", "5"];
const ROOM_LABELS: Record<string, string> = {
  any: "همه",
  "1": "۱",
  "2": "۲",
  "3": "۳",
  "4": "۴",
  "5": "۵ به بالا",
};

const LIMIT = 20;

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const toFa = (n: number) => String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);

const formatPrice = (v: number | undefined) => {
  if (!v) return "توافقی";
  if (v >= 1e9) return `${toFa(Math.round(v / 1e9))} میلیارد تومان`;
  if (v >= 1e6) return `${toFa(Math.round(v / 1e6))} میلیون تومان`;
  if (v >= 1e3) return `${toFa(Math.round(v / 1e3))} هزار تومان`;
  return `${toFa(v)} تومان`;
};

/* ═══════════════════════════════════════════════════════════════════
   TABLE SKELETON
   ═══════════════════════════════════════════════════════════════════ */

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-3 rounded-xl border border-border/40"
        >
          <Skeleton className="h-5 w-40 shrink-0" />
          <Skeleton className="h-5 w-24 shrink-0" />
          <Skeleton className="h-5 w-20 shrink-0" />
          <Skeleton className="h-5 w-12 shrink-0" />
          <Skeleton className="h-5 w-16 shrink-0" />
          <Skeleton className="h-5 w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function AdvancedSearch() {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [results, setResults] = useState<AdResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* ─── Print state ─── */
  const [printing, setPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState("");

  const API_BASE = "http://localhost:5001";

  /* ─── Selection ─── */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((a) => a._id)));
    }
  }, [selectedIds.size, results]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  /* ─── دریافت جزئیات کامل آگهی از API ─── */
  const fetchFullAd = useCallback(
    async (id: string): Promise<PrintAd | null> => {
      try {
        const res = await apiClient.get(`/ads/${id}`);
        const raw = res.data?.data || res.data;
        if (!raw) return null;
        return mapBackendAdToPrintAd(raw);
      } catch {
        return null;
      }
    },
    [],
  );

  /* ─── Print / PDF handlers ─── */

  /** چاپ تک آگهی — دانلود PDF */
  const handlePrintSingle = useCallback(
    async (ad: AdResult) => {
      if (printing) return;
      setPrinting(true);
      setPrintProgress("در حال دریافت جزئیات آگهی...");
      try {
        const fullAd = await fetchFullAd(ad._id);
        const printAd = fullAd || mapBackendAdToPrintAd(ad);
        await printSingleAd(printAd, {
          baseUrl: API_BASE,
          onProgress: setPrintProgress,
        });
        toast.success("PDF آگهی با موفقیت دانلود شد");
      } catch (e) {
        console.error("[Print] handlePrintSingle error:", e);
        toast.error("خطا در تولید PDF. لطفاً دوباره تلاش کنید.");
      } finally {
        setPrinting(false);
        setPrintProgress("");
      }
    },
    [fetchFullAd, printing],
  );

  /** چاپ تک آگهی — پنجره پرینت مرورگر */
  const handlePrintSingleBrowser = useCallback(
    async (ad: AdResult) => {
      if (printing) return;
      setPrinting(true);
      try {
        const fullAd = await fetchFullAd(ad._id);
        const printAd = fullAd || mapBackendAdToPrintAd(ad);
        printSingleAdBrowser(printAd, { baseUrl: API_BASE });
      } catch (e) {
        console.error("[Print] handlePrintSingleBrowser error:", e);
        toast.error("خطا در چاپ.");
      } finally {
        setPrinting(false);
      }
    },
    [fetchFullAd, printing],
  );

  /** چاپ آگهی‌های انتخاب‌شده — PDF */
  const handlePrintSelected = useCallback(async () => {
    const selected = results.filter((a) => selectedIds.has(a._id));
    if (selected.length === 0) return;
    if (printing) return;
    setPrinting(true);
    setPrintProgress(`در حال دریافت ${toFa(selected.length)} آگهی...`);
    try {
      const fullAds = await Promise.all(
        selected.map((a) => fetchFullAd(a._id)),
      );
      const valid =
        (fullAds.filter(Boolean) as PrintAd[]).length > 0
          ? (fullAds.filter(Boolean) as PrintAd[])
          : selected.map((a) => mapBackendAdToPrintAd(a));

      await printBulkAds(valid, {
        baseUrl: API_BASE,
        onProgress: setPrintProgress,
      });
      toast.success(`PDF ${toFa(valid.length)} آگهی با موفقیت دانلود شد`);
    } catch (e) {
      console.error("[Print] handlePrintSelected error:", e);
      toast.error("خطا در تولید PDF. لطفاً دوباره تلاش کنید.");
    } finally {
      setPrinting(false);
      setPrintProgress("");
    }
  }, [results, selectedIds, fetchFullAd, printing]);

  /** چاپ آگهی‌های انتخاب‌شده — پنجره پرینت */
  const handlePrintSelectedBrowser = useCallback(async () => {
    const selected = results.filter((a) => selectedIds.has(a._id));
    if (selected.length === 0) return;
    if (printing) return;
    setPrinting(true);
    try {
      const fullAds = await Promise.all(
        selected.map((a) => fetchFullAd(a._id)),
      );
      const valid =
        (fullAds.filter(Boolean) as PrintAd[]).length > 0
          ? (fullAds.filter(Boolean) as PrintAd[])
          : selected.map((a) => mapBackendAdToPrintAd(a));

      printBulkAdsBrowser(valid, { baseUrl: API_BASE });
    } catch (e) {
      console.error("[Print] handlePrintSelectedBrowser error:", e);
      toast.error("خطا در چاپ.");
    } finally {
      setPrinting(false);
    }
  }, [results, selectedIds, fetchFullAd, printing]);

  /** چاپ همه آگهی‌های صفحه — PDF */
  const handlePrintAll = useCallback(async () => {
    if (results.length === 0) return;
    if (printing) return;
    setPrinting(true);
    setPrintProgress(`در حال دریافت ${toFa(results.length)} آگهی...`);
    try {
      const fullAds = await Promise.all(results.map((a) => fetchFullAd(a._id)));
      const valid =
        (fullAds.filter(Boolean) as PrintAd[]).length > 0
          ? (fullAds.filter(Boolean) as PrintAd[])
          : results.map((a) => mapBackendAdToPrintAd(a));

      await printBulkAds(valid, {
        baseUrl: API_BASE,
        onProgress: setPrintProgress,
      });
      toast.success(`PDF ${toFa(valid.length)} آگهی با موفقیت دانلود شد`);
    } catch (e) {
      console.error("[Print] handlePrintAll error:", e);
      toast.error("خطا در تولید PDF. لطفاً دوباره تلاش کنید.");
    } finally {
      setPrinting(false);
      setPrintProgress("");
    }
  }, [results, fetchFullAd, printing]);

  /** چاپ همه — پنجره پرینت */
  const handlePrintAllBrowser = useCallback(async () => {
    if (results.length === 0) return;
    if (printing) return;
    setPrinting(true);
    try {
      const fullAds = await Promise.all(results.map((a) => fetchFullAd(a._id)));
      const valid =
        (fullAds.filter(Boolean) as PrintAd[]).length > 0
          ? (fullAds.filter(Boolean) as PrintAd[])
          : results.map((a) => mapBackendAdToPrintAd(a));

      printBulkAdsBrowser(valid, { baseUrl: API_BASE });
    } catch (e) {
      console.error("[Print] handlePrintAllBrowser error:", e);
      toast.error("خطا در چاپ.");
    } finally {
      setPrinting(false);
    }
  }, [results, fetchFullAd, printing]);

  /* ─── Filter helpers ─── */
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => {
      const next = { ...prev, page: 1 };
      if (
        value === "all" ||
        value === "" ||
        value === undefined ||
        value === null
      ) {
        delete (next as any)[key];
      } else {
        (next as any)[key] = value;
      }
      return next;
    });
    setPage(1);
  }, []);
  const clearAll = useCallback(() => {
    setFilters({});
    setPage(1);
    setResults([]);
    setPagination(null);
    setSearched(false);
    setSelectedIds(new Set());
  }, []);

  /* ─── Search ─── */
  const handleSearch = useCallback(
    async (p?: number) => {
      const currentPage = p || page;
      setLoading(true);
      setSearched(true);
      try {
        const params: Record<string, any> = {
          ...filters,
          page: currentPage,
          limit: LIMIT,
        };
        for (const [k, v] of Object.entries(params)) {
          if (v === "" || v === undefined || v === null || v === "all") {
            delete params[k];
          }
        }
        const res = await apiClient.get("/agents/advanced-search", { params });
        setResults(res.data.data || []);
        setPagination(res.data.pagination || null);
      } catch (err) {
        console.error("Agent search error:", err);
        setResults([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [filters, page],
  );

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(newPage);
      handleSearch(newPage);
    },
    [handleSearch],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !loading) handleSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSearch, loading]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && v !== "" && v !== "all",
  ).length;

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */

  return (
    <div dir="rtl" className="w-full space-y-5">
      {/* ─── Progress Overlay ─── */}
      {printing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card rounded-2xl border border-border/50 shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">
                در حال تولید PDF
              </h3>
              <p className="text-xs text-muted-foreground">{printProgress}</p>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}

      {/* ─── کارت فیلترها ─── */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Search className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">
                جستجوی پیشرفته آگهی‌ها
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                فیلتر دقیق‌تر برای پیدا کردن آگهی مورد نظر
              </p>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg gap-1.5"
              onClick={clearAll}
            >
              <RotateCcw className="w-3 h-3" />
              پاک‌سازی ({toFa(activeFilterCount)})
            </Button>
          )}
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
            {/* عنوان */}
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                عنوان / توضیحات
              </Label>
              <Input
                placeholder="جستجو در عنوان..."
                className="h-10 rounded-xl text-sm"
                value={filters.q || ""}
                onChange={(e) => updateFilter("q", e.target.value)}
              />
            </div>

            {/* استان */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                استان
              </Label>
              <Input
                placeholder="مثلاً تهران"
                className="h-10 rounded-xl text-sm"
                value={filters.province || ""}
                onChange={(e) => updateFilter("province", e.target.value)}
              />
            </div>

            {/* شهر */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                شهر
              </Label>
              <Input
                placeholder="مثلاً مشهد"
                className="h-10 rounded-xl text-sm"
                value={filters.city || ""}
                onChange={(e) => updateFilter("city", e.target.value)}
              />
            </div>

            {/* محله */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                منطقه / محله
              </Label>
              <Input
                placeholder="مثلاً سعادت‌آباد"
                className="h-10 rounded-xl text-sm"
                value={filters.district || ""}
                onChange={(e) => updateFilter("district", e.target.value)}
              />
            </div>

            {/* نوع ملک */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                نوع ملک
              </Label>
              <Select
                value={filters.propertyType || "all"}
                onValueChange={(v) => updateFilter("propertyType", v)}
              >
                <SelectTrigger className="h-10 rounded-xl text-sm">
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  {Object.entries(PROPERTY_LABELS).map(([val, lbl]) => (
                    <SelectItem key={val} value={val}>
                      {lbl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* نوع معامله */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                نوع معامله
              </Label>
              <Select
                value={filters.adType || "all"}
                onValueChange={(v) => updateFilter("adType", v)}
              >
                <SelectTrigger className="h-10 rounded-xl text-sm">
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  {Object.entries(AD_TYPE_LABELS).map(([val, lbl]) => (
                    <SelectItem key={val} value={val}>
                      {lbl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* حداقل قیمت */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                حداقل قیمت (تومان)
              </Label>
              <Input
                type="number"
                placeholder="۰"
                className="h-10 rounded-xl text-sm"
                value={filters.minPrice || ""}
                onChange={(e) =>
                  updateFilter(
                    "minPrice",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </div>

            {/* حداکثر قیمت */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                حداکثر قیمت (تومان)
              </Label>
              <Input
                type="number"
                placeholder="۰"
                className="h-10 rounded-xl text-sm"
                value={filters.maxPrice || ""}
                onChange={(e) =>
                  updateFilter(
                    "maxPrice",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </div>

            {/* حداقل متراژ */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                حداقل متراژ (م²)
              </Label>
              <Input
                type="number"
                placeholder="۰"
                className="h-10 rounded-xl text-sm"
                value={filters.minArea || ""}
                onChange={(e) =>
                  updateFilter(
                    "minArea",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </div>

            {/* حداکثر متراژ */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                حداکثر متراژ (م²)
              </Label>
              <Input
                type="number"
                placeholder="۰"
                className="h-10 rounded-xl text-sm"
                value={filters.maxArea || ""}
                onChange={(e) =>
                  updateFilter(
                    "maxArea",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </div>

            {/* تعداد اتاق */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                تعداد اتاق
              </Label>
              <Select
                value={filters.rooms || "any"}
                onValueChange={(v) => updateFilter("rooms", v)}
              >
                <SelectTrigger className="h-10 rounded-xl text-sm">
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_OPTIONS.map((val) => (
                    <SelectItem key={val} value={val}>
                      {ROOM_LABELS[val]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* حداقل طبقه */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                حداقل طبقه
              </Label>
              <Input
                type="number"
                placeholder="۰"
                className="h-10 rounded-xl text-sm"
                value={filters.minFloor || ""}
                onChange={(e) =>
                  updateFilter(
                    "minFloor",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </div>

            {/* وضعیت آگهی */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                وضعیت آگهی
              </Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(v) => updateFilter("status", v)}
              >
                <SelectTrigger className="h-10 rounded-xl text-sm">
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="pending">در انتظار تایید</SelectItem>
                  <SelectItem value="sold">فروخته‌شده</SelectItem>
                  <SelectItem value="expired">منقضی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* از تاریخ */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                از تاریخ
              </Label>
              <Input
                type="date"
                className="h-10 rounded-xl text-sm"
                value={filters.startDate || ""}
                onChange={(e) => updateFilter("startDate", e.target.value)}
              />
            </div>

            {/* تا تاریخ */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                تا تاریخ
              </Label>
              <Input
                type="date"
                className="h-10 rounded-xl text-sm"
                value={filters.endDate || ""}
                onChange={(e) => updateFilter("endDate", e.target.value)}
              />
            </div>
          </div>

          {/* دکمه جستجو */}
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={() => handleSearch(1)}
              disabled={loading}
              className="h-11 px-8 rounded-xl font-bold text-sm gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  در حال جستجو...
                </span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  جستجو
                </>
              )}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Enter برای جستجوی سریع
            </span>
          </div>
        </div>
      </div>

      {/* ─── نتایج ─── */}
      {loading ? (
        <TableSkeleton />
      ) : searched && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <FileX className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <div className="text-center space-y-1.5">
            <h3 className="text-sm font-bold text-foreground">
              آگهی‌ای با این شرایط یافت نشد
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              فیلترها را تغییر دهید یا دکمه پاک‌سازی را بزنید.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-2 rounded-xl text-xs"
            onClick={clearAll}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            پاک‌سازی فیلترها
          </Button>
        </div>
      ) : results.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {/* هدر نتایج + دکمه‌های چاپ */}
          <div className="px-5 py-3 border-b border-border/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">
                  {toFa(pagination?.total || 0)}
                </span>{" "}
                آگهی پیدا شد
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  {selectedIds.size === results.length && results.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  {selectedIds.size === results.length && results.length > 0
                    ? "لغو همه"
                    : "انتخاب همه"}
                </button>

                {/* ─── منوی پرینت همه ─── */}
                <div className="relative group">
                  <button
                    disabled={printing}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {printing ? "..." : "چاپ همه"}
                  </button>
                  {/* dropdown */}
                  <div className="absolute left-0 top-full mt-1 z-30 hidden group-hover:flex flex-col bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                    <button
                      onClick={handlePrintAll}
                      disabled={printing}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" />
                      دانلود PDF
                    </button>
                    <button
                      onClick={handlePrintAllBrowser}
                      disabled={printing}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors border-t border-border/30 disabled:opacity-50"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      چاپ با مرورگر
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* نوار عملیات دسته‌ای */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 flex-wrap">
                <span className="text-xs font-bold text-primary">
                  {toFa(selectedIds.size)} آگهی انتخاب شده
                </span>
                <div className="flex-1" />
                <button
                  onClick={clearSelection}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                >
                  لغو انتخاب
                </button>

                {/* ─── منوی پرینت انتخاب‌شده‌ها ─── */}
                <div className="relative group">
                  <button
                    onClick={handlePrintSelected}
                    disabled={printing}
                    className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {printing
                      ? "در حال آماده‌سازی..."
                      : "دانلود PDF انتخاب‌شده‌ها"}
                  </button>
                </div>
                <button
                  onClick={handlePrintSelectedBrowser}
                  disabled={printing}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  چاپ با مرورگر
                </button>
              </div>
            )}

            {pagination && pagination.pages > 1 && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  صفحه {toFa(pagination.page)} از {toFa(pagination.pages)}
                </span>
              </div>
            )}
          </div>

          {/* جدول — Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === results.length &&
                        results.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">
                    عنوان آگهی
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">
                    قیمت
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">
                    شهر / محله
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">
                    نوع ملک
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground">
                    بازدید
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground">
                    وضعیت
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">
                    تاریخ
                  </th>
                  <th className="w-28 text-center px-3 py-3 text-xs font-bold text-muted-foreground">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((ad) => {
                  const st = STATUS_MAP[ad.status] || {
                    label: ad.status,
                    variant: "secondary" as const,
                  };
                  return (
                    <tr
                      key={ad._id}
                      className={`border-b border-border/20 hover:bg-muted/20 transition-colors group ${selectedIds.has(ad._id) ? "bg-primary/3" : ""}`}
                    >
                      <td className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(ad._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(ad._id);
                          }}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                          onClick={() => router.push(`/ad/${ad._id}`)}
                        >
                          {ad.title}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-xs">
                          {ad.priceString || formatPrice(ad.price)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="line-clamp-1">
                            {ad.district
                              ? `${ad.city}، ${ad.district}`
                              : ad.city}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {PROPERTY_LABELS[ad.propertyType || ""] ||
                            ad.propertyType ||
                            "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {toFa(ad.views)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={st.variant}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        >
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(ad.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                      </td>
                      <td className="w-28 px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintSingle(ad);
                            }}
                            disabled={printing}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border/60 text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
                            title="دانلود PDF"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintSingleBrowser(ad);
                            }}
                            disabled={printing}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border/60 text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
                            title="چاپ با مرورگر"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* کارت‌ها — Mobile */}
          <div className="md:hidden divide-y divide-border/30">
            {results.map((ad) => {
              const st = STATUS_MAP[ad.status] || {
                label: ad.status,
                variant: "secondary" as const,
              };
              return (
                <div
                  key={ad._id}
                  className={`p-4 hover:bg-muted/20 transition-colors cursor-pointer active:bg-muted/30 ${selectedIds.has(ad._id) ? "bg-primary/3" : ""}`}
                  onClick={() => router.push(`/ad/${ad._id}`)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ad._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(ad._id);
                        }}
                        className="w-4 h-4 rounded accent-primary cursor-pointer shrink-0"
                      />
                      <h3 className="font-bold text-sm text-foreground line-clamp-1">
                        {ad.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintSingle(ad);
                        }}
                        disabled={printing}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border/60 text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintSingleBrowser(ad);
                        }}
                        disabled={printing}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border/60 text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
                      >
                        <Printer className="w-3 h-3" />
                      </button>
                      <Badge
                        variant={st.variant}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      >
                        {st.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {ad.district ? `${ad.city}، ${ad.district}` : ad.city}
                    </div>
                    <span className="font-bold text-foreground text-xs">
                      {ad.priceString || formatPrice(ad.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
                    <span>{PROPERTY_LABELS[ad.propertyType || ""] || "—"}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {toFa(ad.views)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* صفحه‌بندی */}
          {pagination && pagination.pages > 1 && (
            <div className="px-5 py-3 border-t border-border/40 flex items-center justify-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
                className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center text-xs disabled:opacity-30 hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((n) => {
                  if (pagination.pages <= 7) return true;
                  if (n === 1 || n === pagination.pages) return true;
                  if (Math.abs(n - pagination.page) <= 1) return true;
                  return false;
                })
                .reduce<(number | "...")[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "..." ? (
                    <span
                      key={`e${i}`}
                      className="px-1 text-xs text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => goToPage(n as number)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                        pagination.page === n
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/60 hover:bg-muted"
                      }`}
                    >
                      {toFa(n as number)}
                    </button>
                  ),
                )}

              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => goToPage(pagination.page + 1)}
                className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center text-xs disabled:opacity-30 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* حالت اولیه */}
      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
            <Search className="w-6 h-6 text-primary/40" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            فیلترهای مورد نظر را تنظیم و جستجو کنید.
          </p>
        </div>
      )}
    </div>
  );
}
