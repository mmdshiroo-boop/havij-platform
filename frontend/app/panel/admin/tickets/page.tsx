"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ticketApi, Ticket } from "@/services/api/ticket.api";
import {
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  User,
  Calendar,
} from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  open: {
    label: "باز",
    color:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  in_progress: {
    label: "در حال بررسی",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  closed: {
    label: "بسته شده",
    color:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: {
    label: "فوری",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  high: {
    label: "بالا",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  medium: {
    label: "متوسط",
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  },
  low: {
    label: "کم",
    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketApi.getAdminTickets(
        filter !== "all" ? { status: filter } : {},
      );
      setTickets(data);
    } catch {
      toast.error("خطا در دریافت تیکت‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            مدیریت تیکت‌ها
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            پاسخگویی و پیگیری درخواست‌های کاربران
          </p>
        </div>

        {/* فیلتر وضعیت */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/40">
          {[
            { id: "all", label: "همه" },
            { id: "open", label: "باز" },
            { id: "in_progress", label: "در حال بررسی" },
            { id: "closed", label: "بسته شده" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={filter === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(tab.id)}
              className="rounded-lg text-xs transition-all"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* لیست تیکت‌ها */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2">
          <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <MessageSquare className="w-12 h-12 opacity-20 mb-3" />
            <p className="font-bold text-base">هیچ تیکتی یافت نشد</p>
            <p className="text-xs text-muted-foreground mt-1">
              در این وضعیت هیچ درخواست پشتیبانی وجود ندارد.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {tickets.map((t) => {
            const status = statusConfig[t.status] || statusConfig.open;
            const priority =
              priorityConfig[t.priority] || priorityConfig.medium;
            const userName =
              `${(t as any).user?.firstName || ""} ${(t as any).user?.lastName || ""}`.trim() ||
              "کاربر سیستم";

            return (
              <Link
                key={t._id}
                href={`/panel/admin/tickets/${t._id}`}
                className="block group focus:outline-none"
              >
                <Card className="hover:shadow-md border-border/60 hover:border-primary/40 transition-all rounded-2xl overflow-hidden bg-card">
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="space-y-2.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={`gap-1 font-medium border text-[11px] ${status.color}`}
                        >
                          {status.icon}
                          {status.label}
                        </Badge>
                        {t.priority && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${priority.color}`}
                          >
                            {priority.label}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">
                        {t.subject}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                          {userName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                          {new Date(t.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                    </div>

                    <ChevronLeft className="w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
