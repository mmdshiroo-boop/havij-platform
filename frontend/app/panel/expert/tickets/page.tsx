// app/panel/expert/tickets/page.tsx
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Ticket,
  Search,
  RefreshCw,
  Eye,
  MessageCircle,
  Clock,
  CheckCircle,
  Send,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Filter,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { InfoCardStatic } from "@/components/ui/info-card";

// ─── تایپ‌ها ────────────────────────────────────────────
interface TicketData {
  _id: string;
  subject: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  user: { _id: string; firstName: string; lastName: string; phone: string };
  createdAt: string;
  replies?: {
    _id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
  }[];
}

// ─── پیکربندی رنگ‌ها (هماهنگ با تم سفید-نارنجی) ──────────
const statusConfig: Record<
  string,
  { label: string; bgClass: string; textClass: string; icon: React.ReactNode }
> = {
  open: {
    label: "باز",
    bgClass:
      "bg-amber-100/80 dark:bg-amber-500/20 border-amber-200 dark:border-amber-800",
    textClass: "text-amber-700 dark:text-amber-300",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  in_progress: {
    label: "در حال بررسی",
    bgClass:
      "bg-blue-100/80 dark:bg-blue-500/20 border-blue-200 dark:border-blue-800",
    textClass: "text-blue-700 dark:text-blue-300",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  closed: {
    label: "بسته",
    bgClass:
      "bg-emerald-100/80 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800",
    textClass: "text-emerald-700 dark:text-emerald-300",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
};

const priorityConfig: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  low: {
    label: "کم",
    bgClass:
      "bg-gray-100/80 dark:bg-gray-500/20 border-gray-200 dark:border-gray-700",
    textClass: "text-gray-600 dark:text-gray-400",
  },
  medium: {
    label: "متوسط",
    bgClass: "bg-primary/10 border-primary/20",
    textClass: "text-primary",
  },
  high: {
    label: "بالا",
    bgClass:
      "bg-amber-100/80 dark:bg-amber-500/20 border-amber-200 dark:border-amber-800",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  urgent: {
    label: "فوری",
    bgClass:
      "bg-red-100/80 dark:bg-red-500/20 border-red-200 dark:border-red-800",
    textClass: "text-red-700 dark:text-red-300",
  },
};

export default function ExpertTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketDetailOpen, setTicketDetailOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await axios.get("/tickets/admin/all");
      if (data.success) setTickets(data.data || []);
    } catch {
      toast.error("خطا در دریافت تیکت‌ها");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleViewTicket = async (ticketId: string) => {
    try {
      const { data } = await axios.get(`/tickets/admin/${ticketId}`);
      if (data.success) {
        setSelectedTicket(data.data);
        setTicketDetailOpen(true);
      }
    } catch {
      toast.error("خطا در دریافت جزئیات تیکت");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      await axios.post(`/tickets/admin/${selectedTicket._id}/reply`, {
        message: replyText.trim(),
      });
      toast.success("پاسخ با موفقیت ارسال شد");

      const newReply = {
        _id: Date.now().toString(),
        message: replyText.trim(),
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };
      setSelectedTicket((prev) =>
        prev ? { ...prev, replies: [...(prev.replies || []), newReply] } : prev,
      );
      setReplyText("");
      fetchTickets(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در ارسال پاسخ");
    } finally {
      setSendingReply(false);
    }
  };

  const handleChangeStatus = async (ticketId: string, newStatus: string) => {
    try {
      await axios.patch(`/tickets/admin/${ticketId}/status`, {
        status: newStatus,
      });
      toast.success("وضعیت تیکت به‌روز شد");
      fetchTickets(true);
      if (selectedTicket?._id === ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, status: newStatus as any } : prev,
        );
      }
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      t.user?.lastName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* ===== Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                مدیریت تیکت‌ها
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مشاهده، پاسخ و مدیریت تیکت‌های پشتیبانی
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20">
              <Ticket className="w-3.5 h-3.5" />
              {stats.total} تیکت
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTickets(true)}
              disabled={refreshing}
              className="gap-1.5 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              بروزرسانی
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<Ticket className="w-5 h-5" />}
            title="کل تیکت‌ها"
            value={stats.total}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<AlertCircle className="w-5 h-5" />}
            title="باز"
            value={stats.open}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<Clock className="w-5 h-5" />}
            title="در حال بررسی"
            value={stats.inProgress}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="h-full"
        >
          <InfoCardStatic
            icon={<CheckCircle className="w-5 h-5" />}
            title="بسته"
            value={stats.closed}
          />
        </motion.div>
      </div>

      {/* ===== Filters ===== */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در موضوع یا کاربر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 rounded-xl h-11 bg-background border-border/60 focus:border-primary/40 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl h-11 bg-background border-border/60 focus:border-primary/40 focus:ring-primary/30">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="open">باز</SelectItem>
              <SelectItem value="in_progress">در حال بررسی</SelectItem>
              <SelectItem value="closed">بسته</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ===== Tickets Table (Desktop) ===== */}
      <div className="hidden md:block rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border">
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  موضوع
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  کاربر
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  اولویت
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  وضعیت
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  تاریخ
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  عملیات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Ticket className="w-10 h-10 text-muted-foreground/30" />
                      <p className="font-medium">تیکتی یافت نشد</p>
                      <p className="text-xs">
                        با تغییر فیلترها ممکن است نتیجه‌ای پیدا شود
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => {
                  const status = statusConfig[ticket.status];
                  const priority = priorityConfig[ticket.priority];
                  return (
                    <motion.tr
                      key={ticket._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors group"
                    >
                      <TableCell className="py-3">
                        <span className="font-bold text-sm truncate max-w-[200px] block">
                          {ticket.subject}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm">
                          {ticket.user?.firstName} {ticket.user?.lastName}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={cn(
                            "text-[11px] px-2.5 py-0.5 rounded-md border-0",
                            priority.bgClass,
                            priority.textClass,
                          )}
                        >
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={cn(
                            "text-[11px] px-2.5 py-0.5 rounded-md gap-1.5 border",
                            status.bgClass,
                            status.textClass,
                          )}
                        >
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {formatDate(ticket.createdAt)}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                            onClick={() => handleViewTicket(ticket._id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {ticket.status !== "closed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                              onClick={() =>
                                handleChangeStatus(ticket._id, "closed")
                              }
                              title="بستن تیکت"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ===== Tickets Cards (Mobile) ===== */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Ticket className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="font-medium">تیکتی یافت نشد</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            const priority = priorityConfig[ticket.priority];
            return (
              <motion.div
                key={ticket._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm line-clamp-1">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <User className="w-3 h-3 inline ml-1" />
                      {ticket.user?.firstName} {ticket.user?.lastName}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-md border-0 shrink-0",
                      priority.bgClass,
                      priority.textClass,
                    )}
                  >
                    {priority.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                  <Badge
                    className={cn(
                      "text-[10px] px-2.5 py-0.5 rounded-md gap-1 border",
                      status.bgClass,
                      status.textClass,
                    )}
                  >
                    {status.icon}
                    {status.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3 inline ml-1" />
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 rounded-lg text-xs border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
                    onClick={() => handleViewTicket(ticket._id)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    مشاهده
                  </Button>
                  {ticket.status !== "closed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 rounded-lg text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                      onClick={() => handleChangeStatus(ticket._id, "closed")}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      بستن
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ===== Detail Dialog ===== */}
      <Dialog open={ticketDetailOpen} onOpenChange={setTicketDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 rounded-2xl border-border/50 overflow-hidden">
          {selectedTicket && (
            <>
              {/* Dialog Header */}
              <div className="shrink-0 p-5 border-b border-border/20 bg-muted/5">
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setTicketDetailOpen(false)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <DialogTitle className="text-lg font-black flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    جزئیات تیکت
                  </DialogTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2 pr-2">
                  <span className="text-sm font-bold">
                    {selectedTicket.subject}
                  </span>
                  <Badge
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-md border-0",
                      priorityConfig[selectedTicket.priority]?.bgClass,
                      priorityConfig[selectedTicket.priority]?.textClass,
                    )}
                  >
                    {priorityConfig[selectedTicket.priority]?.label}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-md gap-1.5 border",
                      statusConfig[selectedTicket.status]?.bgClass,
                      statusConfig[selectedTicket.status]?.textClass,
                    )}
                  >
                    {statusConfig[selectedTicket.status]?.icon}
                    {statusConfig[selectedTicket.status]?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground mr-auto">
                    {formatDate(selectedTicket.createdAt)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Dialog Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/10 border border-border/30 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">کاربر</p>
                    <p className="font-medium">
                      {selectedTicket.user?.firstName}{" "}
                      {selectedTicket.user?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">شماره تماس</p>
                    <p className="font-medium font-mono">
                      {selectedTicket.user?.phone}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Replies */}
                <div>
                  <h4 className="font-black text-sm flex items-center gap-1.5 mb-3">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    گفتگوها
                  </h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {selectedTicket.replies &&
                    selectedTicket.replies.length > 0 ? (
                      selectedTicket.replies.map((reply, index) => (
                        <motion.div
                          key={reply._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-3.5 rounded-xl max-w-[90%] sm:max-w-[80%]",
                            reply.isAdmin
                              ? "bg-primary/10 border border-primary/20 ml-auto"
                              : "bg-muted/30 border border-border/30 mr-auto",
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              {reply.isAdmin ? (
                                <>
                                  <User className="w-3.5 h-3.5 text-primary" />
                                  پشتیبانی
                                </>
                              ) : (
                                <>
                                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                                  {selectedTicket.user?.firstName}
                                </>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(reply.createdAt).toLocaleTimeString(
                                "fa-IR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed break-words">
                            {reply.message}
                          </p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">
                          هنوز گفتگویی ثبت نشده است
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Section */}
                {selectedTicket.status !== "closed" && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-black text-sm mb-3 flex items-center gap-1.5">
                        <Send className="w-4 h-4 text-primary" />
                        ارسال پاسخ
                      </h4>
                      <div className="space-y-3">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="متن پاسخ خود را وارد کنید..."
                          rows={3}
                          className="resize-none rounded-xl border-border/60 focus:border-primary/40 focus:ring-primary/30"
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSendReply}
                            disabled={sendingReply || !replyText.trim()}
                            className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                          >
                            {sendingReply ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            ارسال پاسخ
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
