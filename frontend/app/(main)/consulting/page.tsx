// app/consulting/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Calendar, Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function ConsultingPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    subject: "",
    message: "",
    preferredDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.subject) {
      toast.error("فیلدهای ضروری را پر کنید");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/consulting`, form);
      if (data.success) {
        setSuccess(true);
        toast.success("درخواست شما با موفقیت ثبت شد.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ثبت درخواست");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center p-4"
        dir="rtl"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold mb-4">درخواست ثبت شد</h2>
          <p className="text-muted-foreground mb-6">
            کارشناسان به زودی تماس می‌گیرند.
          </p>
          <Button
            onClick={() => {
              setSuccess(false);
              setForm({
                firstName: "",
                lastName: "",
                phone: "",
                subject: "",
                message: "",
                preferredDate: "",
              });
            }}
          >
            ثبت درخواست جدید
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center p-4"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-extrabold">
              درخواست مشاوره رایگان
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              فرم زیر را تکمیل کنید
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نام *</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label>نام خانوادگی *</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div>
                <Label>شماره تماس *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>موضوع *</Label>
                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label>توضیحات</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  rows={3}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label>تاریخ ترجیحی</Label>
                <Input
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) =>
                    setForm({ ...form, preferredDate: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                ارسال درخواست
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
