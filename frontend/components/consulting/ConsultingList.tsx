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
import { RefreshCw, MessageSquare, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { consultingApi } from "@/services/api/consulting.api";

interface ConsultingRequest {
  _id: string;
  subject: string;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "در انتظار",
    className: "bg-amber-100 text-amber-700 border-amber-300",
  },
  approved: {
    label: "تأیید شده",
    className: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  rejected: {
    label: "رد شده",
    className: "bg-red-100 text-red-700 border-red-300",
  },
  completed: {
    label: "تکمیل شده",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
};

export function ConsultingList() {
  const [requests, setRequests] = useState<ConsultingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await consultingApi.getMyRequests(
        statusFilter !== "all" ? statusFilter : undefined,
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در دریافت درخواست‌ها");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, isAuthenticated]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 space-y-4"
        dir="rtl"
      >
        <LogIn className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">وارد حساب کاربری خود شوید</h2>
        <p className="text-sm text-muted-foreground">
          برای مشاهده درخواست‌های مشاوره، ابتدا باید وارد شوید.
        </p>
        <Button
          onClick={() => router.push("/auth/login")}
          className="rounded-xl"
        >
          ورود به حساب
        </Button>
      </div>
    );
  }

  const formatDate = (date: string) => new Date(date).toLocaleString("fa-IR");

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            درخواست‌های مشاوره من
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            وضعیت درخواست‌های مشاوره ثبت‌شده توسط شما
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          className="gap-1 rounded-xl"
        >
          <RefreshCw className="w-4 h-4" />
          بروزرسانی
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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

      <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-right">تاریخ</TableHead>
                  <TableHead className="text-right">موضوع</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
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
                      className="text-center py-8 text-muted-foreground"
                    >
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      شما هنوز درخواست مشاوره‌ای ثبت نکرده‌اید.
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
                            className={`text-xs border ${statusConfig.className}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
