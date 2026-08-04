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
import { RefreshCw, MessageSquare, LogIn, SearchX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { consultingApi } from "@/services/api/consulting.api";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConsultingRequest {
  _id: string;
  subject: string;
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function ConsultingList() {
  const [requests, setRequests] = useState<ConsultingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchRequests = useCallback(async () => {
    if (!authUser) {
      setLoading(false);
      setRequests([]);
      return;
    }

    setLoading(true);
    try {
      const data = await consultingApi.getMyRequests(
        statusFilter !== "all" ? statusFilter : undefined
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در دریافت درخواست‌ها");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, authUser]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 space-y-4 text-center"
        dir="rtl"
      >
        <div className="p-4 rounded-full bg-muted">
          <LogIn className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">
          وارد حساب کاربری خود شوید
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          برای مشاهده درخواست‌های مشاوره، ابتدا باید وارد حساب کاربری خود شوید.
        </p>
        <Button
          onClick={() => router.push("/auth/login")}
          className="rounded-xl gap-2 font-bold"
        >
          <LogIn className="w-4 h-4" />
          ورود به حساب
        </Button>
      </div>
    );
  }

  const formatDate = (date: string) => new Date(date).toLocaleString("fa-IR");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
      dir="rtl"
    >
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              درخواست‌های مشاوره من
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              وضعیت درخواست‌های مشاوره ثبت‌شده توسط شما
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          className="gap-1 rounded-xl border-border/60 hover:bg-muted"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading && "animate-spin"}`} />
          بروزرسانی
        </Button>
      </div>

      {/* فیلتر وضعیت */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-xl h-10 bg-muted/40 border-border/60 focus:ring-primary">
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="approved">تأیید شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
            <SelectItem value="completed">تکمیل شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* محتوا: جدول در دسکتاپ، کارت در موبایل */}
      <Card className="border border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* نسخهٔ دسکتاپ (جدول) */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-right font-bold text-sm">
                    تاریخ
                  </TableHead>
                  <TableHead className="text-right font-bold text-sm">
                    موضوع
                  </TableHead>
                  <TableHead className="text-right font-bold text-sm">
                    وضعیت
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <SearchX className="w-8 h-8 opacity-40" />
                        <span className="font-medium">
                          {statusFilter !== "all"
                            ? "درخواستی با این وضعیت یافت نشد."
                            : "شما هنوز درخواست مشاوره‌ای ثبت نکرده‌اید."}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => {
                    const statusConfig =
                      STATUS_BADGE[req.status] || STATUS_BADGE.pending;
                    return (
                      <TableRow key={req._id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatDate(req.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {req.subject}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge
                            className={cn(
                              "text-xs border font-bold rounded-md",
                              statusConfig.className
                            )}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* نسخهٔ موبایل (کارت‌های لیستی) */}
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
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                <SearchX className="w-8 h-8 opacity-40" />
                <span className="font-medium text-sm">
                  {statusFilter !== "all"
                    ? "درخواستی با این وضعیت یافت نشد."
                    : "شما هنوز درخواست مشاوره‌ای ثبت نکرده‌اید."}
                </span>
              </div>
            ) : (
              requests.map((req) => {
                const statusConfig =
                  STATUS_BADGE[req.status] || STATUS_BADGE.pending;
                return (
                  <motion.div
                    key={req._id}
                    variants={itemVariants}
                    className="p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-foreground line-clamp-1">
                        {req.subject}
                      </p>
                      <Badge
                        className={cn(
                          "text-xs border font-bold rounded-md shrink-0",
                          statusConfig.className
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(req.createdAt)}
                    </p>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}