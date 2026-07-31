"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";
import { adminApi } from "@/services/api/admin.api";

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  nationalCode?: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
  lastLogin?: string;
}

const roleLabels: Record<string, string> = {
  user: "کاربر عادی",
  vip: "کاربر ویژه",
  agent: "مشاور / آژانس",
  expert: "کارشناس",
  admin: "ادمین",
  super_admin: "مدیر ارشد",
  developer: "توسعه‌دهنده",
};

export default function SuperAdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/users/admin/${params.id}`);
      setUser(response.data.data);
      setSelectedRole(response.data.data.role);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      if (error.response?.status === 404) {
        toast.error("کاربر یافت نشد");
      } else {
        toast.error("خطا در دریافت اطلاعات کاربر");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === user?.role) return;
    setUpdatingRole(true);
    try {
      await adminApi.updateUserRole(params.id as string, selectedRole);
      toast.success("نقش کاربر با موفقیت تغییر یافت");
      fetchUser();
    } catch {
      toast.error("خطا در تغییر نقش کاربر");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleBanToggle = async () => {
    try {
      if (user?.isBanned) {
        await adminApi.unbanUser(params.id as string);
        toast.success("کاربر رفع مسدودیت شد");
      } else {
        await adminApi.banUser(params.id as string, "توسط سوپرادمین");
        toast.success("کاربر مسدود شد");
      }
      fetchUser();
    } catch {
      toast.error("خطا در تغییر وضعیت کاربر");
    }
  };

  const handleDeleteUser = async () => {
    if (confirm("آیا از حذف این کاربر مطمئن هستید؟")) {
      try {
        await adminApi.deleteUser(params.id as string);
        toast.success("کاربر حذف شد");
        router.push("/panel/super-admin/users");
      } catch {
        toast.error("خطا در حذف کاربر");
      }
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR");
  };

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">کاربر یافت نشد</p>
        <Link href="/panel/super-admin/users">
          <Button className="mt-4">بازگشت به لیست</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/panel/super-admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">جزئیات کاربر</h1>
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? "فعال" : "غیرفعال"}
        </Badge>
        {user.isBanned && <Badge variant="destructive">مسدود</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* اطلاعات اصلی */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                اطلاعات شخصی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">نام</p>
                  <p className="font-medium">{user.firstName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نام خانوادگی</p>
                  <p className="font-medium">{user.lastName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شماره موبایل</p>
                  <p className="font-medium" dir="ltr">
                    {user.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ایمیل</p>
                  <p className="font-medium">{user.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">کد ملی</p>
                  <p className="font-medium">{user.nationalCode || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاریخ عضویت</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">آخرین ورود</p>
                  <p className="font-medium">{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* بخش مدیریت */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                مدیریت نقش
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نقش کاربر</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleRoleChange}
                disabled={updatingRole || selectedRole === user.role}
                className="w-full"
              >
                {updatingRole ? "در حال تغییر..." : "تغییر نقش"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {user.isBanned ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Ban className="w-5 h-5 text-red-500" />
                )}
                وضعیت حساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                وضعیت فعلی:{" "}
                <Badge variant={user.isBanned ? "destructive" : "default"}>
                  {user.isBanned ? "مسدود" : "فعال"}
                </Badge>
              </p>
              {user.banReason && (
                <p className="text-sm text-muted-foreground">
                  دلیل مسدودیت: {user.banReason}
                </p>
              )}
              <Button
                variant={user.isBanned ? "default" : "destructive"}
                onClick={handleBanToggle}
                className="w-full"
              >
                {user.isBanned ? "رفع مسدودیت" : "مسدود کردن کاربر"}
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-500 border-red-500 hover:bg-red-50"
                onClick={handleDeleteUser}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف کاربر
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
