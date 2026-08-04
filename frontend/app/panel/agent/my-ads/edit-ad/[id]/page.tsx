// app/panel/agent/my-ads/edit/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Info, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { adsApi, Ad } from "@/services/api/ads.api";
import { categoryApi, Category } from "@/services/api/category.api";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AgentEditAdPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Partial<Ad>>({
    title: "",
    description: "",
    price: 0,
    priceType: "negotiable",
    categoryId: "",
    city: "",
    district: "",
    address: "",
    contactPhone: "",
    contactName: "",
    isUrgent: false,
    adType: "sale",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adData, categoriesData] = await Promise.all([
          adsApi.getById(params.id as string),
          categoryApi.getAll(),
        ]);
        setFormData(adData.data || adData);
        setCategories(categoriesData || []);
      } catch (error) {
        toast.error("خطا در دریافت اطلاعات");
        router.push("/panel/agent/my-ads");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adsApi.update(params.id as string, formData);
      toast.success("آگهی با موفقیت ویرایش شد");
      router.push("/panel/agent/my-ads");
    } catch (error) {
      toast.error("خطا در ویرایش آگهی");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
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
      className="space-y-6 max-w-4xl mx-auto pb-8"
      dir="rtl"
    >
      {/* هدر */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Link href="/panel/agent/my-ads">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">ویرایش آگهی</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            اطلاعات آگهی آژانس خود را ویرایش کنید
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* اطلاعات پایه */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                اطلاعات پایه
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">
                  عنوان آگهی <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold">
                  دسته‌بندی <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.categoryId || formData.category?._id || ""}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">
                    قیمت (تومان) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">نوع قیمت</Label>
                  <Select
                    value={formData.priceType || "negotiable"}
                   onValueChange={(value) => setFormData({ ...formData, priceType: value as "fixed" | "negotiable" | "auction" })}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">قیمت ثابت</SelectItem>
                      <SelectItem value="negotiable">توافقی</SelectItem>
                      <SelectItem value="auction">مزایده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold">نوع آگهی</Label>
                <Select
                  value={formData.adType || "sale"}
             onValueChange={(value) => setFormData({ ...formData, adType: value as "sale" | "rent" | "daily_rent" | "exchange" | "mortgage" })}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">💰 فروش</SelectItem>
                    <SelectItem value="rent">🏠 اجاره</SelectItem>
                    <SelectItem value="daily_rent">📅 اجاره روزانه</SelectItem>
                    <SelectItem value="exchange">🔄 معاوضه</SelectItem>
                    <SelectItem value="mortgage">🏦 رهن</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold">
                  توضیحات <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary resize-none"
                  required
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* موقعیت مکانی */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
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
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">محله</Label>
                  <Input
                    value={formData.district || ""}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">آدرس دقیق</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* اطلاعات تماس */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/20 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                اطلاعات تماس
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">
                    شماره تماس <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.contactPhone || ""}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold">نام تماس‌گیرنده</Label>
                  <Input
                    value={formData.contactName || ""}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* دکمه‌ها */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <Link href="/panel/agent/my-ads" className="w-full sm:w-auto order-2 sm:order-1">
            <Button type="button" variant="outline" className="w-full gap-2 rounded-xl h-10 border-border/60 hover:bg-muted">
              انصراف
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto gap-2 rounded-xl h-10 px-6 font-bold shadow-md shadow-primary/20 order-1 sm:order-2"
          >
            {saving ? (
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