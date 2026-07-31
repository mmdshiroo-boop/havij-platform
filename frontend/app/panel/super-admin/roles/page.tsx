"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  SlidersHorizontal,
  RefreshCw,
  Info,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Layers,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── تایپ‌ها ────────────────────────────────────────
interface Role {
  _id: string;
  name: string;
  label: string;
  permissions: string[];
  isActive: boolean;
  createdAt?: string;
  isSystem?: boolean;
}

// ─── توضیحات و عناوین فارسی پرمیژن‌ها ─────────────
const PERMISSION_MAP: Record<string, { label: string; description: string }> = {
  "ads:read": {
    label: "مشاهده آگهی‌ها",
    description: "امکان دیدن لیست کامل آگهی‌ها",
  },
  "ads:write": {
    label: "ایجاد و ویرایش آگهی",
    description: "ثبت آگهی جدید یا ویرایش موارد موجود",
  },
  "ads:delete": {
    label: "حذف آگهی",
    description: "حذف آگهی‌های ثبت‌شده در سیستم",
  },
  "ads:approve": {
    label: "تأیید/رد آگهی",
    description: "تغییر وضعیت انتشار آگهی‌ها",
  },

  "users:read": {
    label: "مشاهده کاربران",
    description: "مشاهده لیست و اطلاعات کاربران",
  },
  "users:write": {
    label: "ایجاد و ویرایش کاربر",
    description: "ویرایش پروفایل یا ثبت کاربر جدید",
  },
  "users:delete": { label: "حذف کاربر", description: "حذف حساب کاربری" },
  "users:ban": {
    label: "مسدودسازی کاربر",
    description: "مسدود یا فعال‌سازی مجدد کاربران",
  },

  "categories:read": {
    label: "مشاهده دسته‌بندی‌ها",
    description: "دیدن ساختار دسته‌بندی‌ها",
  },
  "categories:write": {
    label: "مدیریت دسته‌بندی‌ها",
    description: "افزودن، ویرایش و حذف دسته‌ها",
  },

  "roles:read": {
    label: "مشاهده نقش‌ها",
    description: "دیدن نقش‌ها و سطح دسترسی‌ها",
  },
  "roles:write": {
    label: "مدیریت نقش‌ها",
    description: "ایجاد، ویرایش و حذف نقش‌های دستیار",
  },

  "tickets:read": {
    label: "مشاهده تیکت‌ها",
    description: "دیدن تیکت‌های پشتیبانی کاربران",
  },
  "tickets:write": {
    label: "پاسخ به تیکت",
    description: "ارسال پاسخ و تغییر وضعیت تیکت‌ها",
  },

  "reports:read": {
    label: "مشاهده گزارش‌ها",
    description: "دیدن گزارش‌های تخلف ارسال‌شده",
  },
  "reports:handle": {
    label: "رسیدگی به گزارش‌ها",
    description: "تغییر وضعیت یا اقدام روی تخلفات",
  },

  "financial:read": {
    label: "مشاهده آمار مالی",
    description: "دسترسی به تراکنش‌ها و گزارش درآمد",
  },

  "banners:read": {
    label: "مشاهده بنرها",
    description: "دیدن بنرهای تبلیغاتی",
  },
  "banners:write": {
    label: "مدیریت بنرها",
    description: "افزودن و ویرایش بنرهای سایت",
  },

  "webhooks:read": {
    label: "مشاهده وب‌هوک‌ها",
    description: "دیدن وب‌هوک‌های فعال سیستم",
  },
  "webhooks:write": {
    label: "مدیریت وب‌هوک‌ها",
    description: "افزودن و ویرایش کلیدهای اتصال",
  },

  "api-keys:read": {
    label: "مشاهده کلیدهای API",
    description: "دیدن لیست کلیدهای برنامه‌نویسی",
  },
  "api-keys:write": {
    label: "مدیریت کلیدهای API",
    description: "ساخت یا ابطال کلیدهای دسترسی",
  },

  "settings:read": {
    label: "مشاهده تنظیمات",
    description: "دیدن تنظیمات عمومی سیستم",
  },
  "settings:write": {
    label: "ویرایش تنظیمات",
    description: "تغییر پیکربندی‌های کلی سایت",
  },

  "logs:read": {
    label: "مشاهده لاگ‌های سیستم",
    description: "دسترسی به رویدادها و لاگ‌های امنیتی",
  },
};

