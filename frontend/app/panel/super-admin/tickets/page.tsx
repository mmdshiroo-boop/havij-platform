"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket,
  Search,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  Loader2,
  Phone,
  User,
  Calendar,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// افزودن این اینترفیس‌ها به بالای فایل (قبل از کامپوننت)
interface TicketReply {
  _id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface TicketData {
  _id: string;
  subject: string;
  user: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  message?: string;
  replies?: TicketReply[];
  createdAt: string;
}
// ─── کانفیگ جدید وضعیت‌ها (بدون بک‌گراند کدر - فقط بوردر و متن شفاف) ──────
const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  open: {
    label: "باز",
    className:
      "bg-transparent border-orange-500 text-orange-600 font-medium dark:text-orange-400 dark:border-orange-500/60",
    icon: (
      <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
    ),
  },
  in_progress: {
    label: "در حال بررسی",
    className:
      "bg-transparent border-amber-500 text-amber-600 font-medium dark:text-amber-400 dark:border-amber-500/60",
    icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
  },
  closed: {
    label: "بسته شده",
    className:
      "bg-transparent border-emerald-500 text-emerald-600 font-medium dark:text-emerald-400 dark:border-emerald-500/60",
    icon: (
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    ),
  },
};

// ─── کانفیگ جدید اولویت‌ها (بدون بک‌گراند کدر - فقط بوردر و متن شفاف) ─────
const priorityConfig: Record<string, { label: string; className: string }> = {
  low: {
    label: "کم",
    className:
      "bg-transparent border-slate-300 text-slate-700 font-medium dark:border-slate-700 dark:text-slate-300",
  },
  medium: {
    label: "متوسط",
    className:
      "bg-transparent border-blue-400 text-blue-600 font-medium dark:border-blue-800 dark:text-blue-400",
  },
  high: {
    label: "بالا",
    className:
      "bg-transparent border-orange-400 text-orange-600 font-medium dark:border-orange-800 dark:text-orange-400",
  },
  urgent: {
    label: "فوری",
    className:
      "bg-transparent border-rose-500 text-rose-600 font-bold dark:border-rose-800 dark:text-rose-400",
  },
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketDetailOpen, setTicketDetailOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/tickets/admin/all");
      if (data.success) {
        setTickets(data.data || []);
      } else if (Array.isArray(data)) {
        setTickets(data);
      }
    } catch {
      toast.error("خطا در دریافت لیست تیکت‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleViewTicket = async (ticketId: string) => {
    try {
      const { data } = await axios.get(`/tickets/admin/${ticketId}`);
      const ticketObj = data.success ? data.data : data;
      setSelectedTicket(ticketObj);
      setTicketDetailOpen(true);
      scrollToBottom();
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

      const newReply: TicketReply = {
        _id: Date.now().toString(),
        message: replyText.trim(),
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };

      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: "in_progress",
              replies: [...(prev.replies || []), newReply],
            }
          : prev,
      );

      setTickets((prev) =>
        prev.map((t) =>
          t._id === selectedTicket._id ? { ...t, status: "in_progress" } : t,
        ),
      );

      setReplyText("");
      scrollToBottom();
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
      toast.success("وضعیت تیکت به‌روزرسانی شد");

      setTickets((prev) =>
        prev.map((t) =>
          t._id === ticketId ? { ...t, status: newStatus as any } : t,
        ),
      );

      if (selectedTicket?._id === ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, status: newStatus as any } : prev,
        );
      }
    } catch {
      toast.error("خطا در تغییر وضعیت تیکت");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const query = search.toLowerCase();
    const matchSearch =
      t.subject?.toLowerCase().includes(query) ||
      t.user?.firstName?.toLowerCase().includes(query) ||
      t.user?.lastName?.toLowerCase().includes(query) ||
      t.user?.phone?.includes(query);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  return (
    <div className="space-y-6 w-full" dir="rtl">
      {/* هدر ساده و استاندارد صفحه */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            مدیریت تیکت‌ها
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            مشاهده، بررسی و پاسخ به درخواست‌های پشتیبانی کاربران
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          disabled={loading}
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          به‌روزرسانی
        </Button>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              کل تیکت‌ها
            </span>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              stats.total.toLocaleString("fa-IR")
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              تیکت‌های باز
            </span>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              stats.open.toLocaleString("fa-IR")
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              در حال بررسی
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              stats.inProgress.toLocaleString("fa-IR")
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              بسته شده
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              stats.closed.toLocaleString("fa-IR")
            )}
          </div>
        </div>
      </div>

      {/* بخش فیلتر و جستجو */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="جستجو بر اساس موضوع، کاربر یا شماره تلفن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="open">باز</SelectItem>
            <SelectItem value="in_progress">در حال بررسی</SelectItem>
            <SelectItem value="closed">بسته شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* جدول تیکت‌ها */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-right">موضوع</TableHead>
              <TableHead className="text-right">ارسال‌کننده</TableHead>
              <TableHead className="text-right">اولویت</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
              <TableHead className="text-right">تاریخ ایجاد</TableHead>
              <TableHead className="text-center w-[100px]">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-8 w-14 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground text-sm"
                >
                  تیکتی یافت نشد.
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => {
                const status =
                  statusConfig[ticket.status] || statusConfig["open"];
                const priority =
                  priorityConfig[ticket.priority] || priorityConfig["medium"];

                return (
                  <TableRow key={ticket._id} className="hover:bg-muted/30">
                    <TableCell className="font-medium max-w-[280px] truncate text-sm">
                      {ticket.subject}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-foreground">
                          {ticket.user?.firstName} {ticket.user?.lastName}
                        </span>
                        <span className="text-muted-foreground dir-ltr text-right font-mono mt-0.5">
                          {ticket.user?.phone}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] px-2.5 py-0.5 border",
                          priority.className,
                        )}
                      >
                        {priority.label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] px-2.5 py-0.5 gap-1.5 border",
                          status.className,
                        )}
                      >
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTicket(ticket._id)}
                        className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        مشاهده
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* مودال جزئیات تیکت */}
      <Dialog open={ticketDetailOpen} onOpenChange={setTicketDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 gap-5">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {selectedTicket?.subject}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  شناسه تیکت:{" "}
                  <span className="font-mono">{selectedTicket?._id}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedTicket && (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-muted/20 border text-xs">
                <div>
                  <span className="text-muted-foreground block mb-1">
                    کاربر
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedTicket.user?.firstName}{" "}
                    {selectedTicket.user?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    شماره تماس
                  </span>
                  <span className="font-mono text-foreground dir-ltr text-right block">
                    {selectedTicket.user?.phone}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    تاریخ ثبت
                  </span>
                  <span className="font-mono text-foreground">
                    {new Date(selectedTicket.createdAt).toLocaleDateString(
                      "fa-IR",
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    اولویت
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-2 py-0 border",
                      priorityConfig[selectedTicket.priority]?.className,
                    )}
                  >
                    {priorityConfig[selectedTicket.priority]?.label}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {selectedTicket.message && (
                  <div className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs border-b pb-2 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {selectedTicket.user?.firstName}{" "}
                        {selectedTicket.user?.lastName} (کاربر)
                      </span>
                      <span className="font-mono">
                        {new Date(selectedTicket.createdAt).toLocaleString(
                          "fa-IR",
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.message}
                    </p>
                  </div>
                )}

                {selectedTicket.replies && selectedTicket.replies.length > 0
                  ? selectedTicket.replies.map((reply: TicketReply) => (
                      <div
                        key={reply._id}
                        className={cn(
                          "rounded-lg border p-4 space-y-2",
                          reply.isAdmin
                            ? "bg-primary/5 border-primary/20"
                            : "bg-card border-border",
                        )}
                      >
                        <div className="flex items-center justify-between text-xs border-b pb-2 text-muted-foreground">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            {reply.isAdmin && (
                              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            )}
                            {reply.isAdmin
                              ? "پشتیبانی سیستم"
                              : `${selectedTicket.user?.firstName} ${selectedTicket.user?.lastName}`}
                          </span>
                          <span className="font-mono">
                            {new Date(reply.createdAt).toLocaleString("fa-IR")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                    ))
                  : null}

                <div ref={chatEndRef} />
              </div>

              <div className="pt-3 border-t space-y-3 shrink-0">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="متن پاسخ خود را بنویسید..."
                  className="min-h-[80px] resize-none text-sm"
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      تغییر وضعیت:
                    </span>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(val) =>
                        handleChangeStatus(selectedTicket._id, val)
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">باز</SelectItem>
                        <SelectItem value="in_progress">
                          در حال بررسی
                        </SelectItem>
                        <SelectItem value="closed">بسته شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    size="sm"
                    className="gap-2 px-4"
                  >
                    {sendingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    ارسال پاسخ
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
