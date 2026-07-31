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
  Plus,
  MapPin,
  DollarSign,
  Home,
  Bed,
  Ruler,
  Calendar,
  Search,
  X,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { propertyApi, Property } from "@/services/api/property.api";

export default function AgentPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "pending" | "sold"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    let filtered = [...properties];

    if (searchTerm) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (property) => property.status === statusFilter
      );
    }

    setFilteredProperties(filtered);
    setCurrentPage(1);
  }, [properties, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyApi.getAgentProperties({ limit: 100 });
      const data = response.data || [];
      setProperties(data);
      setFilteredProperties(data);
    } catch (err: any) {
      console.error("Error fetching properties:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "خطا در دریافت املاک";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این ملک اطمینان دارید؟")) return;
    try {
      await propertyApi.delete(id);
      toast.success("ملک با موفقیت حذف شد");
      fetchProperties();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در حذف ملک");
    }
  };

  const formatPrice = (price: number) => {
    if (!price) return "توافقی";
    if (price >= 1_000_000_000)
      return `${(price / 1_000_000_000).toFixed(1)} میلیارد تومان`;
    if (price >= 1_000_000)
      return `${(price / 1_000_000).toFixed(0)} میلیون تومان`;
    return price.toLocaleString() + " تومان";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fa-IR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-0.5 rounded-full">
            فعال
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-0.5 rounded-full">
            در انتظار تایید
          </Badge>
        );
      case "sold":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-0.5 rounded-full">
            فروخته شده
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="rounded-full">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">خطا در دریافت املاک</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchProperties} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">مدیریت املاک</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت املاک ثبت شده آژانس
          </p>
        </div>
        <Link href="/panel/agent/properties/create">
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300 rounded-xl">
            <Plus className="w-4 h-4" />
            ثبت ملک جدید
          </Button>
        </Link>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی ملک (عنوان، شهر، آدرس)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 rounded-xl bg-muted/30 border-0 focus:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl ${statusFilter === "all" ? "bg-primary hover:bg-primary/90" : ""}`}
          >
            همه
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            className={`rounded-xl ${statusFilter === "active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
          >
            فعال
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            className={`rounded-xl ${statusFilter === "pending" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
          >
            در انتظار
          </Button>
          <Button
            variant={statusFilter === "sold" ? "default" : "outline"}
            onClick={() => setStatusFilter("sold")}
            className={`rounded-xl ${statusFilter === "sold" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
          >
            فروخته شده
          </Button>
        </div>
      </motion.div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">هیچ ملکی یافت نشد</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "با فیلترهای اعمال شده ملکی پیدا نشد"
              : "برای شروع، اولین ملک خود را ثبت کنید"}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-2"
            >
              حذف فیلترها
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {paginatedProperties.map((property, index) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
                    <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder.jpg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        {getStatusBadge(property.status)}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
                        {property.views || 0} بازدید
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg line-clamp-1 flex-1">
                          {property.title}
                        </h3>
                      </div>

                      <div className="mb-3">
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(property.price)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{property.city}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Ruler className="w-3.5 h-3.5" />
                            <span>{property.area} متر مربع</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5" />
                            <span>{property.rooms} خواب</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(property.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Link
                          href={`/property/${property._id}`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            مشاهده
                          </Button>
                        </Link>
                        <Link
                          href={`/panel/agent/properties/edit/${property._id}`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1 rounded-lg"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            ویرایش
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(property._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-full"
              >
                <ChevronRight className="w-4 h-4 ml-1" />
                قبلی
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 p-0 rounded-full ${currentPage === page ? "bg-primary" : ""}`}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-full"
              >
                بعدی
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </div>
          )}

          {/* Summary Stats */}
          <div className="flex justify-between items-center p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">کل املاک:</span>
              <span className="font-bold">{properties.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">فعال:</span>
                <span className="font-bold">
                  {properties.filter((p) => p.status === "active").length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">
                  در انتظار:
                </span>
                <span className="font-bold">
                  {properties.filter((p) => p.status === "pending").length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">
                  فروخته شده:
                </span>
                <span className="font-bold">
                  {properties.filter((p) => p.status === "sold").length}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}