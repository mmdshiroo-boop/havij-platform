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
import { Plus, MessageCircle, Search, Star } from "lucide-react";

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: "باز", color: "bg-orange-500/10 text-orange-600" },
  in_progress: { label: "در حال بررسی", color: "bg-blue-500/10 text-blue-600" },
  closed: { label: "بسته شده", color: "bg-green-500/10 text-green-600" },
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
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">تیکت‌های من</h1>
        <Link href="/support">
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            تیکت جدید
          </Button>
        </Link>
      </div>

      {/* جستجو */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در تیکت‌ها..."
          className="pr-10 rounded-xl"
        />
      </div>

      {/* تب‌ها */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="rounded-xl text-xs font-bold whitespace-nowrap"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Separator />

      {/* لیست */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>تیکتی یافت نشد.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket._id} href={`/panel/user/tickets/${ticket._id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm truncate">
                        {ticket.subject || ticket.title || "بدون عنوان"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className={statusMap[ticket.status]?.color}
                      >
                        {statusMap[ticket.status]?.label}
                      </Badge>
                      <span>
                        {new Date(
                          ticket.updatedAt || ticket.createdAt,
                        ).toLocaleDateString("fa-IR")}
                      </span>
                      {ticket.rating && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          {ticket.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <MessageCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