// ─── گروه‌های پرمیژن ─────────────────────
const PERMISSION_GROUPS = [
  {
    group: "آگهی‌ها",
    description: "دسترسی به ثبت، ویرایش و تایید آگهی‌ها",
    items: ["ads:read", "ads:write", "ads:delete", "ads:approve"],
  },
  {
    group: "کاربران",
    description: "مشاهده و مدیریت حساب‌های کاربری",
    items: ["users:read", "users:write", "users:delete", "users:ban"],
  },
  {
    group: "دسته‌بندی‌ها",
    description: "مدیریت دسته‌بندی‌های اصلی و فرعی",
    items: ["categories:read", "categories:write"],
  },
  {
    group: "نقش‌ها و دسترسی‌ها",
    description: "تعریف نقش‌ها و سطوح دسترسی سیستم",
    items: ["roles:read", "roles:write"],
  },
  {
    group: "تیکت‌ها و پشتیبانی",
    description: "پاسخگویی به درخواست‌های کاربران",
    items: ["tickets:read", "tickets:write"],
  },
  {
    group: "گزارش‌های تخلف",
    description: "رسیدگی به گزارش‌های کاربران",
    items: ["reports:read", "reports:handle"],
  },
  {
    group: "امور مالی",
    description: "گزارش‌ها و تراکنش‌های مالی",
    items: ["financial:read"],
  },
  {
    group: "بنرهای تبلیغاتی",
    description: "مدیریت بنرها و تبلیغات متنی/تصویری",
    items: ["banners:read", "banners:write"],
  },
  {
    group: "وب‌هوک‌ها و API",
    description: "کلیدهای دسترسی توسعه‌دهندگان",
    items: [
      "webhooks:read",
      "webhooks:write",
      "api-keys:read",
      "api-keys:write",
    ],
  },
  {
    group: "تنظیمات و لاگ‌ها",
    description: "پیکربندی کلی و مشاهده رویدادها",
    items: ["settings:read", "settings:write", "logs:read"],
  },
];

