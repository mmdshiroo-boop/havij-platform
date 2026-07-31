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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle,
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
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300",
  },
  approved: {
    label: "تأیید شده",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  rejected: {
    label: "رد شده",
    className:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-300",
  },
  completed: {
    label: "تکمیل شده",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300",
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

  const fetchRequests = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const response = await consultingApi.getAll(
          statusFilter !== "all" ? statusFilter : undefined,
          "",
          1,
        );
        setRequests(response.data || []);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "خطا در دریافت درخواست‌ها",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter],
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

  const roleTitle = role === "agent" ? "آژانس" : "کارشناس";

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                مدیریت درخواست‌های مشاوره
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مدیریت درخواست‌های مشاوره‌ای که توسط کاربران ثبت شده است
              </p>
            </div>
          </div>
          <Badge className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20">
            {roleTitle}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-4">
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
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-amber-100/80 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
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
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
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
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-blue-100/80 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
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
            <SelectTrigger className="w-[180px] rounded-xl h-11 bg-background border-border/60 focus:border-primary/40 focus:ring-primary/30">
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
          className="gap-2 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          بروزرسانی
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border">
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  تاریخ
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  نام و نام خانوادگی
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  شماره تماس
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  موضوع
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  وضعیت
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  عملیات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-40 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
                      <p className="font-medium">
                        هیچ درخواست مشاوره‌ای یافت نشد
                      </p>
                      <p className="text-xs">
                        با تغییر فیلترها ممکن است نتیجه‌ای پیدا شود
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => {
                  const statusConfig =
                    STATUS_BADGE[req.status] || STATUS_BADGE.pending;
                  return (
                    <motion.tr
                      key={req._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors group"
                    >
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(req.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {req.firstName} {req.lastName}
                      </TableCell>
                      <TableCell className="text-sm">{req.phone}</TableCell>
                      <TableCell className="text-sm">{req.subject}</TableCell>
                      <TableCell className="text-sm">
                        <Badge
                          className={`text-xs border ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog
                          open={
                            isDialogOpen && selectedRequest?._id === req._id
                          }
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
                                  <p className="text-xs text-muted-foreground">
                                    نام و نام خانوادگی
                                  </p>
                                  <p className="font-medium">
                                    {selectedRequest?.firstName}{" "}
                                    {selectedRequest?.lastName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    شماره تماس
                                  </p>
                                  <p className="font-medium font-mono">
                                    {selectedRequest?.phone}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">
                                    موضوع
                                  </p>
                                  <p className="font-medium">
                                    {selectedRequest?.subject}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">
                                    پیام
                                  </p>
                                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                                    {selectedRequest?.message || "بدون پیام"}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-bold">
                                  تغییر وضعیت
                                </Label>
                                <Select
                                  value={newStatus}
                                  onValueChange={setNewStatus}
                                >
                                  <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="انتخاب وضعیت جدید" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    <SelectItem value="pending">
                                      در انتظار
                                    </SelectItem>
                                    <SelectItem value="approved">
                                      تأیید شده
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                      رد شده
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      تکمیل شده
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex justify-end gap-3 pt-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsDialogOpen(false)}
                                  className="rounded-xl"
                                >
                                  انصراف
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (
                                      selectedRequest &&
                                      newStatus !== selectedRequest.status
                                    ) {
                                      handleStatusChange(
                                        selectedRequest._id,
                                        newStatus,
                                      );
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
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
