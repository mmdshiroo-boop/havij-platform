// tickets/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ticketApi } from "@/services/api/ticket.api";
import type { Ticket } from "@/types";
import { Plus, MessageCircle, Search, Star, Clock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: "باز", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  in_progress: { label: "در حال بررسی", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  closed: { label: "بسته شده", color: "bg-green-500/10 text-green-600 border-green-500/20" },
};

const tabs = [
  { key: "all", label: "همه" },
  { key: "open", label: "باز" },
  { key: "in_progress", label: "در حال بررسی" },
  { key: "closed", label: "بسته شده" },
];

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let data: any[];
      if (search.trim()) {
        data = await ticketApi.searchTickets(search, activeTab);
      } else {
        data = await ticketApi.getTickets(activeTab);
      }
      setTickets(data as unknown as Ticket[]);
    } catch (error) {
      toast.error("خطا در دریافت تیکت‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [activeTab, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-l from-primary/10 to-transparent p-5 rounded-2xl border border-primary/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            تیکت‌های پشتیبانی
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            پیگیری و مدیریت درخواست‌های پشتیبانی
          </p>
        </div>
        <Link href="/support" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 rounded-xl font-bold shadow-md shadow-primary/10">
            <Plus className="w-4 h-4" />
            تیکت جدید
          </Button>
        </Link>
      </div>

      {/* جستجو و تب‌ها */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در تیکت‌ها..."
            className="pr-10 rounded-xl h-10 bg-muted/40 border-border/60 focus-visible:ring-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-xl text-xs font-bold whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border-border/60 hover:bg-muted"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* لیست */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted flex items-center justify-center rounded-full text-muted-foreground/50">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1.5">
              تیکتی یافت نشد
            </h3>
            <p className="text-muted-foreground text-xs font-medium mb-5">
              می‌توانید یک تیکت جدید ایجاد کنید
            </p>
            <Link href="/support">
              <Button variant="outline" className="gap-2 rounded-xl font-bold text-xs">
                <Plus className="w-4 h-4" /> ایجاد تیکت
              </Button>
            </Link>
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
          className="space-y-3"
        >
          {tickets.map((ticket) => (
            <motion.div
              key={ticket._id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Link href={`/panel/user/tickets/${ticket._id}`}>
                <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm group">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-sm truncate">
                          {ticket.subject || ticket.title || "بدون عنوان"}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={cn("rounded-md text-[10px] font-bold border", statusMap[ticket.status]?.color)}
                        >
                          {statusMap[ticket.status]?.label}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                        {ticket.rating && (
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            {ticket.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}