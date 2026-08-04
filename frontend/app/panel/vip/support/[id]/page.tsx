"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Send, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  sender: "user" | "admin";
  message: string;
  timestamp: string;
}

interface Ticket {
  _id: string;
  subject: string;
  status: string;
  messages: Message[];
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  open: { label: "باز", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  in_progress: { label: "در حال بررسی", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  closed: { label: "بسته شده", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

export default function VipTicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await apiClient.get(`/tickets/${id}`);
      setTicket(res.data.data);
    } catch (err) {
      toast.error("خطا در دریافت تیکت");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await apiClient.post(`/tickets/${id}/reply`, { message: reply });
      toast.success("پاسخ ارسال شد");
      setReply("");
      fetchTicket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 px-3 sm:px-6 pb-8" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20" dir="rtl">
        <p className="text-muted-foreground">تیکت یافت نشد</p>
      </div>
    );
  }

  const status = STATUS_MAP[ticket.status] || STATUS_MAP.open;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* هدر */}
      <div className="flex items-center gap-3">
        <Link href="/panel/vip/support">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-border/60 hover:bg-muted"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-foreground truncate">
            {ticket.subject}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn("text-[10px] font-bold border", status.className)}>
              {status.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* پیام‌ها */}
      <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-5 space-y-4">
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
                        : "bg-muted/60 rounded-bl-md",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold">
                        {msg.sender === "user" ? "شما" : "پشتیبانی"}
                      </span>
                      <span className="text-[10px] opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString("fa-IR", {
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

          {/* فرم پاسخ */}
          {ticket.status !== "closed" && (
            <div className="flex items-end gap-2 pt-2 border-t border-border/40">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                rows={2}
                className="flex-1 resize-none rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
              />
              <Button
                onClick={sendReply}
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}