// ─── کامپوننت انتخاب پرمیژن‌ها ──────────────────
const PermissionsSelector = ({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (p: string[]) => void;
}) => {
  const togglePermission = (perm: string) => {
    if (selected.includes(perm)) {
      onChange(selected.filter((p) => p !== perm));
    } else {
      onChange([...selected, perm]);
    }
  };

  const toggleGroup = (items: string[]) => {
    const allSelected = items.every((i) => selected.includes(i));
    if (allSelected) {
      onChange(selected.filter((p) => !items.includes(p)));
    } else {
      onChange([...new Set([...selected, ...items])]);
    }
  };

  return (
    <Accordion
      type="multiple"
      className="border rounded-2xl bg-card overflow-hidden"
    >
      {PERMISSION_GROUPS.map((group) => {
        const selectedCount = group.items.filter((i) =>
          selected.includes(i),
        ).length;
        const allSelected = selectedCount === group.items.length;

        return (
          <AccordionItem
            key={group.group}
            value={group.group}
            className="border-b border-border/50 last:border-0"
          >
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroup(group.items);
                  }}
                  className="flex items-center justify-center cursor-pointer"
                >
                  <Checkbox
                    checked={
                      allSelected
                        ? true
                        : selectedCount > 0
                          ? "indeterminate"
                          : false
                    }
                    className="rounded-md pointer-events-none"
                  />
                </div>
                <AccordionTrigger className="p-0 hover:no-underline flex-1 text-right">
                  <div className="flex items-center justify-between w-full pl-2">
                    <div className="text-right">
                      <span className="text-sm font-bold text-foreground block">
                        {group.group}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal block hidden sm:inline">
                        {group.description}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
              </div>

              <Badge
                variant={selectedCount > 0 ? "default" : "outline"}
                className={cn(
                  "text-[11px] font-mono shrink-0 ml-2",
                  selectedCount > 0 && "bg-primary text-primary-foreground",
                )}
              >
                {selectedCount} / {group.items.length}
              </Badge>
            </div>

            <AccordionContent className="px-5 pb-4 pt-2 bg-muted/20 border-t border-border/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {group.items.map((perm) => {
                  const info = PERMISSION_MAP[perm] || {
                    label: perm,
                    description: "مجوز سیستمی",
                  };
                  const isChecked = selected.includes(perm);

                  return (
                    <div
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={cn(
                        "flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                        isChecked
                          ? "bg-primary/10 border-primary/40 shadow-xs"
                          : "bg-background/80 border-border/60 hover:border-border",
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        className="mt-0.5 rounded-md pointer-events-none"
                      />
                      <div className="space-y-0.5 text-right flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-foreground block">
                            {info.label}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-foreground shrink-0 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <code className="text-[10px] text-primary dir-ltr block mb-1">
                                {perm}
                              </code>
                              {info.description}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

// ─── فرم افزودن / ویرایش نقش ──────────────────────
const RoleForm = ({
  role,
  onSuccess,
}: {
  role?: Role;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(role?.name || "");
  const [label, setLabel] = useState(role?.label || "");
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions || [],
  );
  const [isActive, setIsActive] = useState(role?.isActive ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role && open) {
      setName(role.name);
      setLabel(role.label);
      setPermissions(role.permissions || []);
      setIsActive(role.isActive ?? true);
    } else if (!role && open) {
      setName("");
      setLabel("");
      setPermissions([]);
      setIsActive(true);
    }
  }, [role, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !label.trim()) {
      toast.error("لطفاً تمامی فیلدهای الزامی را تکمیل کنید");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim().toLowerCase().replace(/\s+/g, "_"),
        label: label.trim(),
        permissions,
        isActive,
      };

      if (role) {
        await axios.put(`/roles/${role._id}`, payload);
        toast.success("نقش با موفقیت به‌روزرسانی شد");
      } else {
        await axios.post("/roles", payload);
        toast.success("نقش جدید با موفقیت ایجاد شد");
      }
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در ثبت اطلاعات نقش");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {role ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted rounded-lg"
          >
            <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>
        ) : (
          <Button className="gap-2 rounded-xl font-medium shadow-sm bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" /> تعریف نقش جدید
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 border-border rounded-2xl overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Shield className="w-5 h-5 text-primary" />
            {role ? `ویرایش نقش «${role.label}»` : "ایجاد نقش و مجوز جدید"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 dir-rtl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="label"
                className="text-xs font-bold text-foreground"
              >
                عنوان نقش (فارسی) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
                placeholder="مثلاً: مدیر محتوا"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-bold text-foreground flex items-center gap-1"
              >
                نام سیستمی (شناسه انگلیسی){" "}
                <span className="text-destructive">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    شناسه یکتا در سیستم (فقط حروف انگلیسی، اعداد و خط زیر _ )
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!!role}
                placeholder="content_manager"
                dir="ltr"
                className="rounded-xl font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-foreground">
                تنظیم سطوح دسترسی (مجوزها)
              </Label>
              <Badge
                variant="secondary"
                className="gap-1.5 text-xs rounded-lg px-2.5 bg-primary/10 text-primary"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                {permissions.length} دسترسی انتخاب‌شده
              </Badge>
            </div>

            <PermissionsSelector
              selected={permissions}
              onChange={setPermissions}
            />
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/60">
            <div className="flex items-center gap-3">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(!!checked)}
                className="rounded-md"
              />
              <div className="space-y-0.5">
                <Label
                  htmlFor="isActive"
                  className="text-sm font-bold cursor-pointer block"
                >
                  وضعیت فعالیت نقش
                </Label>
                <p className="text-xs text-muted-foreground">
                  در صورت غیرفعال شدن، کاربران این نقش از دسترسی به بخش‌های
                  مربوطه محروم می‌شوند.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "در حال ذخیره..." : role ? "ثبت تغییرات" : "ایجاد نقش"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── دیالوگ حذف نقش ──────────────────────────
const DeleteRoleAlert = ({
  id,
  name,
  isSystem,
  onSuccess,
}: {
  id: string;
  name: string;
  isSystem?: boolean;
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);

  if (isSystem) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled
            className="h-8 w-8 opacity-40"
          >
            <Lock className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>نقش‌های سیستمی قابل حذف نیستند</TooltipContent>
      </Tooltip>
    );
  }

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/roles/${id}`);
      toast.success("نقش با موفقیت حذف شد");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در حذف نقش");
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
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl dir-rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" />
            حذف نقش «{name}»
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm mt-2">
            آیا از حذف این نقش اطمینان دارید؟ تمامی کاربرانی که دارای این نقش
            هستند دسترسی خود به این بخش‌ها را از دست خواهند داد. این عملیات قابل
            بازگشت نیست.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "در حال حذف..." : "بله، حذف شود"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// ─── صفحه اصلی مدیریت نقش‌ها ─────────────────
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/roles");
      const rolesData = Array.isArray(data) ? data : data?.data || [];
      setRoles(rolesData);
    } catch {
      toast.error("خطا در دریافت لیست نقش‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = useMemo(() => {
    return roles.filter(
      (role) =>
        role.label?.toLowerCase().includes(search.toLowerCase()) ||
        role.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [roles, search]);

  const stats = useMemo(() => {
    const total = roles.length;
    const active = roles.filter((r) => r.isActive).length;
    const totalPermissionsCount = roles.reduce(
      (acc, r) => acc + (r.permissions?.length || 0),
      0,
    );
    return { total, active, totalPermissionsCount };
  }, [roles]);

  return (
    <TooltipProvider delayDuration={150}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 w-full"
        dir="rtl"
      >
        {/* هدر اصلی */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  مدیریت نقش‌ها و مجوزها
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  تعریف نقش‌های سفارشی و تخصیص سطح دسترسی به بخش‌های مختلف پنل
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchRoles}
                className="rounded-xl border-border"
                title="به‌روزرسانی لیست"
              >
                <RefreshCw
                  className={cn("w-4 h-4", loading && "animate-spin")}
                />
              </Button>
              <RoleForm onSuccess={fetchRoles} />
            </div>
          </div>
        </div>

        {/* کارت‌های آماری */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                کل نقش‌های تعریف‌شده
              </span>
              <div className="text-2xl font-black text-foreground">
                {loading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  stats.total.toLocaleString("fa-IR")
                )}
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                نقش‌های فعال
              </span>
              <div className="text-2xl font-black text-foreground">
                {loading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  stats.active.toLocaleString("fa-IR")
                )}
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                مجموع مجوزهای تخصیص‌یافته
              </span>
              <div className="text-2xl font-black text-foreground">
                {loading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  stats.totalPermissionsCount.toLocaleString("fa-IR")
                )}
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Key className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* فیلتر و جستجو */}
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در عنوان یا نام سیستمی نقش..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl bg-card border-border"
          />
        </div>

        {/* جدول نقش‌ها */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-border">
                <TableHead className="text-right font-medium text-muted-foreground">
                  عنوان نقش
                </TableHead>
                <TableHead className="text-right font-medium text-muted-foreground">
                  شناسه سیستمی
                </TableHead>
                <TableHead className="text-right font-medium text-muted-foreground">
                  مجوزهای کلیدی
                </TableHead>
                <TableHead className="text-right font-medium text-muted-foreground">
                  وضعیت
                </TableHead>
                <TableHead className="text-center w-[100px] font-medium text-muted-foreground">
                  عملیات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell>
                      <Skeleton className="h-5 w-28 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-48 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </TableCell>
                    <TableCell className="flex justify-center gap-1">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredRoles.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    هیچ نقشی مطابق با جستجوی شما پیدا نشد.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow
                    key={role._id}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell className="font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary shrink-0" />
                        <span>{role.label}</span>
                        {role.name === "admin" ||
                        role.name === "super_admin" ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary"
                          >
                            سیستمی
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <code className="text-xs bg-muted/80 text-foreground px-2 py-0.5 rounded-md font-mono dir-ltr inline-block border border-border/50">
                        {role.name}
                      </code>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[320px]">
                        {role.permissions?.slice(0, 3).map((p) => {
                          const pInfo = PERMISSION_MAP[p];
                          return (
                            <Badge
                              key={p}
                              variant="outline"
                              className="text-[10px] font-normal border-border bg-background"
                            >
                              {pInfo?.label || p}
                            </Badge>
                          );
                        })}
                        {(role.permissions?.length || 0) > 3 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono bg-primary/10 text-primary"
                          >
                            +{(role.permissions?.length || 0) - 3} مورد دیگر
                          </Badge>
                        )}
                        {(!role.permissions ||
                          role.permissions.length === 0) && (
                          <span className="text-xs text-muted-foreground">
                            بدون دسترسی
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={role.isActive ? "default" : "secondary"}
                        className={cn(
                          "text-[11px] font-normal px-2.5 py-0.5 rounded-md",
                          role.isActive
                            ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20"
                            : "text-muted-foreground",
                        )}
                      >
                        {role.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <RoleForm role={role} onSuccess={fetchRoles} />
                        <DeleteRoleAlert
                          id={role._id}
                          name={role.label}
                          isSystem={
                            role.name === "admin" ||
                            role.name === "super_admin" ||
                            role.isSystem
                          }
                          onSuccess={fetchRoles}
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
    </TooltipProvider>
  );
}
