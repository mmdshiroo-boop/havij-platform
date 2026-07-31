// app/panel/agent/edit-ad/[id]/page.tsx
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
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { adsApi, Ad } from "@/services/api/ads.api";
import { categoryApi, Category } from "@/services/api/category.api";

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
        setFormData(adData.data);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("خطا در دریافت اطلاعات");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adsApi.update(params.id as string, formData);
      toast.success("آگهی با موفقیت ویرایش شد");
      router.push("/panel/agent/my-ads"); // بازگشت به لیست آگهی‌های agent
    } catch (error) {
      console.error("Error updating ad:", error);
      toast.error("خطا در ویرایش آگهی");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // کلاس مشترک برای فوکوس نارنجی روی اینپوت‌ها
  const focusOrangeClass =
    "focus-visible:ring-orange-500 focus-visible:border-orange-500";

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر صفحه */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/panel/agent/my-ads">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-orange-500/10 hover:text-orange-600"
            >
              {/* چرخش آیکون برای حالت RTL */}
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black">ویرایش آگهی (آژانس)</h1>
            <p className="text-muted-foreground text-sm mt-1">
              اطلاعات آگهی آژانس خود را ویرایش کنید
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* اطلاعات پایه */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              اطلاعات پایه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* عنوان */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-semibold">
                عنوان آگهی <span className="text-orange-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={focusOrangeClass}
                required
              />
            </div>

            {/* دسته‌بندی */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-sm font-semibold">
                دسته‌بندی <span className="text-orange-500">*</span>
              </Label>
              <Select
                value={formData.categoryId || formData.category?._id || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger className={`w-full ${focusOrangeClass}`}>
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

            {/* قیمت و نوع قیمت */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-semibold">
                  قیمت (تومان) <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  className={focusOrangeClass}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priceType" className="text-sm font-semibold">
                  نوع قیمت
                </Label>
                <Select
                  value={formData.priceType || "negotiable"}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priceType: value })
                  }
                >
                  <SelectTrigger className={focusOrangeClass}>
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

            {/* نوع آگهی */}
            <div className="space-y-1.5">
              <Label htmlFor="adType" className="text-sm font-semibold">
                نوع آگهی
              </Label>
              <Select
                value={formData.adType || "sale"}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, adType: value })
                }
              >
                <SelectTrigger className={focusOrangeClass}>
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

            {/* توضیحات */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-semibold">
                توضیحات <span className="text-orange-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={6}
                className={focusOrangeClass}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* موقعیت مکانی */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              موقعیت مکانی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-sm font-semibold">
                  شهر <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className={focusOrangeClass}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district" className="text-sm font-semibold">
                  محله
                </Label>
                <Input
                  id="district"
                  value={formData.district || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  className={focusOrangeClass}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-semibold">
                آدرس دقیق
              </Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className={focusOrangeClass}
              />
            </div>
          </CardContent>
        </Card>

        {/* اطلاعات تماس */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              اطلاعات تماس
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone" className="text-sm font-semibold">
                  شماره تماس <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  className={focusOrangeClass}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactName" className="text-sm font-semibold">
                  نام تماس گیرنده
                </Label>
                <Input
                  id="contactName"
                  value={formData.contactName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  className={focusOrangeClass}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* دکمه‌های فرم */}
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/panel/agent/my-ads">
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-xl px-5 border-border hover:bg-muted"
            >
              انصراف
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="gap-2 rounded-xl px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md shadow-orange-500/10"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                ذخیره تغییرات
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
