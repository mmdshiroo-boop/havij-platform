"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ticketApi, Ticket } from "@/services/api/ticket.api";
import {
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  Paperclip,
  Download,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  open: {
    label: "باز",
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-amber-600 border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  in_progress: {
    label: "در حال بررسی",
    icon: <Clock className="w-4 h-4" />,
    color: "text-blue-600 border-blue-500/30",
    bg: "bg-blue-500/10",
  },
  closed: {
    label: "بسته شده",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-emerald-600 border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
};

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // مرجع برای اسکرول به انتهای پیام‌ها
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTicket = async () => {
    try {
      const data = await ticketApi.getAdminTicket(id);
      setTicket(data);
    } catch {
      toast.error("خطا در دریافت تیکت");
      // 🟢 اصلاح روت برگشت برای جلوگیری از ۴۰۴
      router.push("/panel/admin/tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (ticket) {
      scrollToBottom();
    }
  }, [ticket?.messages]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await ticketApi.updateTicketStatus(id, newStatus);
      toast.success(`تیکت ${statusConfig[newStatus]?.label || newStatus} شد`);
      fetchTicket();
      setShowCloseConfirm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در تغییر وضعیت");
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await ticketApi.adminReply(id, reply);
      toast.success("پاسخ با موفقیت ثبت شد");
      setReply("");
      await fetchTicket();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در ارسال پاسخ");
    } finally {
      setSending(false);
    }
  };

  // تابع هوشمند برای دکمه بازگشت
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/panel/admin/tickets");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir="rtl">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!ticket) return null;

  const currentStatus = statusConfig[ticket.status] || statusConfig.open;
  const userName =
    `${(ticket as any).user?.firstName || ""} ${(ticket as any).user?.lastName || ""}`.trim() ||
    "کاربر سیستم";

  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      dir="rtl"
    >
      {/* ─── هدر تیکت ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/40 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleGoBack}
            className="rounded-xl shrink-0 h-10 w-10 border-border/60 hover:bg-primary/5"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-black">{ticket.subject}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge
                className={`${currentStatus.bg} ${currentStatus.color} border gap-1`}
              >
                {currentStatus.icon}
                <span>{currentStatus.label}</span>
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                اولویت:{" "}
                {ticket.priority === "urgent"
                  ? "فوری"
                  : ticket.priority === "high"
                    ? "بالا"
                    : ticket.priority === "medium"
                      ? "متوسط"
                      : "کم"}
              </Badge>
              <span>•</span>
              <span className="font-medium text-foreground">{userName}</span>
            </div>
          </div>
        </div>

        {/* دکمه‌های تغییر وضعیت */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
          {ticket.status !== "open" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("open")}
              className="rounded-xl gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              باز کردن
            </Button>
          )}
          {ticket.status !== "in_progress" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("in_progress")}
              className="rounded-xl gap-1.5 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 text-xs"
            >
              <Clock className="w-3.5 h-3.5" />
              در حال بررسی
            </Button>
          )}
          {ticket.status !== "closed" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowCloseConfirm(true)}
              className="rounded-xl gap-1.5 text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              بستن تیکت
            </Button>
          )}
        </div>
      </motion.div>

      {/* ─── محتوای چت و پیام‌ها ─── */}
      <Card className="border-border/50 shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="p-4 sm:p-6 space-y-4 max-h-[550px] min-h-[300px] overflow-y-auto bg-muted/10">
            <AnimatePresence initial={false}>
              {ticket.messages.map((msg, index) => {
                const isUser = msg.sender === "user";
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-sm ${
                        isUser
                          ? "bg-card border border-border/60 text-foreground rounded-tr-none"
                          : "bg-primary text-primary-foreground rounded-tl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-current/10">
                        <span className="text-xs font-bold">
                          {isUser ? userName : "پشتیبانی سایت"}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {new Date(msg.timestamp).toLocaleString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>

                      {/* پیوست */}
                      {(msg as any).attachment && (
                        <a
                          href={(msg as any).attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isUser
                              ? "bg-muted hover:bg-muted/80 text-foreground"
                              : "bg-white/20 hover:bg-white/30 text-white"
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>دانلود فایل پیوست</span>
                          <Download className="w-3.5 h-3.5 mr-1" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <Separator />

          {/* ─── فرم ارسال پاسخ ─── */}
          {ticket.status === "closed" ? (
            <div className="p-4 bg-muted/40 text-center flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-4 h-4 text-amber-500" />
              این تیکت بسته شده است. برای ارسال پاسخ جدید، ابتدا وضعیت آن را
              تغییر دهید.
            </div>
          ) : (
            <div className="p-4 bg-card">
              <div className="flex items-end gap-3">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="پاسخ خود را بنویسید (کلید Enter برای ارسال)..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl border-border/60 bg-background focus:bg-card text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                />
                <Button
                  onClick={handleReply}
                  disabled={sending || !reply.trim()}
                  size="icon"
                  className="shrink-0 rounded-xl h-11 w-11 shadow-sm"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── دیالوگ بستن تیکت ─── */}
      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              تأیید بستن تیکت
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              آیا از بستن این تیکت اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              variant="outline"
              className="rounded-xl text-xs"
              onClick={() => setShowCloseConfirm(false)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl text-xs"
              onClick={() => handleStatusChange("closed")}
            >
              بله، تیکت بسته شود
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
