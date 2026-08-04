"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowRight,
  Loader2,
  ChevronLeft,
  ImagePlus,
  X,
  Save,
  Info,
  MapPin,
  Phone,
  Home,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import apiClient from "@/services/api/client";
import { getImageUrl } from "@/lib/getImageUrl";

interface Category {
  _id: string;
  name: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    priceType: "sale",
    propertyType: "apartment",
    city: "",
    address: "",
    area: "",
    rooms: "",
    yearBuilt: "",
    images: [] as string[],
    categoryId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [propertyRes, categoriesRes] = await Promise.all([
        apiClient.get(`/properties/${params.id}`),
        apiClient.get("/categories"),
      ]);
      const property = propertyRes.data.data;
      setFormData({
        title: property.title || "",
        description: property.description || "",
        price: property.price?.toString() || "",
        priceType: property.priceType || "sale",
        propertyType: property.propertyType || "apartment",
        city: property.city || "",
        address: property.address || "",
        area: property.area?.toString() || "",
        rooms: property.rooms?.toString() || "",
        yearBuilt: property.yearBuilt?.toString() || "",
        images: property.images || [],
        categoryId: property.categoryId || "",
      });
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطا در دریافت اطلاعات ملک");
      router.push("/panel/agent/properties");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataFile = new FormData();
      formDataFile.append("image", file);

      try {
        const response = await apiClient.post(
          "/properties/upload-image",
          formDataFile,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        if (response.data.success) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, response.data.url],
          }));
          toast.success("تصویر با موفقیت آپلود شد");
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("خطا در آپلود تصویر");
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.price ||
      !formData.city ||
      !formData.address
    ) {
      toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.put(`/properties/${params.id}`, {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        priceType: formData.priceType,
        propertyType: formData.propertyType,
        city: formData.city,
        address: formData.address,
        area: Number(formData.area) || 0,
        rooms: Number(formData.rooms) || 0,
        yearBuilt: Number(formData.yearBuilt) || 0,
        images: formData.images,
        categoryId: formData.categoryId || null,
      });
      toast.success("ملک با موفقیت ویرایش شد");
      router.push("/panel/agent/properties");
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "خطا در ویرایش ملک");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-8 px-3 sm:px-6" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-4xl mx-auto pb-8 px-3 sm:px-6"
      dir="rtl"
    >
      {/* هدر */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Link href="/panel/agent/properties">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-border/60 hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            ویرایش ملک
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            اطلاعات ملک را ویرایش کنید
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* اطلاعات پایه */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                اطلاعات پایه
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">
                  عنوان ملک <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold">توضیحات</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={5}
                  className="rounded-xl resize-none bg-muted/40 border-border/60 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">
                    قیمت (تومان) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">نوع معامله</Label>
                  <Select
                    value={formData.priceType}
                    onValueChange={(v) =>
                      setFormData({ ...formData, priceType: v })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">فروش</SelectItem>
                      <SelectItem value="rent">اجاره</SelectItem>
                      <SelectItem value="mortgage">رهن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">نوع ملک</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(v) =>
                      setFormData({ ...formData, propertyType: v })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">آپارتمان</SelectItem>
                      <SelectItem value="villa">ویلا</SelectItem>
                      <SelectItem value="office">دفتر کار</SelectItem>
                      <SelectItem value="commercial">تجاری</SelectItem>
                      <SelectItem value="land">زمین</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">دسته‌بندی</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, categoryId: v })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                      <SelectValue placeholder="انتخاب دسته‌بندی" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* موقعیت مکانی */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                موقعیت مکانی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">
                    شهر <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">محله</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* مشخصات فنی */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                مشخصات فنی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">متراژ (متر مربع)</Label>
                  <Input
                    type="number"
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">تعداد اتاق</Label>
                  <Input
                    type="number"
                    value={formData.rooms}
                    onChange={(e) =>
                      setFormData({ ...formData, rooms: e.target.value })
                    }
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">سال ساخت</Label>
                  <Input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) =>
                      setFormData({ ...formData, yearBuilt: e.target.value })
                    }
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* تصاویر */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-primary" />
                تصاویر ملک
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="border-2 border-dashed border-border/60 rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer bg-muted/10">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    {uploading ? (
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                    ) : (
                      <ImagePlus className="w-10 h-10 text-muted-foreground mb-3" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {uploading
                        ? "در حال آپلود..."
                        : "برای آپلود تصاویر کلیک کنید"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, JPEG (حداکثر 5 مگابایت)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={getImageUrl(img)}
                        alt={`تصویر ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/images/user.webp";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* دکمه‌ها */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-end gap-3 pt-2"
        >
          <Link
            href="/panel/agent/properties"
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 rounded-xl h-10 border-border/60 hover:bg-muted"
            >
              انصراف
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto gap-2 rounded-xl h-10 px-6 font-bold shadow-md shadow-primary/20 order-1 sm:order-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                ذخیره تغییرات
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}