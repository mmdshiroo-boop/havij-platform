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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  Gift,
  Crown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── تایپ‌های پلن‌ها ──────────────────────────────────
interface SubscriptionPlan {
  _id?: string;
  title: string;
  slug: string;
  price: number;
  durationDays: number;
  features: string[];
  targetRole: string;
  isPopular?: boolean;
  discount?: number;
}

interface VipPlan {
  _id?: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
  discount?: number;
  isPopular?: boolean;
}

interface MarketPlan {
  _id?: string;
  name: string;
  nameEn: string;
  duration: number; // ماه
  price: number;
  features: string[];
  isActive: boolean;
  discount?: number;
  isPopular?: boolean;
}

const defaultSubPlan: SubscriptionPlan = {
  title: "",
  slug: "",
  price: 0,
  durationDays: 30,
  features: [],
  targetRole: "all",
};

const defaultVipPlan: VipPlan = {
  name: "",
  description: "",
  price: 0,
  duration: 30,
  features: [],
  isActive: true,
};

const defaultMarketPlan: MarketPlan = {
  name: "",
  nameEn: "",
  duration: 1,
  price: 0,
  features: [],
  isActive: true,
};

// ─── فرم اشتراک ──────────────────────────────────────
const SubscriptionForm = ({
  plan,
  onSuccess,
}: {
  plan?: SubscriptionPlan;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SubscriptionPlan>(plan || defaultSubPlan);
  const [featuresText, setFeaturesText] = useState(
    (plan?.features || []).join("\n"),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setForm(plan);
      setFeaturesText((plan.features || []).join("\n"));
    } else {
      setForm(defaultSubPlan);
      setFeaturesText("");
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      features: featuresText.split("\n").filter((f) => f.trim()),
    };
    try {
      const endpoint = `/super-admin/plans/subscription${plan?._id ? `/${plan._id}` : ""}`;
      const method = plan?._id ? "put" : "post";
      await axios[method](endpoint, payload);
      toast.success(
        plan?._id ? "پلن اشتراک ویرایش شد" : "پلن اشتراک جدید ایجاد شد",
      );
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
        {plan ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> افزودن اشتراک
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? "ویرایش" : "ایجاد"} پلن اشتراک</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>عنوان</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>قیمت (تومان)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>مدت (روز)</Label>
              <Input
                type="number"
                value={form.durationDays}
                onChange={(e) =>
                  setForm({ ...form, durationDays: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>نقش هدف</Label>
              <Input
                value={form.targetRole}
                onChange={(e) =>
                  setForm({ ...form, targetRole: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>تخفیف (%)</Label>
              <Input
                type="number"
                value={form.discount || ""}
                onChange={(e) =>
                  setForm({ ...form, discount: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>ویژگی‌ها (هر خط یک ویژگی)</Label>
            <Textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={5}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="subPopular"
              checked={form.isPopular || false}
              onCheckedChange={(c) => setForm({ ...form, isPopular: !!c })}
            />
            <Label htmlFor="subPopular">پیشنهاد ویژه</Label>
          </div>
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

// ─── فرم VIP ──────────────────────────────────────────
const VipPlanForm = ({
  plan,
  onSuccess,
}: {
  plan?: VipPlan;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<VipPlan>(plan || defaultVipPlan);
  const [featuresText, setFeaturesText] = useState(
    (plan?.features || []).join("\n"),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setForm(plan);
      setFeaturesText((plan.features || []).join("\n"));
    } else {
      setForm(defaultVipPlan);
      setFeaturesText("");
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      features: featuresText.split("\n").filter((f) => f.trim()),
    };
    try {
      const endpoint = `/super-admin/plans/vip${plan?._id ? `/${plan._id}` : ""}`;
      const method = plan?._id ? "put" : "post";
      await axios[method](endpoint, payload);
      toast.success(plan?._id ? "پلن VIP ویرایش شد" : "پلن VIP جدید ایجاد شد");
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
        {plan ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> افزودن VIP
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? "ویرایش" : "ایجاد"} پلن VIP</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>نام</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>قیمت (تومان)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>مدت (روز)</Label>
              <Input
                type="number"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>تخفیف (%)</Label>
              <Input
                type="number"
                value={form.discount || ""}
                onChange={(e) =>
                  setForm({ ...form, discount: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>توضیحات</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>ویژگی‌ها (هر خط یک ویژگی)</Label>
            <Textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={5}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="vipActive"
                checked={form.isActive}
                onCheckedChange={(c) => setForm({ ...form, isActive: !!c })}
              />
              <Label htmlFor="vipActive">فعال</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="vipPopular"
                checked={form.isPopular || false}
                onCheckedChange={(c) => setForm({ ...form, isPopular: !!c })}
              />
              <Label htmlFor="vipPopular">محبوب</Label>
            </div>
          </div>
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

// ─── فرم تحلیل بازار ──────────────────────────────────
const MarketPlanForm = ({
  plan,
  onSuccess,
}: {
  plan?: MarketPlan;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MarketPlan>(plan || defaultMarketPlan);
  const [featuresText, setFeaturesText] = useState(
    (plan?.features || []).join("\n"),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setForm(plan);
      setFeaturesText((plan.features || []).join("\n"));
    } else {
      setForm(defaultMarketPlan);
      setFeaturesText("");
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      features: featuresText.split("\n").filter((f) => f.trim()),
    };
    try {
      const endpoint = `/super-admin/plans/market${plan?._id ? `/${plan._id}` : ""}`;
      const method = plan?._id ? "put" : "post";
      await axios[method](endpoint, payload);
      toast.success(
        plan?._id
          ? "پلن تحلیل بازار ویرایش شد"
          : "پلن تحلیل بازار جدید ایجاد شد",
      );
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
        {plan ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> افزودن تحلیل بازار
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? "ویرایش" : "ایجاد"} پلن تحلیل بازار</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>نام</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>نام انگلیسی</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>قیمت (تومان)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>مدت (ماه)</Label>
              <Input
                type="number"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>تخفیف (%)</Label>
              <Input
                type="number"
                value={form.discount || ""}
                onChange={(e) =>
                  setForm({ ...form, discount: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>ویژگی‌ها (هر خط یک ویژگی)</Label>
            <Textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="mActive"
                checked={form.isActive}
                onCheckedChange={(c) => setForm({ ...form, isActive: !!c })}
              />
              <Label htmlFor="mActive">فعال</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="mPopular"
                checked={form.isPopular || false}
                onCheckedChange={(c) => setForm({ ...form, isPopular: !!c })}
              />
              <Label htmlFor="mPopular">محبوب</Label>
            </div>
          </div>
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

// ─── دیالوگ حذف ──────────────────────────────────────
const DeleteAlert = ({
  id,
  name,
  type,
  onSuccess,
}: {
  id: string;
  name: string;
  type: "subscription" | "vip" | "market";
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/super-admin/plans/${type}/${id}`);
      toast.success("پلن حذف شد");
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
          <AlertDialogTitle>حذف پلن "{name}"</AlertDialogTitle>
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

// ─── منوی عمودی ─────────────────────────────────────
const menuItems = [
  { id: "subscription", label: "اشتراک", icon: Gift },
  { id: "vip", label: "VIP", icon: Crown },
  { id: "market", label: "تحلیل بازار", icon: TrendingUp },
];

// ─── صفحه اصلی ──────────────────────────────────────
export default function SubscriptionsPage() {
  const [subPlans, setSubPlans] = useState<SubscriptionPlan[]>([]);
  const [vipPlans, setVipPlans] = useState<VipPlan[]>([]);
  const [marketPlans, setMarketPlans] = useState<MarketPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("subscription");

  const fetchSubPlans = useCallback(async () => {
    try {
      const { data } = await axios.get("/super-admin/plans/subscription");
      if (data.success) setSubPlans(data.data);
    } catch (error) {
      toast.error("خطا در دریافت اشتراک‌ها");
    }
  }, []);

  const fetchVipPlans = useCallback(async () => {
    try {
      const { data } = await axios.get("/super-admin/plans/vip");
      if (data.success) setVipPlans(data.data);
    } catch (error) {
      toast.error("خطا در دریافت VIPها");
    }
  }, []);

  const fetchMarketPlans = useCallback(async () => {
    try {
      const { data } = await axios.get("/super-admin/plans/market");
      if (data.success) setMarketPlans(data.data);
    } catch (error) {
      toast.error("خطا در دریافت پلن‌های تحلیل بازار");
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSubPlans(), fetchVipPlans(), fetchMarketPlans()]);
    setLoading(false);
  }, [fetchSubPlans, fetchVipPlans, fetchMarketPlans]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const currentPlans =
    activeMenu === "subscription"
      ? subPlans
      : activeMenu === "vip"
        ? vipPlans
        : marketPlans;
  const isSub = activeMenu === "subscription";
  const isVip = activeMenu === "vip";
  const isMarket = activeMenu === "market";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Gift className="w-7 h-7 text-primary" />
            مدیریت پلن‌ها
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            پلن‌های اشتراک، VIP و تحلیل بازار را مدیریت کنید.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchAll}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* دو ستونه */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* منوی عمودی */}
        <div className="w-full md:w-[20%] lg:w-[18%]">
          <div className="sticky top-20 space-y-1.5 bg-background/50 rounded-xl p-2 border border-border/50">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-right",
                    "text-muted-foreground bg-transparent",
                    "hover:bg-primary/10 hover:text-primary hover:shadow-sm",
                    "active:scale-[0.98]",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold"
                      : "font-medium",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isActive && "text-primary-foreground scale-110",
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* جدول محتوا */}
        <div className="w-full md:w-[80%] lg:w-[82%] space-y-4">
          <div className="flex justify-end">
            {isSub && <SubscriptionForm onSuccess={fetchSubPlans} />}
            {isVip && <VipPlanForm onSuccess={fetchVipPlans} />}
            {isMarket && <MarketPlanForm onSuccess={fetchMarketPlans} />}
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isSub ? "عنوان" : "نام"}</TableHead>
                  <TableHead>قیمت</TableHead>
                  <TableHead>{isMarket ? "مدت (ماه)" : "مدت (روز)"}</TableHead>
                  {isVip && <TableHead>محبوب</TableHead>}
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      {isVip && (
                        <TableCell>
                          <Skeleton className="h-5 w-12 rounded-full" />
                        </TableCell>
                      )}
                      <TableCell>
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </TableCell>
                      <TableCell className="flex justify-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentPlans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isVip ? 6 : 5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      پلنی یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPlans.map((plan: any, idx: number) => {
                    const uniqueKey = plan._id || `${activeMenu}-${idx}`;
                    return (
                      <TableRow key={uniqueKey}>
                        <TableCell className="font-bold">
                          {isSub ? plan.title : plan.name}
                        </TableCell>
                        <TableCell>
                          {plan.price?.toLocaleString()} تومان
                        </TableCell>
                        <TableCell>
                          {plan.durationDays || plan.duration}{" "}
                          {isMarket ? "ماه" : "روز"}
                        </TableCell>
                        {isVip && (
                          <TableCell>
                            {plan.isPopular ? (
                              <Badge className="bg-amber-500">محبوب</Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          {isSub ? (
                            <Badge
                              variant={plan.isPopular ? "default" : "outline"}
                            >
                              {plan.isPopular ? "پیشنهاد ویژه" : "عادی"}
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                plan.isActive ? "default" : "destructive"
                              }
                            >
                              {plan.isActive ? "فعال" : "غیرفعال"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {isSub && (
                              <SubscriptionForm
                                plan={plan}
                                onSuccess={fetchSubPlans}
                              />
                            )}
                            {isVip && (
                              <VipPlanForm
                                plan={plan}
                                onSuccess={fetchVipPlans}
                              />
                            )}
                            {isMarket && (
                              <MarketPlanForm
                                plan={plan}
                                onSuccess={fetchMarketPlans}
                              />
                            )}
                            <DeleteAlert
                              id={uniqueKey}
                              name={isSub ? plan.title : plan.name}
                              type={
                                activeMenu as "subscription" | "vip" | "market"
                              }
                              onSuccess={() => {
                                if (isSub) fetchSubPlans();
                                else if (isVip) fetchVipPlans();
                                else fetchMarketPlans();
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
