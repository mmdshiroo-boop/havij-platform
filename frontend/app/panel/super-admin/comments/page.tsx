// app/panel/super-admin/comments/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "@/services/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  User,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { InfoCardStatic } from "@/components/ui/info-card";

interface CommentData {
  _id: string;
  content: string;
  user?: { _id: string; firstName: string; lastName: string; phone: string };
  ad?: { _id: string; title: string };
  isApproved: boolean;
  createdAt: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedComment, setSelectedComment] = useState<CommentData | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await axios.get("/comments/admin/all", { params });
      if (data.success) setComments(data.data || []);
    } catch (error) {
      toast.error("خطا در دریافت کامنت‌ها");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleApprove = async (id: string) => {
    try {
      await axios.patch(`/comments/admin/${id}/approve`);
      toast.success("کامنت تأیید شد");
      fetchComments();
    } catch {
      toast.error("خطا در تأیید");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axios.patch(`/comments/admin/${id}/reject`);
      toast.success("کامنت رد شد");
      fetchComments();
    } catch {
      toast.error("خطا در رد");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/comments/admin/${id}`);
      toast.success("کامنت حذف شد");
      fetchComments();
    } catch {
      toast.error("خطا در حذف");
    }
  };

  const stats = {
    total: comments.length,
    approved: comments.filter((c) => c.isApproved).length,
    pending: comments.filter((c) => !c.isApproved).length,
  };

  const filteredComments = comments.filter(
    (c) =>
      c.content?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      c.ad?.title?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* هدر با تم سفید-نارنجی */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                مدیریت کامنت‌ها
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                نظرات کاربران را بررسی، تأیید یا حذف کنید.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchComments}>
            <RefreshCw className="w-4 h-4 ml-1" /> به‌روزرسانی
          </Button>
        </div>
      </div>

      {/* کارت‌های آمار با InfoCardStatic */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InfoCardStatic
            icon={<MessageSquare className="w-5 h-5" />}
            title="کل نظرات"
            value={stats.total}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InfoCardStatic
            icon={<CheckCircle className="w-5 h-5" />}
            title="تأیید شده"
            value={stats.approved}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <InfoCardStatic
            icon={<Filter className="w-5 h-5" />}
            title="در انتظار"
            value={stats.pending}
          />
        </motion.div>
      </div>

      {/* فیلترها */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در متن، کاربر یا آگهی..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="approved">تأیید شده</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* جدول */}
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-amber-50/10 to-transparent shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">متن</TableHead>
              <TableHead>کاربر</TableHead>
              <TableHead>آگهی</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>تاریخ</TableHead>
              <TableHead className="text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredComments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  کامنتی یافت نشد.
                </TableCell>
              </TableRow>
            ) : (
              filteredComments.map((comment) => (
                <TableRow
                  key={comment._id}
                  className="hover:bg-primary/5 transition-colors"
                >
                  <TableCell className="max-w-[300px] truncate font-medium">
                    {comment.content}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-sm">
                        {comment.user?.firstName} {comment.user?.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-sm truncate max-w-[200px]">
                        {comment.ad?.title || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={comment.isApproved ? "default" : "secondary"}
                      className={cn(
                        "text-[11px]",
                        comment.isApproved
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {comment.isApproved ? "تأیید شده" : "در انتظار"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(comment.createdAt).toLocaleDateString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedComment(comment);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!comment.isApproved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          onClick={() => handleApprove(comment._id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {comment.isApproved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600"
                          onClick={() => handleReject(comment._id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف کامنت</AlertDialogTitle>
                            <AlertDialogDescription>
                              این عملیات غیرقابل بازگشت است.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(comment._id)}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* مودال جزئیات کامنت */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg border-primary/10">
          <DialogHeader>
            <DialogTitle>جزئیات کامنت</DialogTitle>
          </DialogHeader>
          {selectedComment && (
            <div className="space-y-4">
              <Card className="transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent shadow-md border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm">{selectedComment.content}</p>
                </CardContent>
              </Card>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">کاربر: </span>
                  <span className="font-bold">
                    {selectedComment.user?.firstName}{" "}
                    {selectedComment.user?.lastName}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {selectedComment.user?.phone}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">آگهی: </span>
                  <span className="font-bold">
                    {selectedComment.ad?.title || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">وضعیت: </span>
                  <Badge
                    variant={
                      selectedComment.isApproved ? "default" : "secondary"
                    }
                  >
                    {selectedComment.isApproved ? "تأیید شده" : "در انتظار"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">تاریخ: </span>
                  <span>
                    {new Date(selectedComment.createdAt).toLocaleDateString(
                      "fa-IR",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {!selectedComment.isApproved && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleApprove(selectedComment._id);
                      setDetailOpen(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 ml-1" /> تأیید
                  </Button>
                )}
                {selectedComment.isApproved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleReject(selectedComment._id);
                      setDetailOpen(false);
                    }}
                  >
                    <XCircle className="w-4 h-4 ml-1" /> رد
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
