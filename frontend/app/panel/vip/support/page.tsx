"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Ticket {
  _id: string;
  subject: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  updatedAt: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  open: {
    label: "باز",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  in_progress: {
    label: "در حال بررسی",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  closed: {
    label: "بسته شده",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
};

const PRIORITY_MAP: Record<string, { label: string; className: string }> = {
  low: { label: "کم", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
  medium: { label: "متوسط", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  high: { label: "زیاد", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  urgent: { label: "فوری", className: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function VipSupportList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/tickets");
      setTickets(res.data.data);
    } catch (err) {
      toast.error("خطا در دریافت تیکت‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* هدر */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              تیکت‌های پشتیبانی
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              پیگیری و مدیریت درخواست‌های پشتیبانی
            </p>
          </div>
        </div>
        <Link href="/panel/vip/support/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 rounded-xl font-bold shadow-md shadow-primary/10">
            <Plus className="w-4 h-4" />
            تیکت جدید
          </Button>
        </Link>
      </motion.div>

      {/* محتوا */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted flex items-center justify-center rounded-full text-muted-foreground/50">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1.5">
              هیچ تیکتی وجود ندارد
            </h3>
            <p className="text-muted-foreground text-xs font-medium mb-5">
              اولین تیکت خود را ایجاد کنید
            </p>
            <Link href="/panel/vip/support/new">
              <Button variant="outline" className="gap-2 rounded-xl font-bold text-xs">
                <Plus className="w-4 h-4" /> ایجاد تیکت
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = STATUS_MAP[ticket.status] || STATUS_MAP.open;
            const priority = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;
            return (
              <motion.div key={ticket._id} variants={itemVariants}>
                <Link href={`/panel/vip/support/${ticket._id}`}>
                  <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm group">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {ticket.subject}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <Badge className={cn("text-[10px] font-bold border", status.className)}>
                            {status.label}
                          </Badge>
                          <Badge className={cn("text-[10px] font-bold border", priority.className)}>
                            {priority.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ticket.updatedAt).toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                      </div>
                      <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}