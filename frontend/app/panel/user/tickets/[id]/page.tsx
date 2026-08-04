// tickets/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ticketApi } from "@/services/api/ticket.api";
import type { Ticket } from "@/types";
import { useAuth } from "@/app/context/AuthContext";
import { ArrowRight, Send, Lock, Star, RefreshCw, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: "باز", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  in_progress: { label: "در حال بررسی", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  closed: { label: "بسته شده", color: "bg-green-500/10 text-green-600 border-green-500/20" },
};

export default function UserTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const isPrivileged = user?.role !== "user";

  const fetchTicket = async () => {
    try {
      const data = await ticketApi.getTicket(id);
      setTicket(data as unknown as Ticket);
      setRating((data as any).rating || 0);
    } catch (error) {
      toast.error("خطا در دریافت تیکت");
      router.push("/panel/user/tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await ticketApi.replyTicket(id, message);
      toast.success("پاسخ ارسال شد");
      setMessage("");
      fetchTicket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ارسال پاسخ");
    } finally {
      setSending(false);
    }
  };

  const handleReopen = async () => {
    try {
      await ticketApi.reopenTicket(id, message);
      toast.success("تیکت بازگشایی شد");
      setMessage("");
      fetchTicket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا");
    }
  };

  const handleRate = async (value: number) => {
    try {
      await ticketApi.rateTicket(id, value);
      toast.success("امتیاز ثبت شد");
      fetchTicket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا");
    }
  };

  const handleClose = async () => {
    try {
      await ticketApi.closeTicket(id);
      toast.success("تیکت بسته شد");
      fetchTicket();
    } catch {
      toast.error("خطا در بستن تیکت");
    }
  };

  if (loading)
    return (
      <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  if (!ticket) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* هدر */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-3.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl hover:bg-muted/60"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">
              {ticket.subject || ticket.title || "بدون عنوان"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge
                variant="outline"
                className={cn("rounded-md text-[10px] font-bold border", statusMap[ticket.status]?.color)}
              >
                {statusMap[ticket.status]?.label}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString("fa-IR")}
              </span>
              {ticket.rating && (
                <span className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" /> {ticket.rating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* عملیات */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {ticket.status === "closed" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReopen}
                className="rounded-xl gap-1.5 text-xs font-bold border-border/60"
              >
                <RefreshCw className="w-4 h-4" />
                بازگشایی
              </Button>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 cursor-pointer transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted-foreground/30"
                    }`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(star)}
                  />
                ))}
              </div>
            </>
          )}
          {isPrivileged && ticket.status !== "closed" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClose}
              className="rounded-xl gap-1.5 text-xs font-bold"
            >
              <Lock className="w-4 h-4" /> بستن
            </Button>
          )}
        </div>
      </div>

      {/* پیام‌ها */}
      <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {ticket.messages?.length ? (
              ticket.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-3 rounded-2xl shadow-sm",
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/60 rounded-bl-md"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold">
                        {msg.sender === "user" ? "شما" : "پشتیبانی"}
                      </span>
                      <span className="text-[10px] opacity-70">
                        {new Date(msg.timestamp).toLocaleString("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">
                هنوز پیامی ثبت نشده است.
              </p>
            )}
          </div>

          {/* فرم ارسال */}
          <div className="pt-2 border-t border-border/40">
            {ticket.status !== "closed" ? (
              <div className="flex items-end gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={sending}
                  size="icon"
                  className="shrink-0 rounded-xl h-10 w-10"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="توضیح برای بازگشایی..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                />
                <Button onClick={handleReopen} className="shrink-0 rounded-xl gap-1.5 text-xs font-bold">
                  <RefreshCw className="w-4 h-4" /> بازگشایی
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}