"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, MessageCircle } from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";

interface Ticket {
  _id: string;
  subject: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  updatedAt: string;
}

export default function SupportList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await apiClient.get("/tickets");
      setTickets(res.data.data);
    } catch (err) {
      toast.error("خطا در دریافت تیکت‌ها");
    } finally {
      setLoading(false);
    }
  };

  const priorityBadge = (p: string) => {
    const map: any = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return map[p] || "";
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">تیکت‌های پشتیبانی</h2>
        <Link href="/panel/vip/support/new">
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            تیکت جدید
          </Button>
        </Link>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            هیچ تیکتی وجود ندارد. اولین تیکت خود را ایجاد کنید.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link href={`/panel/vip/support/${ticket._id}`} key={ticket._id}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{ticket.subject}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{ticket.status}</Badge>
                      <Badge className={priorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}