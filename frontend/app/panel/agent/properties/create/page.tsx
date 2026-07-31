"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { ArrowRight, ImagePlus, X, Loader2, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/services/api/client";

interface Category {
  _id: string;
  name: string;
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/categories");
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await apiClient.post(
          "/properties/upload-image",
          formData,
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

  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.price ||
      !formData.city ||
      !formData.address
    ) {
      toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
      return;
    }

    setLoading(true);
    try {
      const payload = {
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
        categoryId: formData.categoryId,
      };

      await apiClient.post("/properties", payload);
      toast.success("ملک با موفقیت ثبت شد");
      router.push("/panel/agent/properties");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.message || "خطا در ثبت ملک");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ثبت ملک جدید</h1>
          <p className="text-sm text-muted-foreground">
            اطلاعات ملک را وارد کنید
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="text-xl">اطلاعات ملک</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* عنوان */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                عنوان ملک <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="مثال: آپارتمان لوکس در منطقه سعادت آباد"
                className="rounded-xl focus:ring-primary"
              />
            </div>

            {/* توضیحات */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">توضیحات</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="توضیحات کامل ملک..."
                rows={5}
                className="rounded-xl focus:ring-primary"
              />
            </div>

            {/* قیمت و نوع معامله */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  قیمت (تومان) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="مثال: 1250000000"
                  className="rounded-xl focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">نوع معامله</Label>
                <Select
                  value={formData.priceType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, priceType: v })
                  }
                >
                  <SelectTrigger className="rounded-xl">
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

            {/* نوع ملک و دسته‌بندی */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">نوع ملک</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, propertyType: v })
                  }
                >
                  <SelectTrigger className="rounded-xl">
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
              <div className="space-y-2">
                <Label className="text-sm font-semibold">دسته‌بندی</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, categoryId: v })
                  }
                >
                  <SelectTrigger className="rounded-xl">
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

            {/* موقعیت مکانی */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  شهر <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="مثال: تهران"
                  className="rounded-xl focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  آدرس <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="آدرس کامل"
                  className="rounded-xl focus:ring-primary"
                />
              </div>
            </div>

            {/* مشخصات فنی */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  متراژ (متر مربع)
                </Label>
                <Input
                  type="number"
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({ ...formData, area: e.target.value })
                  }
                  placeholder="مثال: 120"
                  className="rounded-xl focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">تعداد اتاق</Label>
                <Input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) =>
                    setFormData({ ...formData, rooms: e.target.value })
                  }
                  placeholder="مثال: 3"
                  className="rounded-xl focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">سال ساخت</Label>
                <Input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) =>
                    setFormData({ ...formData, yearBuilt: e.target.value })
                  }
                  placeholder="مثال: 1400"
                  className="rounded-xl focus:ring-primary"
                />
              </div>
            </div>

            {/* تصاویر */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">تصاویر ملک</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer">
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`تصویر ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* دکمه ثبت */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl py-6 text-base font-semibold shadow-lg transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              {loading ? "در حال ثبت..." : "ثبت ملک"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
