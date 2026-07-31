"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Plus,
  Filter,
  User,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api/client";

// ─── تایپ‌ها ────────────────────────────────────────────
interface TicketData {
  _id: string;
  subject: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  replies?: {
    _id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
  }[];
}

// ─── پیکربندی وضعیت‌ها ──────────────────────────────────
const statusConfig: Record<
  string,
  { label: string; color: string; bgClass: string; icon: React.ReactNode }
> = {
  open: {
    label: "باز",
    color: "text-blue-600 dark:text-blue-400",
    bgClass:
      "bg-blue-100/80 dark:bg-blue-500/20 border-blue-200 dark:border-blue-800",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  in_progress: {
    label: "در حال بررسی",
    color: "text-amber-600 dark:text-amber-400",
    bgClass:
      "bg-amber-100/80 dark:bg-amber-500/20 border-amber-200 dark:border-amber-800",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  closed: {
    label: "بسته",
    color: "text-emerald-600 dark:text-emerald-400",
    bgClass:
      "bg-emerald-100/80 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
};

const priorityConfig: Record<
  string,
  { label: string; color: string; bgClass: string }
> = {
  low: {
    label: "کم",
    color: "text-gray-600 dark:text-gray-400",
    bgClass:
      "bg-gray-100/80 dark:bg-gray-500/20 border-gray-200 dark:border-gray-700",
  },
  medium: {
    label: "متوسط",
    color: "text-blue-600 dark:text-blue-400",
    bgClass:
      "bg-blue-100/80 dark:bg-blue-500/20 border-blue-200 dark:border-blue-800",
  },
  high: {
    label: "بالا",
    color: "text-amber-600 dark:text-amber-400",
    bgClass:
      "bg-amber-100/80 dark:bg-amber-500/20 border-amber-200 dark:border-amber-800",
  },
  urgent: {
    label: "فوری",
    color: "text-red-600 dark:text-red-400",
    bgClass:
      "bg-red-100/80 dark:bg-red-500/20 border-red-200 dark:border-red-800",
  },
};

export default function AgentTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ایجاد تیکت جدید
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [creating, setCreating] = useState(false);

  // مودال جزئیات و پاسخ
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // ─── دریافت تیکت‌ها ────────────────────────────
  const fetchTickets = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await apiClient.get("/tickets/my");
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

  // ─── ایجاد تیکت جدید ───────────────────────────
  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error("موضوع و پیام الزامی است");
      return;
    }
    setCreating(true);
    try {
      await apiClient.post("/tickets", {
        subject: newSubject.trim(),
        message: newMessage.trim(),
        priority: newPriority,
      });
      toast.success("تیکت شما با موفقیت ثبت شد");
      setShowCreateForm(false);
      setNewSubject("");
      setNewMessage("");
      setNewPriority("medium");
      fetchTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در ثبت تیکت");
    } finally {
      setCreating(false);
    }
  };

  // ─── باز کردن جزئیات ───────────────────────────
  const handleViewTicket = async (ticketId: string) => {
    try {
      const { data } = await apiClient.get(`/tickets/${ticketId}`);
      if (data.success) {
        setSelectedTicket(data.data);
        setDetailOpen(true);
      }
    } catch {
      toast.error("خطا در دریافت جزئیات تیکت");
    }
  };

  // ─── ارسال پاسخ ────────────────────────────────
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      await apiClient.post(`/tickets/${selectedTicket._id}/reply`, {
        message: replyText.trim(),
      });
      toast.success("پاسخ با موفقیت ارسال شد");

      const newReply = {
        _id: Date.now().toString(),
        message: replyText.trim(),
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };
      setSelectedTicket((prev) =>
        prev ? { ...prev, replies: [...(prev.replies || []), newReply] } : prev,
      );
      setReplyText("");
      // به‌روزرسانی لیست تیکت‌ها
      fetchTickets(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در ارسال پاسخ");
    } finally {
      setSendingReply(false);
    }
  };

  // ─── فیلترها ────────────────────────────────────
  const filteredTickets = tickets.filter((t) => {
    const matchSearch = t.subject?.toLowerCase().includes(search.toLowerCase());
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
                تیکت‌های پشتیبانی
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                پیگیری مشکلات و ارتباط با پشتیبانی
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTickets(true)}
              disabled={refreshing}
              className="gap-2 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              بروزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              تیکت جدید
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
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  کل تیکت‌ها
                </p>
                <p className="text-xl font-black">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-full"
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 bg-blue-100/80 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">باز</p>
                <p className="text-xl font-black">{stats.open}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full"
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 bg-amber-100/80 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  در حال بررسی
                </p>
                <p className="text-xl font-black">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="h-full"
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  بسته
                </p>
                <p className="text-xl font-black">{stats.closed}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== Create Ticket Form ===== */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <Card className="border-border/50 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/20">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                  ایجاد تیکت جدید
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">
                    موضوع <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="موضوع تیکت را وارد کنید..."
                    className="rounded-xl h-11 border-border/60 focus:border-primary/40 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">
                    پیام <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="مشکل یا درخواست خود را توضیح دهید..."
                    rows={4}
                    className="rounded-xl resize-none border-border/60 focus:border-primary/40 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">
                    اولویت
                  </Label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger className="w-full sm:w-[200px] rounded-xl h-11 border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="low">کم</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">بالا</SelectItem>
                      <SelectItem value="urgent">فوری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={handleCreateTicket}
                    disabled={creating}
                    className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    ثبت تیکت
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-xl"
                  >
                    انصراف
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Filters ===== */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در موضوع تیکت..."
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

      {/* ===== Tickets Table ===== */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  موضوع
                </th>
                <th className="p-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  اولویت
                </th>
                <th className="p-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="p-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  تاریخ
                </th>
                <th className="p-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-4">
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Ticket className="w-10 h-10 text-muted-foreground/30" />
                      <p className="font-medium">تیکتی یافت نشد</p>
                      <p className="text-xs">
                        با تغییر فیلترها یا ثبت تیکت جدید شروع کنید
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const status =
                    statusConfig[ticket.status] || statusConfig.open;
                  const priority =
                    priorityConfig[ticket.priority] || priorityConfig.medium;
                  return (
                    <motion.tr
                      key={ticket._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate max-w-[150px] sm:max-w-xs">
                            {ticket.subject}
                          </span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          className={cn(
                            "text-[11px] px-2.5 py-0.5 rounded-md border-0",
                            priority.bgClass,
                            priority.color,
                          )}
                        >
                          {priority.label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          className={cn(
                            "text-[11px] px-2.5 py-0.5 rounded-md gap-1.5 border",
                            status.bgClass,
                            status.color,
                          )}
                        >
                          {status.icon}
                          {status.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground hidden sm:table-cell">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => handleViewTicket(ticket._id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ===== Detail Dialog ===== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 rounded-2xl overflow-hidden border-border/50">
          {selectedTicket && (
            <>
              {/* Dialog Header */}
              <div className="shrink-0 p-5 border-b border-border/20 bg-muted/5">
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setDetailOpen(false)}
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
                      priorityConfig[selectedTicket.priority]?.color,
                    )}
                  >
                    {priorityConfig[selectedTicket.priority]?.label}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-md gap-1.5 border",
                      statusConfig[selectedTicket.status]?.bgClass,
                      statusConfig[selectedTicket.status]?.color,
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
                <h4 className="font-black text-sm flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  گفتگوها
                </h4>
                <div className="space-y-3">
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
                                شما
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
