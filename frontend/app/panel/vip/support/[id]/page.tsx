"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import apiClient from "@/services/api/client";

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

export default function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");

  const fetchTicket = async () => {
    try {
      const res = await apiClient.get(`/tickets/${id}`);
      setTicket(res.data.data);
    } catch (err) {
      toast.error("خطا در دریافت تیکت");
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await apiClient.post(`/tickets/${id}/reply`, { message: reply });
      toast.success("پاسخ ارسال شد");
      setReply("");
      fetchTicket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا");
    }
  };

  if (!ticket) return <p>در حال بارگذاری...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>{ticket.subject}</span>
            <Badge>{ticket.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {ticket.messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${msg.sender === "user" ? "bg-primary/10 mr-auto" : "bg-muted ml-auto"} max-w-[80%]`}
              >
                <p className="text-sm">{msg.message}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString("fa-IR")}
                </span>
              </div>
            ))}
          </div>
          {ticket.status !== "closed" && (
            <div className="flex gap-2 items-end">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                rows={3}
                className="flex-1"
              />
              <Button onClick={sendReply}>ارسال</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
