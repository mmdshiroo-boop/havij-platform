// app/panel/agent/properties/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  MapPin,
  Bed,
  Ruler,
  Calendar,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { propertyApi, Property } from "@/services/api/property.api";
import { getImageUrl } from "@/lib/getImageUrl";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KpiCard } from "@/components/panel/KpiCard";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const formatPrice = (price: number) => {
  if (!price) return "توافقی";
  if (price >= 1_000_000_000)
    return `${(price / 1_000_000_000).toFixed(1)} میلیارد تومان`;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} میلیون تومان`;
  return price.toLocaleString("fa-IR") + " تومان";
};

const formatDate = (date: string) => new Date(date).toLocaleDateString("fa-IR");

export default function AgentPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const itemsPerPage = 6;

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await propertyApi.getAgentProperties({ limit: 100 });
      const data = res.data || [];
      setProperties(data);
    } catch (err: any) {
      toast.error("خطا در دریافت املاک");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    let result = [...properties];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.city.toLowerCase().includes(s) ||
          p.address?.toLowerCase().includes(s),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    setFiltered(result);
    setPage(1);
  }, [properties, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await propertyApi.delete(deleteId);
      toast.success("ملک حذف شد");
      setProperties((prev) => prev.filter((p) => p._id !== deleteId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در حذف");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const stats = {
    total: properties.length,
    active: properties.filter((p) => p.status === "active").length,
    pending: properties.filter((p) => p.status === "pending").length,
    sold: properties.filter((p) => p.status === "sold").length,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              مدیریت املاک
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              مدیریت املاک ثبت‌شدهٔ آژانس
            </p>
          </div>
        </div>
        <Link
          href="/panel/agent/properties/create"
          className="w-full sm:w-auto"
        >
          <Button className="w-full sm:w-auto gap-2 rounded-xl font-bold shadow-md shadow-primary/10">
            <PlusCircle className="w-4 h-4" />
            ثبت ملک جدید
          </Button>
        </Link>
      </motion.div>

      {/* Stats Cards with KpiCard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          title="کل املاک"
          value={stats.total}
          icon={<Building2 className="w-5 h-5" />}
          color="orange"
        />
        <KpiCard
          title="فعال"
          value={stats.active}
          icon={<Eye className="w-5 h-5" />}
          color="green"
        />
        <KpiCard
          title="در انتظار"
          value={stats.pending}
          icon={<Calendar className="w-5 h-5" />}
          color="purple"
        />
        <KpiCard
          title="فروخته شده"
          value={stats.sold}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl h-10 bg-muted/40 border-border/60 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "همه" },
            { key: "active", label: "فعال" },
            { key: "pending", label: "در انتظار" },
            { key: "sold", label: "فروخته" },
          ].map((f) => (
            <Button
              key={f.key}
              variant={statusFilter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "rounded-xl text-xs font-bold",
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border-border/60 hover:bg-muted",
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Property Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="py-16 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-foreground">هیچ ملکی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((p) => (
            <Card
              key={p._id}
              className="border-border/60 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm group"
            >
              <div className="relative h-44 bg-muted">
                <img
                  src={getImageUrl(p.images?.[0])}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/user.webp";
                  }}
                />
                <Badge
                  className={cn(
                    "absolute top-3 left-3 text-xs font-bold",
                    p.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : p.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-600 border-blue-500/20",
                  )}
                >
                  {p.status === "active"
                    ? "فعال"
                    : p.status === "pending"
                      ? "در انتظار"
                      : "فروخته"}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm line-clamp-1">{p.title}</h3>
                <p className="font-black text-primary text-lg">
                  {formatPrice(p.price)}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary/70" />
                  {p.city}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5" /> {p.area} متر
                  </span>
                  <span className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5" /> {p.rooms} خواب
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />{" "}
                    {formatDate(p.createdAt)}
                  </span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 rounded-lg text-xs"
                    onClick={() =>
                      window.open(`/property/${p._id}`, "_blank")
                    }
                  >
                    <Eye className="w-3.5 h-3.5" /> مشاهده
                  </Button>
                  <Link
                    href={`/panel/agent/properties/edit/${p._id}`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1 rounded-lg text-xs text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white"
                    >
                      <Edit className="w-3.5 h-3.5" /> ویرایش
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 rounded-lg text-xs text-rose-500 border-rose-500/20 hover:bg-rose-600 hover:text-white"
                    onClick={() => setDeleteId(p._id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl h-9 gap-1"
          >
            <ChevronRight className="w-4 h-4" /> قبلی
          </Button>
          <span className="text-sm font-bold px-4">
            {page} از {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl h-9 gap-1"
          >
            بعدی <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent
          className="rounded-2xl max-w-[90vw] sm:max-w-md"
          dir="rtl"
        >
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-lg font-black text-destructive">
              حذف ملک
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              آیا از حذف این ملک اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-rose-500 hover:bg-rose-600 rounded-xl gap-1"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}