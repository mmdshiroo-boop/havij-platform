"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  ToggleLeft,
  ToggleRight,
  Plus,
  ShieldAlert,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Tag,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import apiClient from "@/services/api/client";

/* ================= TYPES ================= */
interface BlacklistKeyword {
  _id: string;
  id?: string;
  word: string;
  category: string;
  severity: "low" | "medium" | "high" | string;
  isActive: boolean;
  createdAt?: string;
}

/* ================= STAT CARD COMPONENT ================= */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur-md p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 group">
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 blur-xl transition-opacity pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p
            className="text-2xl font-black text-card-foreground tracking-tight"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {value !== undefined ? value.toLocaleString("fa-IR") : "۰"}
          </p>
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: bgColor, color: color }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function BlacklistKeywordsPage() {
  const [keywords, setKeywords] = useState<BlacklistKeyword[]>([]);
  const [newWord, setNewWord] = useState("");
  const [category, setCategory] = useState("سایر");
  const [severity, setSeverity] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // فیلترها و جستجو
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchKeywords = useCallback(async () => {
    setFetching(true);
    try {
      const res = await apiClient.get("/super-admin/blacklist-keywords");
      const data = res.data?.data || res.data || [];
      setKeywords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching blacklist keywords:", e);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    setLoading(true);
    try {
      await apiClient.post("/super-admin/blacklist-keywords", {
        word: newWord.trim(),
        category,
        severity,
      });
      setNewWord("");
      await fetchKeywords();
    } catch (e) {
      console.error("Error adding keyword:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این کلمه از سیاه‌لیست مطمئن هستید؟")) return;
    setActionLoadingId(id);
    try {
      await apiClient.delete(`/super-admin/blacklist-keywords/${id}`);
      await fetchKeywords();
    } catch (e) {
      console.error("Error deleting keyword:", e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.patch(`/super-admin/blacklist-keywords/${id}/toggle`);
      await fetchKeywords();
    } catch (e) {
      console.error("Error toggling keyword status:", e);
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ================= BADGE HELPERS ================= */
  const severityBadge = (s: string) => {
    switch (s) {
      case "high":
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20 font-semibold px-2.5 py-0.5 rounded-lg border">
            زیاد
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 font-semibold px-2.5 py-0.5 rounded-lg border">
            متوسط
          </Badge>
        );
      case "low":
      default:
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20 font-semibold px-2.5 py-0.5 rounded-lg border">
            کم
          </Badge>
        );
    }
  };

  const categoryBadge = (c: string) => {
    const map: Record<string, string> = {
      اخلاقی:
        "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      سیاسی:
        "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
      کلاهبرداری:
        "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      سایر: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    };

    const styleClass =
      map[c] ||
      "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";

    return (
      <Badge
        className={`${styleClass} font-medium px-2.5 py-0.5 rounded-lg border`}
      >
        {c}
      </Badge>
    );
  };

  /* ================= CALCULATED STATS ================= */
  const stats = useMemo(() => {
    const total = keywords.length;
    const active = keywords.filter((k) => k.isActive).length;
    const highSeverity = keywords.filter((k) => k.severity === "high").length;
    const categoriesCount = new Set(keywords.map((k) => k.category)).size;
    return { total, active, highSeverity, categoriesCount };
  }, [keywords]);

  /* ================= FILTERED DATA ================= */
  const filteredKeywords = useMemo(() => {
    return keywords.filter((kw) => {
      const matchesSearch =
        !searchQuery.trim() ||
        kw.word.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesCat =
        filterCategory === "all" || kw.category === filterCategory;

      const matchesSev =
        filterSeverity === "all" || kw.severity === filterSeverity;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && kw.isActive) ||
        (filterStatus === "inactive" && !kw.isActive);

      return matchesSearch && matchesCat && matchesSev && matchesStatus;
    });
  }, [keywords, searchQuery, filterCategory, filterSeverity, filterStatus]);

  return (
    <div
      className="space-y-6 p-4 sm:p-6 max-w-[1536px] mx-auto font-[Vazirmatn]"
      dir="rtl"
    >
      {/* هدر اصلی */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/25 shrink-0">
            <ShieldAlert size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                مدیریت کلمات سیاه‌لیست
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-full">
                فیلترینگ هوشمند
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              تعریف و نظارت بر کلمات ممنوعه، حساس و عبارات نیازمند بازبینی در
              سامانه
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchKeywords}
          disabled={fetching}
          className="flex items-center gap-2 text-xs font-semibold h-10 px-4 rounded-xl border-border/60 hover:bg-muted"
        >
          <RefreshCw
            size={15}
            className={fetching ? "animate-spin text-primary" : ""}
          />
          <span>بروزرسانی داده‌ها</span>
        </Button>
      </div>

      {/* کارت‌های آمار سریع */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          icon={Tag}
          label="کل کلمات سیاه‌لیست"
          value={stats.total}
          color="hsl(217, 91%, 60%)"
          bgColor="hsl(217, 91%, 60%, 0.12)"
        />
        <StatCard
          icon={CheckCircle2}
          label="کلمات فعال"
          value={stats.active}
          color="hsl(142, 71%, 45%)"
          bgColor="hsl(142, 71%, 45%, 0.12)"
        />
        <StatCard
          icon={AlertTriangle}
          label="حساسیت بالا (High)"
          value={stats.highSeverity}
          color="hsl(0, 84%, 60%)"
          bgColor="hsl(0, 84%, 60%, 0.12)"
        />
        <StatCard
          icon={Layers}
          label="تعداد دسته‌بندی‌ها"
          value={stats.categoriesCount}
          color="hsl(262, 83%, 58%)"
          bgColor="hsl(262, 83%, 58%, 0.12)"
        />
      </div>

      {/* کارت اصلی مدیریت */}
      <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-card border-b border-border/60 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            افزودن کلمه جدید به سیاه‌لیست
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          {/* فرم افزودن کلمه جدید */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col md:flex-row gap-3 items-stretch md:items-end">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground mr-1">
                کلمه یا عبارت ممنوعه:
              </label>
              <Input
                placeholder="مثلاً: کلاهبرداری، فیشینگ..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                className="h-10 rounded-xl bg-background border-input text-xs"
              />
            </div>

            <div className="w-full md:w-40 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground mr-1">
                دسته‌بندی:
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 rounded-xl bg-background border-input text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-[Vazirmatn]">
                  <SelectItem value="اخلاقی">اخلاقی</SelectItem>
                  <SelectItem value="سیاسی">سیاسی</SelectItem>
                  <SelectItem value="کلاهبرداری">کلاهبرداری</SelectItem>
                  <SelectItem value="سایر">سایر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-36 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground mr-1">
                میزان شدت:
              </label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="h-10 rounded-xl bg-background border-input text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-[Vazirmatn]">
                  <SelectItem value="low">کم</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">زیاد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAdd}
              disabled={loading || !newWord.trim()}
              className="h-10 rounded-xl px-5 text-xs font-bold gap-1.5 shrink-0 active:scale-95 transition-all"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              <span>افزودن کلمه</span>
            </Button>
          </div>

          {/* نوار جستجو و فیلترها */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="جستجو در کلمات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pr-10 pl-8 rounded-xl text-xs bg-background"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-10 w-32 rounded-xl text-xs bg-background">
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter
                      size={13}
                      className="text-muted-foreground shrink-0"
                    />
                    <SelectValue placeholder="دسته‌بندی" />
                  </div>
                </SelectTrigger>
                <SelectContent className="font-[Vazirmatn]">
                  <SelectItem value="all">همه دسته‌ها</SelectItem>
                  <SelectItem value="اخلاقی">اخلاقی</SelectItem>
                  <SelectItem value="سیاسی">سیاسی</SelectItem>
                  <SelectItem value="کلاهبرداری">کلاهبرداری</SelectItem>
                  <SelectItem value="سایر">سایر</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="h-10 w-28 rounded-xl text-xs bg-background">
                  <SelectValue placeholder="شدت" />
                </SelectTrigger>
                <SelectContent className="font-[Vazirmatn]">
                  <SelectItem value="all">همه شدت‌ها</SelectItem>
                  <SelectItem value="low">کم</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">زیاد</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 w-28 rounded-xl text-xs bg-background">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent className="font-[Vazirmatn]">
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فقط فعال</SelectItem>
                  <SelectItem value="inactive">فقط غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* جدول کلمات */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right font-bold text-xs">
                    کلمه / عبارت
                  </TableHead>
                  <TableHead className="text-center font-bold text-xs">
                    دسته‌بندی
                  </TableHead>
                  <TableHead className="text-center font-bold text-xs">
                    درجه شدت
                  </TableHead>
                  <TableHead className="text-center font-bold text-xs">
                    وضعیت فیلتر
                  </TableHead>
                  <TableHead className="text-left font-bold text-xs pl-6">
                    عملیات
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetching ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2
                          size={28}
                          className="animate-spin text-primary"
                        />
                        <span className="text-xs font-medium">
                          در حال دریافت کلمات سیاه‌لیست...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredKeywords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ShieldAlert
                          size={36}
                          className="text-muted-foreground/40"
                        />
                        <span className="text-sm font-bold text-foreground">
                          هیچ کلمه‌ای یافت نشد
                        </span>
                        <span className="text-xs">
                          {searchQuery ||
                          filterCategory !== "all" ||
                          filterSeverity !== "all"
                            ? "عبارت جستجو یا فیلترهای خود را تغییر دهید."
                            : "هنوز کلمه‌ای به سیاه‌لیست اضافه نشده است."}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKeywords.map((kw) => {
                    const id = kw._id || kw.id || "";
                    const isRowLoading = actionLoadingId === id;

                    return (
                      <TableRow
                        key={id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="font-bold text-sm text-foreground">
                          {kw.word}
                        </TableCell>
                        <TableCell className="text-center">
                          {categoryBadge(kw.category)}
                        </TableCell>
                        <TableCell className="text-center">
                          {severityBadge(kw.severity)}
                        </TableCell>
                        <TableCell className="text-center">
                          {kw.isActive ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium text-[11px] px-2.5 py-0.5 rounded-full border">
                              <CheckCircle2
                                size={12}
                                className="ml-1 shrink-0"
                              />{" "}
                              فعال
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-border font-medium text-[11px] px-2.5 py-0.5 rounded-full border">
                              <XCircle size={12} className="ml-1 shrink-0" />{" "}
                              غیرفعال
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-left pl-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isRowLoading}
                              onClick={() => handleToggle(id)}
                              className="h-8 w-8 p-0 hover:bg-muted rounded-lg"
                              title={kw.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                            >
                              {isRowLoading ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin text-muted-foreground"
                                />
                              ) : kw.isActive ? (
                                <ToggleRight
                                  size={22}
                                  className="text-emerald-500"
                                />
                              ) : (
                                <ToggleLeft
                                  size={22}
                                  className="text-muted-foreground"
                                />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isRowLoading}
                              onClick={() => handleDelete(id)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive rounded-lg"
                              title="حذف کلمه"
                            >
                              {isRowLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
