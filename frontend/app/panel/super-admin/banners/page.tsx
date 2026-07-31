"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "@/services/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

// ─── تایپ بنر ─────────────────────────────────────────
interface AdBanner {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: "header" | "sidebar" | "between_ads" | "footer";
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  clicks: number;
  views: number;
  createdAt: string;
}

const defaultBanner: Partial<AdBanner> = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  position: "sidebar",
  isActive: true,
  startDate: "",
  endDate: "",
};

const positions = [
  { value: "header", label: "هدر" },
  { value: "sidebar", label: "سایدبار" },
  { value: "between_ads", label: "بین آگهی‌ها" },
  { value: "footer", label: "فوتر" },
];

// ─── فرم ایجاد/ویرایش ────────────────────────────────
const BannerForm = ({
  banner,
  onSuccess,
}: {
  banner?: AdBanner;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<AdBanner>>(banner || defaultBanner);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (banner) setForm(banner);
    else setForm(defaultBanner);
  }, [banner, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // آدرس اصلاح شده – استفاده از مسیر جدید سوپر ادمین
      const endpoint = `/super-admin/banners${banner?._id ? `/${banner._id}` : ""}`;
      const method = banner?._id ? "put" : "post";
      await axios[method](endpoint, form);
      toast.success(banner?._id ? "بنر ویرایش شد" : "بنر جدید ایجاد شد");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {banner ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> افزودن بنر جدید
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{banner ? "ویرایش" : "ایجاد"} بنر</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>عنوان</Label>
            <Input
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>آدرس تصویر</Label>
              <Input
                value={form.imageUrl || ""}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                required
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <Label>لینک مقصد</Label>
              <Input
                value={form.linkUrl || ""}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                required
                placeholder="https://..."
                dir="ltr"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>موقعیت</Label>
              <Select
                value={form.position}
                onValueChange={(val) =>
                  setForm({ ...form, position: val as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>وضعیت</Label>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(c) => setForm({ ...form, isActive: !!c })}
                />
                <Label htmlFor="isActive">فعال</Label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>تاریخ شروع</Label>
              <Input
                type="date"
                value={form.startDate?.split("T")[0] || ""}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>تاریخ پایان</Label>
              <Input
                type="date"
                value={form.endDate?.split("T")[0] || ""}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          {form.imageUrl && (
            <div className="mt-2 rounded-lg border overflow-hidden h-32 flex items-center justify-center bg-muted">
              <img
                src={form.imageUrl}
                alt="پیش‌نمایش"
                className="max-h-full object-contain"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "ذخیره..." : "ذخیره"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── تأیید حذف ──────────────────────────────────────
const DeleteBannerAlert = ({
  id,
  title,
  onSuccess,
}: {
  id: string;
  title: string;
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      // آدرس اصلاح شده
      await axios.delete(`/super-admin/banners/${id}`);
      toast.success("بنر حذف شد");
      onSuccess();
    } catch (error: any) {
      toast.error("خطا در حذف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف بنر "{title}"</AlertDialogTitle>
          <AlertDialogDescription>
            این عملیات غیرقابل بازگشت است.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// ─── صفحه اصلی ──────────────────────────────────────
export default function BannersPage() {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      // آدرس اصلاح شده
      const { data } = await axios.get("/super-admin/banners");
      setBanners(data.data || data || []);
    } catch (error) {
      toast.error("خطا در دریافت بنرها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ImageIcon className="w-7 h-7 text-primary" />
            مدیریت بنرهای تبلیغاتی
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            بنرهای نمایشی در موقعیت‌های مختلف سایت را مدیریت کنید.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchBanners}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <BannerForm onSuccess={fetchBanners} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>پیش‌نمایش</TableHead>
              <TableHead>عنوان</TableHead>
              <TableHead>موقعیت</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>کلیک/بازدید</TableHead>
              <TableHead className="text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  هیچ بنری یافت نشد.
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner._id}>
                  <TableCell>
                    <div className="w-16 h-10 rounded bg-muted overflow-hidden flex items-center justify-center">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{banner.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {positions.find((p) => p.value === banner.position)
                        ?.label || banner.position}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={banner.isActive ? "default" : "destructive"}
                    >
                      {banner.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="text-primary">{banner.clicks || 0}</span>
                    <span className="mx-1">/</span>
                    <span>{banner.views || 0}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <BannerForm banner={banner} onSuccess={fetchBanners} />
                      <DeleteBannerAlert
                        id={banner._id}
                        title={banner.title}
                        onSuccess={fetchBanners}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
