"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { adminApi } from "@/services/api/admin.api";
import {
  Search,
  RefreshCw,
  Ban,
  CheckCircle,
  Trash2,
  UserCog,
  Filter,
  RotateCcw,
  Eye,
} from "lucide-react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface UserItem {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isBanned: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [startDate, setStartDate] = useState<DateObject | null>(null);
  const [endDate, setEndDate] = useState<DateObject | null>(null);
  const [page, setPage] = useState(1);

  // Action states
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [banTarget, setBanTarget] = useState<UserItem | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter === "active") params.status = "active";
      else if (statusFilter === "banned") params.status = "banned";
      if (verifiedFilter === "true") params.isVerified = "true";
      else if (verifiedFilter === "false") params.isVerified = "false";
      if (startDate) params.startDate = startDate.toDate().toISOString();
      if (endDate) params.endDate = endDate.toDate().toISOString();

      const res = await adminApi.getAllUsers(params);
      setUsers(res.data || []);
      setPagination(
        res.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      );
    } catch {
      toast.error("خطا در دریافت کاربران");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    roleFilter,
    statusFilter,
    verifiedFilter,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handlers
  const handleBanUser = async (id: string, isBanned: boolean) => {
    try {
      if (isBanned) await adminApi.unbanUser(id);
      else await adminApi.banUser(id);
      toast.success(isBanned ? "کاربر رفع مسدودیت شد" : "کاربر مسدود شد");
      fetchUsers();
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await adminApi.deleteUser(id);
      toast.success("کاربر حذف شد");
      fetchUsers();
    } catch {
      toast.error("خطا در حذف کاربر");
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await adminApi.updateUserRole(selectedUser._id, newRole);
      toast.success("نقش کاربر تغییر یافت");
      setShowRoleDialog(false);
      fetchUsers();
    } catch {
      toast.error("خطا در تغییر نقش");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setVerifiedFilter("all");
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      user: { label: "کاربر", color: "bg-gray-100 text-gray-800" },
      vip: { label: "ویژه", color: "bg-yellow-100 text-yellow-800" },
      agent: { label: "مشاور", color: "bg-blue-100 text-blue-800" },
      expert: { label: "کارشناس", color: "bg-green-100 text-green-800" },
      admin: { label: "ادمین", color: "bg-red-100 text-red-800" },
      super_admin: {
        label: "مدیر ارشد",
        color: "bg-purple-100 text-purple-800",
      },
    };
    const item = roles[role] || { label: role, color: "bg-gray-100" };
    return <Badge className={item.color}>{item.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">مدیریت کاربران</h1>
          <p className="text-sm text-muted-foreground">
            مدیریت تمام کاربران سیستم
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 ml-1" /> پاک‌کردن فیلترها
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 ml-1" /> به‌روزرسانی
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">فیلترها</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-1">جستجو</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="نام، تلفن یا ایمیل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          {/* Role */}
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
                <SelectItem value="user">کاربر عادی</SelectItem>
                <SelectItem value="vip">کاربر ویژه</SelectItem>
                <SelectItem value="agent">مشاور</SelectItem>
                <SelectItem value="expert">کارشناس</SelectItem>
                <SelectItem value="admin">ادمین</SelectItem>
                <SelectItem value="super_admin">مدیر ارشد</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Status */}
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
                <SelectItem value="banned">مسدود</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Verified */}
          <div>
            <label className="block text-sm font-medium mb-1">
              تأیید موبایل
            </label>
            <Select
              value={verifiedFilter}
              onValueChange={(v) => {
                setVerifiedFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="همه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="true">تأیید شده</SelectItem>
                <SelectItem value="false">تأیید نشده</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Date range */}
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
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>نام</TableHead>
                <TableHead>موبایل</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تأیید</TableHead>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    هیچ کاربری یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">
                      {user.phone}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.isBanned ? (
                        <Badge variant="destructive">مسدود</Badge>
                      ) : (
                        <Badge variant="default">فعال</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.phoneVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Ban className="w-4 h-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* لینک مشاهده جزئیات */}
                        <Link href={`/panel/super-admin/users/${user._id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="مشاهده جزئیات"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                        </Link>
                        {user.isBanned ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500"
                            onClick={() => handleBanUser(user._id, true)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => setBanTarget(user)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setShowRoleDialog(true);
                          }}
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(user)}
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
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center bg-card rounded-xl border border-border p-4">
          <span className="text-sm text-muted-foreground">
            صفحه {pagination.page} از {pagination.pages} | کل:{" "}
            {pagination.total} کاربر
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
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر نقش کاربر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>
              کاربر: {selectedUser?.firstName} {selectedUser?.lastName}
            </p>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب نقش" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">کاربر عادی</SelectItem>
                <SelectItem value="vip">کاربر ویژه</SelectItem>
                <SelectItem value="agent">مشاور</SelectItem>
                <SelectItem value="expert">کارشناس</SelectItem>
                <SelectItem value="admin">ادمین</SelectItem>
                <SelectItem value="super_admin">مدیر ارشد</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleChangeRole}>اعمال تغییر</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation */}
      <AlertDialog open={!!banTarget} onOpenChange={() => setBanTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مسدود کردن کاربر</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از مسدود کردن {banTarget?.firstName} {banTarget?.lastName}{" "}
              اطمینان دارید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (banTarget) handleBanUser(banTarget._id, false);
                setBanTarget(null);
              }}
            >
              مسدود کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کاربر</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف کامل {deleteTarget?.firstName} {deleteTarget?.lastName}{" "}
              اطمینان دارید؟ این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) handleDeleteUser(deleteTarget._id);
                setDeleteTarget(null);
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
