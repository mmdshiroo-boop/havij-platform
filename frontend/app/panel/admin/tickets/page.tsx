"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ticketApi, Ticket } from "@/services/api/ticket.api";
import {
  MessageSquare, Clock, AlertCircle, CheckCircle2,
  ChevronLeft, User, Calendar, Search, RefreshCw,
  Headset, Filter, TrendingUp, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── ثابت‌ها ─── */
const STATUS_CONFIG: Record<string, {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  open: {
    label: "باز",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    icon: AlertCircle,
  },
  in_progress: {
    label: "در حال بررسی",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    icon: Clock,
  },
  closed: {
    label: "بسته شده",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    icon: CheckCircle2,
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  urgent: { label: "فوری", className: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400" },
  high: { label: "بالا", className: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400" },
  medium: { label: "متوسط", className: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400" },
  low: { label: "کم", className: "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400" },
};

const FILTERS = [
  { id: "all", label: "همه", icon: Inbox },
  { id: "open", label: "باز", icon: AlertCircle },
  { id: "in_progress", label: "در بررسی", icon: Clock },
  { id: "closed", label: "بسته", icon: CheckCircle2 },
];

/* ─── StatCard ─── */
function StatCard({
  icon: Icon,
  title,
  value,
  color = "text-primary",
  bgColor = "bg-primary/10",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  color?: string;
  bgColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-xl sm:text-2xl font-black text-foreground mt-1 tabular-nums">
            {value.toLocaleString("fa-IR")}
          </p>
        </div>
        <div className={cn("w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0", bgColor)}>
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── کامپوننت اصلی ─── */
export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTickets = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await ticketApi.getAdminTickets(filter !== "all" ? { status: filter } : {});
      setTickets(data);
      if (showRefresh) toast.success("تیکت‌ها به‌روزرسانی شدند");
    } catch {
      toast.error("خطا در دریافت تیکت‌ها");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  // آمار
  const stats = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  }), [tickets]);

  // جستجو
  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase().trim();
    return tickets.filter((t) =>
      t.subject?.toLowerCase().includes(q) ||
      (t as any).user?.firstName?.toLowerCase().includes(q) ||
      (t as any).user?.lastName?.toLowerCase().includes(q) ||
      (t as any).user?.phone?.includes(q),
    );
  }, [tickets, search]);

  return (
    <div className="space-y-5 sm:space-y-6 pb-10" dir="rtl">
      {/* هدر */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5 sm:p-6 lg:p-8 shadow-sm"
      >
        <div className="absolute -top-20 -left-20 w-52 h-52 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
              <Headset className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight">
                مدیریت تیکت‌های پشتیبانی
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                پاسخگویی و پیگیری درخواست‌های کاربران
              </p>
            </div>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="gap-2 rounded-xl h-10 px-4 text-xs font-bold bg-background/80 backdrop-blur-sm self-start sm:self-auto"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            بروزرسانی
          </Button>
        </div>
      </motion.div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="کل تیکت‌ها" value={stats.all} icon={MessageSquare} />
        <StatCard
          title="باز (نیاز به پاسخ)"
          value={stats.open}
          icon={AlertCircle}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          title="در حال بررسی"
          value={stats.in_progress}
          icon={Clock}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          title="بسته شده"
          value={stats.closed}
          icon={CheckCircle2}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
      </div>

      {/* فیلتر + جستجو */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* تب‌های فیلتر */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/40 w-full sm:w-auto">
          {FILTERS.map((tab) => {
            const Icon = tab.icon;
            const count = stats[tab.id as keyof typeof stats] || 0;
            return (
              <Button
                key={tab.id}
                variant={filter === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(tab.id)}
                className="rounded-lg text-xs gap-1.5 flex-1 sm:flex-none"
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && tab.id !== "all" && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-bold",
                    filter === tab.id
                      ? "bg-white/20 text-current"
                      : "bg-muted text-muted-foreground",
                  )}>
                    {count.toLocaleString("fa-IR")}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* جستجو */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="جستجو در موضوع، کاربر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl h-10 bg-background border-border/60 text-sm"
          />
        </div>
      </div>

      {/* اطلاعات تعداد */}
      {!loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <span>
            نمایش <strong className="text-foreground">{filtered.length.toLocaleString("fa-IR")}</strong> تیکت
          </span>
          {search && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Search className="w-3 h-3" />
              جستجو: {search}
            </Badge>
          )}
        </div>
      )}

      {/* لیست */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="rounded-2xl border-dashed border-2 border-border/60">
              <CardContent className="p-12 text-center flex flex-col items-center gap-3">
                <div className="p-5 rounded-2xl bg-muted/50">
                  <MessageSquare className="w-10 h-10 opacity-25" />
                </div>
                <p className="font-bold text-base">هیچ تیکتی یافت نشد</p>
                <p className="text-xs text-muted-foreground">
                  {search ? "با جستجوی متفاوت دوباره امتحان کنید" : "در این وضعیت هیچ تیکتی وجود ندارد"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={filter + search}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {filtered.map((ticket, i) => {
              const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
              const StatusIcon = status.icon;
              const userName = `${(ticket as any).user?.firstName || ""} ${(ticket as any).user?.lastName || ""}`.trim() || "کاربر سیستم";
              const hasUnread = ticket.status === "open";
              const msgCount = (ticket as any).messages?.length || 0;

              return (
                <motion.div
                  key={ticket._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link href={`/panel/admin/tickets/${ticket._id}`} className="block group focus:outline-none">
                    <Card className={cn(
                      "hover:shadow-md border-border/60 hover:border-primary/40 transition-all rounded-2xl overflow-hidden bg-card",
                      hasUnread && "border-r-4 border-r-amber-500",
                    )}>
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start sm:items-center justify-between gap-3">
                          {/* محتوا سمت راست */}
                          <div className="space-y-2.5 min-w-0 flex-1">
                            {/* badge ها */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={cn("gap-1 font-medium border text-[11px]", status.className)}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                              {ticket.priority && (
                                <Badge variant="outline" className={cn("text-[10px]", priority.className)}>
                                  {priority.label}
                                </Badge>
                              )}
                              {msgCount > 0 && (
                                <Badge variant="secondary" className="text-[10px] gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {msgCount.toLocaleString("fa-IR")} پیام
                                </Badge>
                              )}
                            </div>

                            {/* موضوع */}
                            <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                              {ticket.subject}
                            </h3>

                            {/* اطلاعات */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                {userName}
                              </span>
                              {(ticket as any).user?.phone && (
                                <span className="font-mono" dir="ltr">
                                  {(ticket as any).user.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                              </span>
                            </div>
                          </div>

                          {/* فلش */}
                          <div className="shrink-0 flex items-center gap-2">
                            {hasUnread && (
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            )}
                            <ChevronLeft className="w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}