"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreVertical,
  Shield,
  Ban,
  Trash2,
  CheckCircle,
  Eye,
  UserCog,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Edit,
  Save,
  Grid3x3,
  List,
  RefreshCw,
  X,
  FilterX,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { adminPanelApi } from "@/services/api/admin-panel.api";
import type { AdminUser } from "@/services/api/admin-panel.api";
import apiClient from "@/services/api/client";

// پیکربندی جامع نقش‌ها با توضیحات و آیکون برای UX بهتر
const roleConfig: Record<
  string,
  { label: string; badgeClass: string; desc: string; icon: any }
> = {
  user: {
    label: "کاربر عادی",
    badgeClass:
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
    desc: "دسترسی پایه به امکانات عمومی",
    icon: Users,
  },
  vip: {
    label: "کاربر ویژه",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    desc: "دسترسی به قابلیت‌های اختصاصی و ویژه",
    icon: Shield,
  },
  agent: {
    label: "آژانس املاک",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    desc: "ثبت و مدیریت آگهی‌های املاک",
    icon: Users,
  },
  developer: {
    label: "برنامه‌نویس",
    badgeClass:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    desc: "دسترسی به سرویس‌های فنی و ابزارها",
    icon: UserCog,
  },
  expert: {
    label: "کارشناس",
    badgeClass:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    desc: "بررسی و تایید محتوا و آگهی‌ها",
    icon: UserCheck,
  },
  admin: {
    label: "مدیر سیستم",
    badgeClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    desc: "دسترسی مدیریتی به بخش‌ها",
    icon: Shield,
  },
  super_admin: {
    label: "مدیر ارشد",
    badgeClass:
      "bg-red-600/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 font-bold",
    desc: "دسترسی کامل و نامحدود به سامانه",
    icon: Shield,
  },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // وضعیت‌های فیلتر و جستجو
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // وضعیت مودال‌ها و کاربر انتخاب شده
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // فرم‌ها و عملیات در حال انجام
  const [banReason, setBanReason] = useState("");
  const [newRole, setNewRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // ریست کردن صفحه هنگام تغییر فیلترها
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await adminPanelApi.getAllUsers();
      setUsers(res.data || []);
      if (isRefresh) toast.success("لیست کاربران به‌روزرسانی شد");
    } catch (err: any) {
      console.error("Error fetching users:", err);
      if (err.response?.status === 403) {
        setError("شما دسترسی لازم برای مشاهده کاربران را ندارید.");
      } else {
        setError("خطا در دریافت لیست کاربران. لطفاً دوباره تلاش کنید.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/users/admin/${selectedUser._id}`, editForm);
      toast.success("اطلاعات کاربر با موفقیت به‌روزرسانی شد");
      setEditDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error("خطا در به‌روزرسانی اطلاعات کاربر");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminPanelApi.banUser(selectedUser._id, banReason || "توسط مدیریت");
      toast.success(`کاربر ${selectedUser.firstName || ""} با موفقیت مسدود شد`);
      setBanDialogOpen(false);
      setBanReason("");
      fetchUsers();
    } catch {
      toast.error("خطا در مسدودسازی کاربر");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (user: AdminUser) => {
    setActionLoading(true);
    try {
      await adminPanelApi.unbanUser(user._id);
      toast.success("حساب کاربر با موفقیت فعال شد");
      fetchUsers();
    } catch {
      toast.error("خطا در فعال‌سازی کاربر");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role || "user");
    setRoleDialogOpen(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    setActionLoading(true);
    try {
      await adminPanelApi.updateUserRole(selectedUser._id, newRole);
      toast.success("نقش کاربر با موفقیت تغییر یافت");
      setRoleDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error("خطا در تغییر نقش کاربر");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminPanelApi.deleteUser(selectedUser._id);
      toast.success("کاربر با موفقیت حذف شد");
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error("خطا در حذف کاربر");
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // پردازش و فیلتر کاربران
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      const phone = user.phone || "";
      const email = (user.email || "").toLowerCase();
      const searchLower = search.toLowerCase().trim();

      const matchesSearch =
        !searchLower ||
        fullName.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !user.isBanned) ||
        (statusFilter === "banned" && user.isBanned);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredUsers, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => !u.isBanned).length,
      banned: users.filter((u) => u.isBanned).length,
      admins: users.filter(
        (u) => u.role === "admin" || u.role === "super_admin",
      ).length,
    };
  }, [users]);

  const isFiltered =
    search !== "" || roleFilter !== "all" || statusFilter !== "all";

  if (loading) {
    return (
      <div className="space-y-6 dir-rtl text-right" dir="rtl">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-6 bg-card rounded-2xl border border-border shadow-sm"
        dir="rtl"
      >
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold">خطا در بارگذاری اطلاعات</h3>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        <Button
          onClick={() => fetchUsers()}
          variant="default"
          className="gap-2 mt-2"
        >
          <RefreshCw className="w-4 h-4" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ==================== هدر صفحه ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            مدیریت کاربران
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            مشاهده، جستجو، تغییر نقش و نظارت بر تمامی کاربران ثبت‌شده
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="h-9 gap-2 text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            بروزرسانی
          </Button>

          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="نمایش جدولی"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-background shadow-xs text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="نمایش شبکه‌ای"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-background shadow-xs text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== کارت‌های آمار ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="کل کاربران"
          value={stats.total.toLocaleString("fa-IR")}
          icon={Users}
        />
        <StatCard
          title="کاربران فعال"
          value={stats.active.toLocaleString("fa-IR")}
          icon={UserCheck}
        />
        <StatCard
          title="کاربران مسدود"
          value={stats.banned.toLocaleString("fa-IR")}
          icon={UserX}
        />
        <StatCard
          title="مدیران و ارشدها"
          value={stats.admins.toLocaleString("fa-IR")}
          icon={Shield}
        />
      </div>

      {/* ==================== نوار جستجو و فیلترها ==================== */}
      <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* باکس جستجو */}
            <div className="flex-1 relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو با نام، شماره موبایل یا ایمیل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 pl-9 h-10 rounded-xl text-xs sm:text-sm bg-background"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* فیلتر نقش و وضعیت */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl text-xs bg-background">
                  <SelectValue placeholder="همه نقش‌ها" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">همه نقش‌ها</SelectItem>
                  {Object.entries(roleConfig).map(([v, { label }]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-10 rounded-xl text-xs bg-background">
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="banned">مسدود</SelectItem>
                </SelectContent>
              </Select>

              {isFiltered && (
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="h-10 px-3 text-xs text-muted-foreground hover:text-destructive gap-1.5 rounded-xl"
                  title="پاک کردن فیلترها"
                >
                  <FilterX className="w-4 h-4" />
                  <span className="hidden sm:inline">حذف فیلترها</span>
                </Button>
              )}
            </div>
          </div>

          {/* خلاصه تعداد نتیجه */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span>
              نمایش{" "}
              <strong className="text-foreground">
                {filteredUsers.length.toLocaleString("fa-IR")}
              </strong>{" "}
              کاربر از {stats.total.toLocaleString("fa-IR")} کاربر ثبت شده
            </span>
            {isFiltered && (
              <span className="text-amber-600 font-medium">فیلتر فعال است</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ==================== محتوای اصلی (جدول / شبکه) ==================== */}
      {filteredUsers.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 p-8 sm:p-12 text-center rounded-2xl">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-muted text-muted-foreground">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold">هیچ کاربری یافت نشد</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              هیچ کاربری با مشخصات و فیلترهای انتخابی شما تطابق ندارد.
            </p>
            {isFiltered && (
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="mt-2 gap-2 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                پاک کردن فیلترها
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === "table" ? (
        /* ========== نمایش جدولی (Table View) ========== */
        <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-right py-3.5">کاربر</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    ارتباط
                  </TableHead>
                  <TableHead className="text-right">نقش</TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    وضعیت
                  </TableHead>
                  <TableHead className="text-right hidden lg:table-cell">
                    تاریخ عضویت
                  </TableHead>
                  <TableHead className="text-left w-[80px]">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user, i) => {
                  const roleInfo = roleConfig[user.role] || {
                    label: user.role,
                    badgeClass: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border/60">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {user.firstName?.[0] || user.phone?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-foreground">
                              {user.firstName || user.lastName
                                ? `${user.firstName || ""} ${user.lastName || ""}`
                                : "بدون نام"}
                            </span>
                            <span
                              className="text-xs text-muted-foreground"
                              dir="ltr"
                            >
                              {user.phone}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell py-3 text-xs">
                        {user.email ? (
                          <span className="text-foreground/80 break-all">
                            {user.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-0.5 rounded-lg border ${roleInfo.badgeClass}`}
                        >
                          {roleInfo.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden md:table-cell py-3">
                        {user.isBanned ? (
                          <Badge
                            variant="destructive"
                            className="text-[11px] gap-1 px-2 py-0.5 rounded-lg"
                          >
                            <Ban className="w-3 h-3" />
                            مسدود
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-[11px] gap-1 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            فعال
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell py-3 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                      </TableCell>

                      <TableCell className="py-3 text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl">

                            <DropdownMenuItem
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="ml-2 h-4 w-4 text-muted-foreground" />
                              مشاهده جزئیات
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="ml-2 h-4 w-4 text-muted-foreground" />
                              ویرایش مشخصات
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenRoleModal(user)}
                            >
                              <UserCog className="ml-2 h-4 w-4 text-muted-foreground" />
                              تغییر نقش
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.isBanned ? (
                              <DropdownMenuItem
                                onClick={() => handleUnbanUser(user)}
                                className="text-emerald-600 dark:text-emerald-400"
                              >
                                <CheckCircle className="ml-2 h-4 w-4" />
                                رفع مسدودیت
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBanDialogOpen(true);
                                }}
                                className="text-amber-600 dark:text-amber-400"
                              >
                                <Ban className="ml-2 h-4 w-4" />
                                مسدودسازی
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              حذف کاربر
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* صفحه بندی */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs">
              <span className="text-muted-foreground hidden sm:inline">
                صفحه {currentPage.toLocaleString("fa-IR")} از{" "}
                {totalPages.toLocaleString("fa-IR")}
              </span>
              <div className="flex items-center gap-1 mx-auto sm:mx-0">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 font-medium bg-muted rounded-lg sm:hidden">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        /* ========== نمایش شبکه‌ای (Grid View) ========== */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedUsers.map((user, i) => {
              const roleInfo = roleConfig[user.role] || {
                label: user.role,
                badgeClass: "bg-gray-100 text-gray-700",
              };
              return (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <Card className="border-border/60 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden relative group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                              {user.firstName?.[0] || user.phone?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-sm line-clamp-1">
                              {user.firstName || user.lastName
                                ? `${user.firstName || ""} ${user.lastName || ""}`
                                : "کاربر بدون نام"}
                            </p>
                            <p
                              className="text-xs text-muted-foreground"
                              dir="ltr"
                            >
                              {user.phone}
                            </p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-44 rounded-xl">

                            <DropdownMenuItem
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="ml-2 h-4 w-4 text-muted-foreground" />
                              مشاهده
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="ml-2 h-4 w-4 text-muted-foreground" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenRoleModal(user)}
                            >
                              <UserCog className="ml-2 h-4 w-4 text-muted-foreground" />
                              تغییر نقش
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.isBanned ? (
                              <DropdownMenuItem
                                onClick={() => handleUnbanUser(user)}
                                className="text-emerald-600"
                              >
                                <CheckCircle className="ml-2 h-4 w-4" />
                                فعال‌سازی
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBanDialogOpen(true);
                                }}
                                className="text-amber-600"
                              >
                                <Ban className="ml-2 h-4 w-4" />
                                مسدود
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2 py-0.5 rounded-lg border ${roleInfo.badgeClass}`}
                        >
                          {roleInfo.label}
                        </Badge>
                        {user.isBanned ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-2 py-0.5 rounded-lg"
                          >
                            مسدود
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-lg">
                            فعال
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* صفحه بندی برای شبکه */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="rounded-xl"
              >
                <ChevronRight className="w-4 h-4 ml-1" /> قبلی
              </Button>
              <span className="text-xs flex items-center px-3 font-semibold">
                {currentPage} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="rounded-xl"
              >
                بعدی <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ==================== مودال مشاهده کاربر ==================== */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-lg rounded-2xl p-6"
          dir="rtl"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-bold">
              جزئیات کامل کاربر
            </DialogTitle>
            <DialogDescription className="text-xs">
              مشخصات حساب کاربری و اطلاعات ثبت شده
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-5 my-2">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
                <Avatar className="h-14 w-14 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                    {selectedUser.firstName?.[0] ||
                      selectedUser.phone?.[0] ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-base">
                    {selectedUser.firstName || selectedUser.lastName
                      ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`
                      : "کاربر بدون نام"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                    {selectedUser.phone}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${roleConfig[selectedUser.role]?.badgeClass}`}
                    >
                      {roleConfig[selectedUser.role]?.label ||
                        selectedUser.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-card border border-border/50 space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> شماره همراه:
                  </span>
                  <p className="font-medium text-foreground" dir="ltr">
                    {selectedUser.phone}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/50 space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> ایمیل:
                  </span>
                  <p className="font-medium text-foreground break-all">
                    {selectedUser.email || "ثبت نشده"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/50 space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> تاریخ عضویت:
                  </span>
                  <p className="font-medium text-foreground">
                    {new Date(selectedUser.createdAt).toLocaleDateString(
                      "fa-IR",
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/50 space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> تعداد آگهی‌ها:
                  </span>
                  <p className="font-medium text-foreground">
                    {((selectedUser as any).adsCount ?? 0).toLocaleString(
                      "fa-IR",
                    )}
                  </p>
                </div>
              </div>

              {selectedUser.isBanned && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>حساب کاربری مسدود است</span>
                  </div>
                  <p className="text-destructive/90 pr-5">
                    علت: {selectedUser.banReason || "علتی ثبت نشده است."}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="rounded-xl w-full sm:w-auto"
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== مودال ویرایش کاربر ==================== */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-md rounded-2xl p-6"
          dir="rtl"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-bold">
              ویرایش اطلاعات کاربر
            </DialogTitle>
            <DialogDescription className="text-xs">
              تغییر نام و ایمیل کاربر مورد نظر
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نام</Label>
                <Input
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, firstName: e.target.value })
                  }
                  placeholder="نام"
                  className="rounded-xl text-xs h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نام خانوادگی</Label>
                <Input
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lastName: e.target.value })
                  }
                  placeholder="نام خانوادگی"
                  className="rounded-xl text-xs h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ایمیل</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                placeholder="example@mail.com"
                className="rounded-xl text-xs h-10"
                dir="ltr"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-xl text-xs"
              disabled={actionLoading}
            >
              انصراف
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={actionLoading}
              className="rounded-xl text-xs gap-1.5"
            >
              {actionLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== مودال تغییر نقش ==================== */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-md rounded-2xl p-6"
          dir="rtl"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-bold">
              تغییر نقش کاربر
            </DialogTitle>
            <DialogDescription className="text-xs">
              انتخاب نقش جدید برای {selectedUser?.firstName}{" "}
              {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 my-2">
            {Object.entries(roleConfig).map(([key, role]) => {
              const RoleIcon = role.icon;
              const isSelected = newRole === key;
              return (
                <div
                  key={key}
                  onClick={() => setNewRole(key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-2xs"
                      : "border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${role.badgeClass}`}>
                      <RoleIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {role.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {role.desc}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="p-1 rounded-full bg-primary text-primary-foreground">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              className="rounded-xl text-xs"
              disabled={actionLoading}
            >
              انصراف
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={actionLoading}
              className="rounded-xl text-xs gap-1.5"
            >
              {actionLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              تغییر نقش
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== مودال مسدودسازی ==================== */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-md rounded-2xl p-6"
          dir="rtl"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-bold text-amber-600">
              مسدود کردن کاربر
            </DialogTitle>
            <DialogDescription className="text-xs">
              آیا از غیرفعال‌سازی حساب {selectedUser?.firstName}{" "}
              {selectedUser?.lastName} اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                کاربر مسدود شده امکان ورود به سایت و انتشار آگهی را نخواهد داشت.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                علت مسدودسازی (اختیاری)
              </Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="تخلف از قوانین، ارسال هرزنامه..."
                rows={3}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              className="rounded-xl text-xs"
              disabled={actionLoading}
            >
              انصراف
            </Button>
            <Button
              onClick={handleBanUser}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs gap-1.5"
            >
              {actionLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ban className="w-3.5 h-3.5" />
              )}
              تایید مسدودسازی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== مودال حذف کاربر ==================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-md rounded-2xl p-6"
          dir="rtl"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-bold text-destructive">
              حذف کاربر
            </DialogTitle>
            <DialogDescription className="text-xs">
              این عملیات غیرقابل بازگشت است. آیا از حذف کامل حساب کاربری مطمئن
              هستید؟
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 my-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              تمامی داده‌های مربوط به این کاربر به صورت کامل پاک خواهد شد.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl text-xs"
              disabled={actionLoading}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="rounded-xl text-xs gap-1.5"
            >
              {actionLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              حذف قطعی کاربر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
