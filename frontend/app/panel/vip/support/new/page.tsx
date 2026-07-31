"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import apiClient from "@/services/api/client";

export default function NewTicket() {
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
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold">ایجاد تیکت پشتیبانی</h2>
      <Card>
        <CardHeader>
          <CardTitle>مشکل یا درخواست خود را شرح دهید</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>عنوان</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="موضوع تیکت"
              />
            </div>
            <div>
              <Label>اولویت</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">کم</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد</option>
                <option value="urgent">فوری</option>
              </select>
            </div>
            <div>
              <Label>پیام</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="توضیحات کامل..."
                rows={5}
              />
            </div>
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? "در حال ارسال..." : "ارسال تیکت"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
