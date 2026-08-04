"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import apiClient from "@/services/api/client";
import { motion } from "framer-motion";

export default function VipNewTicket() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("عنوان و پیام را وارد کنید");
      return;
    }
    setSending(true);
    try {
      await apiClient.post("/tickets", { subject, message, priority });
      toast.success("تیکت با موفقیت ثبت شد");
      router.push("/panel/vip/support");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ثبت تیکت");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 px-3 sm:px-6 pb-8"
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
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">ایجاد تیکت پشتیبانی</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            مشکل یا درخواست خود را شرح دهید
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            فرم ثبت تیکت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-bold">عنوان تیکت *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="موضوع تیکت"
                className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold">اولویت</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="low">کم</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">زیاد</SelectItem>
                  <SelectItem value="urgent">فوری</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold">پیام *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="توضیحات کامل..."
                rows={5}
                className="rounded-xl resize-none bg-muted/40 border-border/60 focus-visible:ring-primary"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full gap-2 rounded-xl h-11 font-bold shadow-md shadow-primary/10"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ارسال تیکت
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}