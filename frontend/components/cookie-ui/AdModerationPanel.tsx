"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  ArrowUpDown,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── کامپوننت‌های کمکی ───
const HighlightText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(
    `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200 dark:bg-amber-800/60 text-foreground px-0.5 rounded font-bold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
};

// ─── کامپوننت اصلی پنل نظارت ───
export default function AdModerationPanel({
  initialAds = [],
}: {
  initialAds?: any[];
}) {
  const [ads, setAds] = useState<any[]>(initialAds);
  const [selectedAd, setSelectedAd] = useState<any | null>(null);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "flagged" | "high_risk"
  >("all");
  const [isProcessing, setIsProcessing] = useState(false);

  // فیلتر و جستجوی آگهی‌ها
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch =
        ad.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.userId?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "pending") return ad.status === "pending";
      if (statusFilter === "flagged") return ad.flagged;
      if (statusFilter === "high_risk") return ad.score >= 80;

      return true;
    });
  }, [ads, searchQuery, statusFilter]);

  // مدیریت انتخاب دسته‌ای
  const handleSelectAll = () => {
    if (selectedAdIds.length === filteredAds.length) {
      setSelectedAdIds([]);
    } else {
      setSelectedAdIds(filteredAds.map((ad) => ad._id || ad.id));
    }
  };

  const handleSelectAd = (id: string) => {
    setSelectedAdIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // عملیات تایید/رد
  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      setAds((prev) =>
        prev.map((ad) =>
          (ad._id || ad.id) === id ? { ...ad, status: "approved" } : ad,
        ),
      );
      toast.success("آگهی با موفقیت تایید شد");
      if (selectedAd?._id === id || selectedAd?.id === id) setSelectedAd(null);
    } catch {
      toast.error("خطا در تایید آگهی");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    setIsProcessing(true);
    try {
      setAds((prev) =>
        prev.map((ad) =>
          (ad._id || ad.id) === id
            ? { ...ad, status: "rejected", rejectReason: reason }
            : ad,
        ),
      );
      toast.success("آگهی رد شد");
      if (selectedAd?._id === id || selectedAd?.id === id) setSelectedAd(null);
    } catch {
      toast.error("خطا در رد آگهی");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = () => {
    setAds((prev) =>
      prev.map((ad) =>
        selectedAdIds.includes(ad._id || ad.id)
          ? { ...ad, status: "approved" }
          : ad,
      ),
    );
    toast.success(`${selectedAdIds.length} آگهی با موفقیت تایید شدند`);
    setSelectedAdIds([]);
  };

  const handleBulkReject = () => {
    setAds((prev) =>
      prev.map((ad) =>
        selectedAdIds.includes(ad._id || ad.id)
          ? { ...ad, status: "rejected" }
          : ad,
      ),
    );
    toast.error(`${selectedAdIds.length} آگهی رد شدند`);
    setSelectedAdIds([]);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* کارت‌های آمار سریع */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                کل آگهی‌های معلق
              </p>
              <h3 className="text-2xl font-black mt-1">
                {ads.filter((a) => a.status === "pending").length}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                پرخطر (هوش مصنوعی)
              </p>
              <h3 className="text-2xl font-black mt-1 text-red-600">
                {ads.filter((a) => a.score >= 80).length}
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                تایید شده امروز
              </p>
              <h3 className="text-2xl font-black mt-1 text-emerald-600">
                {ads.filter((a) => a.status === "approved").length}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                رد شده
              </p>
              <h3 className="text-2xl font-black mt-1 text-slate-600">
                {ads.filter((a) => a.status === "rejected").length}
              </h3>
            </div>
            <div className="p-3 bg-slate-500/10 text-slate-600 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نوار ابزار اصلی، فیلترها و عملیات گروهی */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                پنل بررسی هوشمند آگهی‌ها
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                بررسی آگهی‌ها بر اساس امتیاز ریسک هوش مصنوعی و گزارش‌های کاربران
              </CardDescription>
            </div>

            {/* عملیات دسته‌ای */}
            {selectedAdIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-xl border border-border"
              >
                <span className="text-xs font-bold px-2">
                  {selectedAdIds.length} انتخاب شده
                </span>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs gap-1"
                  onClick={handleBulkApprove}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> تایید همه
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs gap-1"
                  onClick={handleBulkReject}
                >
                  <XCircle className="w-3.5 h-3.5" /> رد همه
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو در عنوان، توضیحات یا شناسه کاربر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="text-xs h-9"
              >
                همه
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                className="text-xs h-9"
              >
                معلق
              </Button>
              <Button
                variant={statusFilter === "high_risk" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("high_risk")}
                className="text-xs h-9 text-red-600 border-red-200 dark:border-red-900/50"
              >
                پرخطر
              </Button>
            </div>
          </div>

          {/* جدول آگهی‌ها */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center"
                      >
                        {selectedAdIds.length === filteredAds.length &&
                        filteredAds.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">عنوان آگهی</th>
                    <th className="p-3">کاربر</th>
                    <th className="p-3 text-center">امتیاز ریسک AI</th>
                    <th className="p-3 text-center">وضعیت</th>
                    <th className="p-3 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAds.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        هیچ آگهی مطابق با فیلترهای انتخابی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredAds.map((ad) => {
                      const adId = ad._id || ad.id;
                      const isSelected = selectedAdIds.includes(adId);
                      const isHighRisk = ad.score >= 80;

                      return (
                        <tr
                          key={adId}
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            isSelected && "bg-primary/5",
                            isHighRisk && "bg-red-500/5",
                          )}
                        >
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleSelectAd(adId)}
                              className="flex items-center justify-center"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              ) : (
                                <Square className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-foreground">
                              <HighlightText
                                text={ad.title || "بدون عنوان"}
                                highlight={searchQuery}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              {ad.category || "عمومی"}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            <HighlightText
                              text={ad.userId || "ناشناس"}
                              highlight={searchQuery}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-bold px-2 py-0.5",
                                isHighRisk
                                  ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:border-red-800"
                                  : ad.score >= 50
                                    ? "bg-amber-50 text-amber-600 border-amber-200"
                                    : "bg-emerald-50 text-emerald-600 border-emerald-200",
                              )}
                            >
                              {ad.score || 0}%
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary" className="text-[11px]">
                              {ad.status === "pending"
                                ? "در انتظار"
                                : ad.status === "approved"
                                  ? "تایید شده"
                                  : "رد شده"}
                            </Badge>
                          </td>
                          <td className="p-3 text-left">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-muted"
                                onClick={() => setSelectedAd(ad)}
                              >
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleApprove(adId)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                                onClick={() => handleReject(adId)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مودال جزئیات و بررسی آگهی */}
      {selectedAd && (
        <Dialog open={!!selectedAd} onOpenChange={() => setSelectedAd(null)}>
          <DialogContent
            className="sm:max-w-2xl text-right max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                بررسی کامل آگهی
                <Badge variant="outline" className="text-xs font-normal">
                  {selectedAd.category}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                شناسه: {selectedAd._id || selectedAd.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <h4 className="font-bold text-base text-foreground">
                  {selectedAd.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {selectedAd.description}
                </p>
              </div>

              {selectedAd.violations && selectedAd.violations.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 space-y-1">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> موارد تخلف شناسایی شده
                    توسط AI:
                  </p>
                  <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-300 space-y-0.5">
                    {selectedAd.violations.map((v: string, idx: number) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="flex-row items-center justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAd(null)}
              >
                انصراف
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReject(selectedAd._id || selectedAd.id)}
              >
                رد آگهی
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
                onClick={() => handleApprove(selectedAd._id || selectedAd.id)}
              >
                تایید و انتشار
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
