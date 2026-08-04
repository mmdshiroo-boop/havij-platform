// components/panel/CommentsManager.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { commentApi, IComment } from "@/services/api/comment.api";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Reply,
  ChevronLeft,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type CommentStatus = "pending" | "approved" | "rejected";

interface CommentsManagerProps {
  isAdmin?: boolean;
}

const STATUS_CONFIG: Record<CommentStatus, { label: string; icon: any; className: string }> = {
  pending: {
    label: "در انتظار بررسی",
    icon: Clock,
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  approved: {
    label: "تأیید شده",
    icon: CheckCircle2,
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  rejected: {
    label: "رد شده",
    icon: XCircle,
    className:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

export default function CommentsManager({ isAdmin = false }: CommentsManagerProps) {
  const [comments, setComments] = useState<IComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── دیالوگ حذف ───
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Fetch Comments ───────────────────────────────
  const fetchComments = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const response = isAdmin
          ? await commentApi.getAll()
          : await commentApi.getMyAdsComments();

        const fetchedData = response?.data || response || [];
        setComments(Array.isArray(fetchedData) ? fetchedData : []);
      } catch (err: any) {
        console.error("Fetch error:", err);
        toast.error("خطا در دریافت نظرات");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ─── Admin Actions ────────────────────────────────
  const handleApprove = async (commentId: string) => {
    setActionLoadingId(commentId);
    try {
      await commentApi.approve(commentId);
      toast.success("نظر با موفقیت تأیید شد");
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, isApproved: true } : c)),
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در تأیید نظر");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (commentId: string) => {
    setActionLoadingId(commentId);
    try {
      await commentApi.reject(commentId);
      toast.success("نظر رد شد");
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, isApproved: false } : c,
        ),
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در رد نظر");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRequest = (commentId: string) => {
    setDeleteId(commentId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await commentApi.delete(deleteId);
      toast.success("نظر با موفقیت حذف شد");
      setComments((prev) => prev.filter((c) => c._id !== deleteId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در حذف نظر");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // ─── Reply Action ─────────────────────────────────
  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setSending(true);

    try {
      const targetComment = comments.find((c) => c._id === commentId);
      if (!targetComment || !targetComment.ad?._id) return;

      await commentApi.add({
        adId: targetComment.ad._id,
        content: replyText,
        parentId: commentId,
      });

      toast.success("پاسخ با موفقیت ارسال شد");
      setReplyTo(null);
      setReplyText("");
      fetchComments(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ارسال پاسخ");
    } finally {
      setSending(false);
    }
  };

  // ─── Statistics ────────────────────────────────────
  const stats = useMemo(() => {
    const total = comments.length;
    const pending = comments.filter((c) => !c.isApproved).length;
    const approved = comments.filter((c) => c.isApproved).length;
    return { total, pending, approved };
  }, [comments]);

  // ─── Filtered Comments ─────────────────────────────
  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      let currentStatus: CommentStatus = "pending";
      if (comment.isApproved) currentStatus = "approved";
      // اگر rejected هم در API داشته باشید می‌توانید اینجا تشخیص دهید (مثلاً comment.rejected === true)
      // فعلاً فقط دو حالت داریم

      if (isAdmin && statusFilter !== "all") {
        if (currentStatus !== statusFilter) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentMatch = comment.content?.toLowerCase().includes(query);
        const userMatch =
          `${comment.user?.firstName || ""} ${comment.user?.lastName || ""}`
            .toLowerCase()
            .includes(query);
        const adMatch = comment.ad?.title?.toLowerCase().includes(query);
        return contentMatch || userMatch || adMatch;
      }

      return true;
    });
  }, [comments, statusFilter, searchQuery, isAdmin]);

  // ─── Group Comments by Ad ──────────────────────────
  const groupedComments = useMemo(() => {
    return filteredComments.reduce(
      (acc, comment) => {
        const adId = comment.ad?._id || "unknown";
        const adTitle = comment.ad?.title || "آگهی بدون عنوان";

        if (!acc[adId]) {
          acc[adId] = { adTitle, comments: [] };
        }
        acc[adId].comments.push(comment);
        return acc;
      },
      {} as Record<string, { adTitle: string; comments: IComment[] }>,
    );
  }, [filteredComments]);

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {isAdmin ? "مدیریت سراسری نظرات" : "نظرات آگهی‌های من"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAdmin
                ? "بررسی، تأیید، رد و پاسخ به تمامی نظرات آگهی‌های سایت"
                : "مشاهده و پاسخ به نظرات ثبت‌شده برای آگهی‌های شما"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge className="px-3 py-1.5 text-xs rounded-xl bg-muted/50 border-border/50 font-bold">
            {filteredComments.length} نظر
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchComments(true)}
            disabled={refreshing}
            className="gap-2 rounded-xl border-border/60 hover:bg-muted"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm rounded-xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">کل نظرات</p>
              <p className="text-2xl font-black">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm rounded-xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">در انتظار بررسی</p>
              <p className="text-2xl font-black">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm rounded-xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">تأیید شده</p>
              <p className="text-2xl font-black">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Search & Filters ===== */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در نظرات، کاربر یا آگهی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 rounded-xl bg-muted/40 border-border/60 h-10 focus:ring-primary"
          />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-xl h-10 bg-muted/40 border-border/60 focus:ring-primary">
                <SelectValue placeholder="فیلتر وضعیت" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">همه نظرات</SelectItem>
                <SelectItem value="pending">در انتظار بررسی</SelectItem>
                <SelectItem value="approved">تأیید شده</SelectItem>
                <SelectItem value="rejected">رد شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ===== Comments List ===== */}
      {Object.keys(groupedComments).length === 0 ? (
        <Card className="rounded-2xl border-dashed border-border/60 bg-muted/20">
          <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full">
              <MessageSquare className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-medium text-base">هیچ نظری یافت نشد</p>
            <p className="text-xs max-w-xs">
              {searchQuery || statusFilter !== "all"
                ? "با تغییر فیلترها ممکن است نتیجه‌ای پیدا شود"
                : "هنوز نظری برای نمایش وجود ندارد"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
          className="space-y-4"
        >
          {Object.entries(groupedComments).map(([adId, group]) => (
            <motion.div
              key={adId}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border/20 bg-muted/10 px-4 sm:px-5 pt-4">
                  <CardTitle className="text-base font-black flex items-center justify-between">
                    <Link
                      href={`/ad/${adId}`}
                      target="_blank"
                      className="hover:text-primary transition-colors flex items-center gap-1.5 group"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-md">
                        {group.adTitle}
                      </span>
                      <ChevronLeft className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Badge variant="outline" className="rounded-lg font-normal border-border/50 bg-background/50">
                      {group.comments.length} نظر
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <AnimatePresence>
                    {group.comments.map((comment) => {
                      const currentStatus: CommentStatus = comment.isApproved
                        ? "approved"
                        : "pending";
                      const statusConfig = STATUS_CONFIG[currentStatus];

                      return (
                        <motion.div
                          key={comment._id}
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-4 rounded-xl bg-muted/10 border border-border/30 hover:border-border/60 transition-all space-y-3"
                        >
                          {/* Header: User + Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold text-sm border border-primary/20 flex-shrink-0">
                                {comment.user?.firstName?.[0] || "؟"}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">
                                  {comment.user?.firstName || "کاربر"} {comment.user?.lastName || ""}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleDateString("fa-IR", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>

                            <Badge
                              className={cn(
                                "gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border",
                                statusConfig.className,
                              )}
                            >
                              <statusConfig.icon className="w-3.5 h-3.5" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Content */}
                          <p className="text-sm leading-relaxed text-foreground/90 bg-background/50 p-3 rounded-lg border border-border/20">
                            {comment.content}
                          </p>

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-border/10">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                              onClick={() => {
                                setReplyTo(replyTo === comment._id ? null : comment._id);
                                if (replyTo !== comment._id) setReplyText("");
                              }}
                            >
                              <Reply className="w-3.5 h-3.5" />
                              {replyTo === comment._id ? "بستن پاسخ" : "پاسخ"}
                            </Button>

                            {isAdmin && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {!comment.isApproved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 rounded-lg transition-all"
                                    onClick={() => handleApprove(comment._id)}
                                    disabled={actionLoadingId === comment._id}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    تأیید
                                  </Button>
                                )}

                                {comment.isApproved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-800 rounded-lg transition-all"
                                    onClick={() => handleReject(comment._id)}
                                    disabled={actionLoadingId === comment._id}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    رد
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                  onClick={() => handleDeleteRequest(comment._id)}
                                  disabled={actionLoadingId === comment._id}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  حذف
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Reply Box */}
                          {replyTo === comment._id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-muted/5 border border-border/30 rounded-xl p-4 space-y-3 mt-2"
                            >
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="پاسخ خود را بنویسید..."
                                rows={3}
                                className="text-sm rounded-lg resize-none focus:border-primary/40 focus:ring-primary/30"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg text-xs"
                                  onClick={() => setReplyTo(null)}
                                >
                                  انصراف
                                </Button>
                                <Button
                                  size="sm"
                                  className="rounded-lg text-xs gap-1.5"
                                  onClick={() => handleReply(comment._id)}
                                  disabled={sending || !replyText.trim()}
                                >
                                  {sending ? "در حال ارسال..." : (<><Reply className="w-3.5 h-3.5" /> ارسال پاسخ</>)}
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* دیالوگ حذف */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md" dir="rtl">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-lg font-black text-destructive">
              حذف نظر
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              آیا از حذف کامل این نظر اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl text-sm font-bold">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-rose-500 hover:bg-rose-600 rounded-xl text-sm font-bold text-white gap-1"
            >
              {deleteLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}