"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { adminApi, AdminUser } from "@/services/api/admin.api";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  UserCog,
  Search,
  Filter,
  RotateCcw,
  CheckCircle,
  Ban,
} from "lucide-react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const ITEMS_PER_PAGE = 20;

// هوک Debounce (برای جلوگیری از رفرش هنگام تایپ)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // فیلترها و صفحه‌بندی
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<DateObject | null>(null);
  const [endDate, setEndDate] = useState<DateObject | null>(null);
  const [page, setPage] = useState(1);

  // مودال‌ها
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "admin" as "admin" | "super_admin",
    password: "",
  });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAdmins();
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("خطا در دریافت لیست ادمین‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleSubmit = async () => {
    try {
      if (editingAdmin) {
        // حذف فیلد رمز عبور در صورت خالی بودن موقع ویرایش
const { password: _pass, ...payloadWithoutPassword } = formData;
const payload = formData.password ? formData : payloadWithoutPassword;

        await adminApi.updateAdmin(editingAdmin._id, payload);
        toast.success("ادمین با موفقیت ویرایش شد");
      } else {
        await adminApi.createAdmin(formData as any);
        toast.success("ادمین با موفقیت ایجاد شد");
      }
      setOpenDialog(false);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      console.error("Error saving admin:", error);
      toast.error(error.response?.data?.message || "خطا در ذخیره ادمین");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteAdmin(deleteTarget._id);
      toast.success("ادمین با موفقیت حذف شد");
      setDeleteTarget(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("خطا در حذف ادمین");
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    try {
      await adminApi.toggleAdminStatus(toggleTarget._id);
      toast.success(`ادمین ${toggleTarget.isActive ? "غیرفعال" : "فعال"} شد`);
      setToggleTarget(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error toggling admin status:", error);
      toast.error("خطا در تغییر وضعیت ادمین");
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      phone: admin.phone,
      email: admin.email || "",
      role: admin.role,
      password: "",
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setEditingAdmin(null);
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      role: "admin",
      password: "",
    });
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const getRoleBadge = (role: string) => {
    if (role === "super_admin") {
      return <Badge className="bg-purple-500">مدیر ارشد</Badge>;
    }
    return <Badge className="bg-blue-500">ادمین</Badge>;
  };

  // فیلتر کردن لیست ادمین‌ها
  const filteredAdmins = admins.filter((admin) => {
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      const matchSearch =
        admin.firstName?.toLowerCase().includes(s) ||
        admin.lastName?.toLowerCase().includes(s) ||
        admin.phone?.includes(s) ||
        admin.email?.toLowerCase().includes(s);
      if (!matchSearch) return false;
    }

    if (roleFilter !== "all" && admin.role !== roleFilter) return false;

    if (statusFilter === "active" && admin.isActive !== true) return false;
    if (statusFilter === "inactive" && admin.isActive !== false) return false;

    if (startDate || endDate) {
      const created = new Date(admin.createdAt);
      if (startDate) {
        const start = startDate.toDate();
        start.setHours(0, 0, 0, 0);
        if (created < start) return false;
      }
      if (endDate) {
        const end = endDate.toDate();
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
    }

    return true;
  });

  // محاسبه دقیق صفحه‌بندی بر اساس نتایج فیلتر شده
  const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE) || 1;
  const pagedAdmins = filteredAdmins.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* هدر گرادینت */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <UserCog className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                مدیریت ادمین‌ها
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                افزودن، ویرایش و حذف ادمین‌های سیستم
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAdmins}>
              <RefreshCw className="w-4 h-4 ml-1" /> به‌روزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
            >
              <Plus className="w-4 h-4 ml-1" />
              ادمین جدید
            </Button>
          </div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">فیلترها</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">جستجو</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="نام، موبایل یا ایمیل..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pr-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">نقش</label>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="همه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="admin">ادمین</SelectItem>
                <SelectItem value="super_admin">مدیر ارشد</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">وضعیت</label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="همه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">از تاریخ</label>
            <DatePicker
              value={startDate}
              onChange={(date: DateObject | null) => {
                setStartDate(date);
                setPage(1);
              }}
              calendar={persian}
              locale={persian_fa}
              format="YYYY/MM/DD"
              placeholder="انتخاب تاریخ"
              className="w-full border border-input rounded-lg p-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تا تاریخ</label>
            <DatePicker
              value={endDate}
              onChange={(date: DateObject | null) => {
                setEndDate(date);
                setPage(1);
              }}
              calendar={persian}
              locale={persian_fa}
              format="YYYY/MM/DD"
              placeholder="انتخاب تاریخ"
              className="w-full border border-input rounded-lg p-2 text-sm bg-background"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 ml-1" /> پاک‌کردن فیلترها
          </Button>
        </div>
      </div>

      {/* جدول */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>نام</TableHead>
                <TableHead>موبایل</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ عضویت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : pagedAdmins.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    هیچ ادمینی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                pagedAdmins.map((admin) => (
                  <TableRow key={admin._id}>
                    <TableCell className="font-medium">
                      {admin.firstName} {admin.lastName}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">
                      {admin.phone}
                    </TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell>
                      {admin.isActive ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          فعال
                        </Badge>
                      ) : (
                        <Badge variant="destructive">غیرفعال</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(admin.createdAt).toLocaleDateString("fa-IR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToggleTarget(admin)}
                          title={admin.isActive ? "غیرفعال کردن" : "فعال کردن"}
                        >
                          {admin.isActive ? (
                            <Ban className="w-4 h-4 text-amber-500" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(admin)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(admin)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* صفحه‌بندی */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t">
            <span className="text-sm text-muted-foreground">
              صفحه {page} از {totalPages} | کل: {filteredAdmins.length} ادمین
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                قبلی
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                بعدی
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* مودال ایجاد/ویرایش */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAdmin ? "ویرایش ادمین" : "ایجاد ادمین جدید"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نام</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="نام"
                />
              </div>
              <div>
                <Label>نام خانوادگی</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="نام خانوادگی"
                />
              </div>
            </div>
            <div>
              <Label>شماره موبایل</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="09xxxxxxxxx"
                disabled={!!editingAdmin}
              />
            </div>
            <div>
              <Label>ایمیل</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="example@domain.com"
              />
            </div>
            <div>
              <Label>نقش</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "super_admin") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ادمین</SelectItem>
                  <SelectItem value="super_admin">مدیر ارشد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingAdmin && (
              <div>
                <Label>رمز عبور</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="********"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleSubmit}>
              {editingAdmin ? "ویرایش" : "ایجاد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ تأیید حذف */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف ادمین</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف {deleteTarget?.firstName} {deleteTarget?.lastName}{" "}
              اطمینان دارید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* دیالوگ تأیید تغییر وضعیت */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={() => setToggleTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive
                ? "غیرفعال کردن ادمین"
                : "فعال کردن ادمین"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از {toggleTarget?.isActive ? "غیرفعال" : "فعال"} کردن{" "}
              {toggleTarget?.firstName} {toggleTarget?.lastName} اطمینان دارید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              تأیید
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
