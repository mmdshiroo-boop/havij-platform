// app/panel/admin/admins/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // ★ AvatarImage اضافه شد
import { motion } from "framer-motion";
import {
  Shield,
  UserCog,
  Plus,
  Trash2,
  Edit,
  Search,
  Mail,
  Phone,
  MoreVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminApi, AdminUser } from "@/services/api/admin.api";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/lib/getImageUrl"; // ★ helper تصاویر

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "admin" as "admin" | "super_admin",
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAdmins();
      const adminsWithStatus = data.map((admin: any) => ({
        ...admin,
        status: admin.status || "active",
      }));
      setAdmins(adminsWithStatus);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("خطا در دریافت لیست ادمین‌ها");
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      (admin.firstName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (admin.lastName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (admin.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      admin.phone.includes(search),
  );

  const handleCreateAdmin = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone
    ) {
      toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createAdmin(formData);
      toast.success("ادمین جدید با موفقیت ایجاد شد");
      setCreateDialogOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        role: "admin",
      });
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در ایجاد ادمین");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    try {
      await adminApi.toggleAdminStatus(admin._id);
      toast.success(
        `وضعیت ادمین "${admin.firstName} ${admin.lastName}" تغییر کرد`,
      );
      fetchAdmins();
    } catch (error) {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setSubmitting(true);
    try {
      await adminApi.deleteAdmin(selectedAdmin._id);
      toast.success(
        `ادمین "${selectedAdmin.firstName} ${selectedAdmin.lastName}" حذف شد`,
      );
      setDeleteDialogOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      toast.error("خطا در حذف ادمین");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">مدیریت ادمین‌ها</h1>
          <p className="text-sm text-muted-foreground mt-1">
            افزودن، ویرایش و حذف ادمین‌های سیستم
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          افزودن ادمین جدید
        </Button>
      </div>

      {/* جستجو */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو بر اساس نام، ایمیل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* لیست ادمین‌ها */}
      <div className="space-y-3">
        {filteredAdmins.map((admin, i) => (
          <motion.div
            key={admin._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* ★ آواتار اصلاح‌شده ★ */}
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage
                        src={
                          (admin as any).avatar
                            ? getImageUrl((admin as any).avatar)
                            : "/images/user.webp"
                        }
                        alt={admin.firstName || "ادمین"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg" />
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">
                          {admin.firstName ?? ""} {admin.lastName ?? ""}
                        </h3>
                        <Badge
                          className={
                            admin.role === "super_admin"
                              ? "bg-amber-500"
                              : "bg-primary"
                          }
                        >
                          {admin.role === "super_admin" ? "مدیر ارشد" : "ادمین"}
                        </Badge>
                        <Badge
                          className={
                            (admin as any).status === "active"
                              ? "bg-emerald-500"
                              : "bg-slate-500"
                          }
                        >
                          {(admin as any).status === "active"
                            ? "فعال"
                            : "غیرفعال"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {admin.email ?? ""}
                        </span>
                        <span className="flex items-center gap-1" dir="ltr">
                          <Phone className="w-3 h-3" />
                          {admin.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className={
                        (admin as any).status === "active"
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }
                      onClick={() => handleToggleStatus(admin)}
                    >
                      {(admin as any).status === "active" ? "غیرفعال" : "فعال"}
                    </Button>
                    {admin.role !== "super_admin" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3 h-3 ml-1" />
                        حذف
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* مودال ایجاد ادمین */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ایجاد ادمین جدید</DialogTitle>
            <DialogDescription>
              یک ادمین جدید به سیستم اضافه کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نام</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>نام خانوادگی</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ایمیل</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>شماره موبایل</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>رمز عبور موقت</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <Label>نقش</Label>
              <select
                className="w-full p-2 rounded-lg border"
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "admin" | "super_admin",
                  })
                }
              >
                <option value="admin">ادمین</option>
                <option value="super_admin">مدیر ارشد</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button
              onClick={handleCreateAdmin}
              disabled={submitting}
              className="bg-primary"
            >
              {submitting ? "در حال ایجاد..." : "ایجاد ادمین"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال حذف ادمین */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف ادمین</DialogTitle>
            <DialogDescription>
              آیا از حذف ادمین "{selectedAdmin?.firstName}{" "}
              {selectedAdmin?.lastName}" اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAdmin}
              disabled={submitting}
            >
              حذف ادمین
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}