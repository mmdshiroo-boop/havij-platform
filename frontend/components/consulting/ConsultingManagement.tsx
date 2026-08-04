// ConsultingManagement.tsx (نسخهٔ نهایی — کارشناس همه را می‌بیند، مشاور فقط خودش)

"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  MessageSquare,
  CheckCircle,
  Clock,
  Eye,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { consultingApi } from "@/services/api/consulting.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConsultingRequest {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  subject: string;
  message?: string;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "در انتظار",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  approved: {
    label: "تأیید شده",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  rejected: {
    label: "رد شده",
    className:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  completed: {
    label: "تکمیل شده",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
};

const STATUS_OPTIONS = [
  { value: "all", label: "همه" },
  { value: "pending", label: "در انتظار" },
  { value: "approved", label: "تأیید شده" },
  { value: "rejected", label: "رد شده" },
  { value: "completed", label: "تکمیل شده" },
];

interface ConsultingManagementProps {
  role: "agent" | "expert";
}

export function ConsultingManagement({ role }: ConsultingManagementProps) {
  const [requests, setRequests] = useState<ConsultingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<ConsultingRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // ─── دریافت داده‌ها بر اساس نقش ───
  const fetchRequests = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        if (role === "expert") {
          // کارشناس تمام درخواست‌های کل سایت را می‌بیند
          const response = await consultingApi.getAll(
            statusFilter !== "all" ? statusFilter : undefined,
          );
          setRequests(Array.isArray(response.data) ? response.data : []);
        } else {
          // مشاور فقط درخواست‌های خودش را می‌بیند
          const data = await consultingApi.getMyRequests(
            statusFilter !== "all" ? statusFilter : undefined,
          );
          setRequests(Array.isArray(data) ? data : []);
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "خطا در دریافت درخواست‌ها",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, role],
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await consultingApi.updateStatus(id, status);
      toast.success("وضعیت درخواست با موفقیت به‌روزرسانی شد");
      fetchRequests(true);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در به‌روزرسانی وضعیت");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString("fa-IR");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {role === "expert"
                ? "مدیریت تمام درخواست‌های مشاوره"
                : "درخواست‌های مشاورهٔ من"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {role === "expert"
                ? "شما به تمام درخواست‌های ثبت‌شده در سامانه دسترسی دارید"
                : "فقط درخواست‌هایی که به شما مربوط می‌شوند"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-all rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                کل درخواست‌ها
              </p>
              <p className="text-xl font-black">{requests.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-all rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                در انتظار
              </p>
              <p className="text-xl font-black">
                {requests.filter((r) => r.status === "pending").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-all rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                تأیید شده
              </p>
              <p className="text-xl font-black">
                {requests.filter((r) => r.status === "approved").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-all rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                تکمیل شده
              </p>
              <p className="text-xl font-black">
                {requests.filter((r) => r.status === "completed").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] rounded-xl h-10 bg-muted/40 border-border/60 focus:ring-primary">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRequests(true)}
          disabled={refreshing}
          className="gap-2 rounded-xl border-border/60 hover:bg-muted transition-all"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          بروزرسانی
        </Button>
      </div>

      {/* Table (Desktop) & Card List (Mobile) */}
      <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="text-right text-xs font-bold text-muted-foreground p-4">تاریخ</th>
                <th className="text-right text-xs font-bold text-muted-foreground p-4">نام و نام خانوادگی</th>
                <th className="text-right text-xs font-bold text-muted-foreground p-4">شماره تماس</th>
                <th className="text-right text-xs font-bold text-muted-foreground p-4">موضوع</th>
                <th className="text-right text-xs font-bold text-muted-foreground p-4">وضعیت</th>
                <th className="text-center text-xs font-bold text-muted-foreground p-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-28" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-20" /></td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">
                      {role === "expert"
                        ? "هیچ درخواست مشاوره‌ای در سامانه ثبت نشده است"
                        : "هیچ درخواست مشاوره‌ای برای شما ثبت نشده است"}
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const statusConfig = STATUS_BADGE[req.status] || STATUS_BADGE.pending;
                  return (
                    <tr key={req._id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                      <td className="text-sm whitespace-nowrap p-4">{formatDate(req.createdAt)}</td>
                      <td className="text-sm font-medium p-4">{req.firstName} {req.lastName}</td>
                      <td className="text-sm p-4">{req.phone}</td>
                      <td className="text-sm p-4">{req.subject}</td>
                      <td className="text-sm p-4">
                        <Badge className={cn("text-xs border font-bold rounded-md", statusConfig.className)}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Dialog
                          open={isDialogOpen && selectedRequest?._id === req._id}
                          onOpenChange={setIsDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg"
                              onClick={() => {
                                setSelectedRequest(req);
                                setNewStatus(req.status);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                              مدیریت
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md rounded-2xl border-border/50">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                جزئیات درخواست مشاوره
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground">نام و نام خانوادگی</p>
                                  <p className="font-medium">{selectedRequest?.firstName} {selectedRequest?.lastName}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">شماره تماس</p>
                                  <p className="font-medium font-mono">{selectedRequest?.phone}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">موضوع</p>
                                  <p className="font-medium">{selectedRequest?.subject}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">پیام</p>
                                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                                    {selectedRequest?.message || "بدون پیام"}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-bold">تغییر وضعیت</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="انتخاب وضعیت جدید" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    <SelectItem value="pending">در انتظار</SelectItem>
                                    <SelectItem value="approved">تأیید شده</SelectItem>
                                    <SelectItem value="rejected">رد شده</SelectItem>
                                    <SelectItem value="completed">تکمیل شده</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                                  انصراف
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (selectedRequest && newStatus !== selectedRequest.status) {
                                      handleStatusChange(selectedRequest._id, newStatus);
                                    } else {
                                      toast.info("وضعیت جدیدی انتخاب نشده است");
                                    }
                                  }}
                                  disabled={updating}
                                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                                >
                                  {updating ? (
                                    <span className="flex items-center gap-2">
                                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                      در حال ذخیره...
                                    </span>
                                  ) : (
                                    "ذخیره تغییرات"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-border/40">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-sm">هیچ درخواست مشاوره‌ای یافت نشد</p>
            </div>
          ) : (
            requests.map((req) => {
              const statusConfig = STATUS_BADGE[req.status] || STATUS_BADGE.pending;
              return (
                <div key={req._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-foreground line-clamp-1">
                      {req.firstName} {req.lastName}
                    </p>
                    <Badge className={cn("text-xs border font-bold rounded-md shrink-0", statusConfig.className)}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{req.subject}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg h-8"
                      onClick={() => {
                        setSelectedRequest(req);
                        setNewStatus(req.status);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      مدیریت
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </motion.div>
  );
}