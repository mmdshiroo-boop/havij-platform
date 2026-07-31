"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ticketApi } from "@/services/api/ticket.api";
import {
  MessageCircle,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  Send,
  HelpCircle,
  ShieldCheck,
  Star,
  Loader2,
} from "lucide-react";

const faqs = [
  {
    q: "چگونه آگهی خود را ثبت کنم؟",
    a: "کافیست از منوی اصلی روی «ثبت آگهی» کلیک کرده و اطلاعات را وارد کنید.",
  },
  {
    q: "مدت زمان تأیید آگهی چقدر است؟",
    a: "آگهی‌ها معمولاً کمتر از ۲ ساعت بررسی و تأیید می‌شوند.",
  },
  {
    q: "چگونه اشتراک VIP تهیه کنم؟",
    a: "از منوی پنل کاربری خود به بخش «اشتراک» بروید و پلن مورد نظر را انتخاب کنید.",
  },
  {
    q: "در صورت مشکل در پرداخت چه کنم؟",
    a: "یک تیکت با موضوع «مشکل پرداخت» ثبت کنید تا تیم پشتیبانی بررسی کند.",
  },
  {
    q: "آیا می‌توانم آگهی خود را ویرایش کنم؟",
    a: "بله، در پنل کاربری خود روی «آگهی‌های من» کلیک کرده و گزینه ویرایش را انتخاب کنید.",
  },
];

export default function SupportPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    subject: "",
    message: "",
    priority: "medium",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error("عنوان و پیام را وارد کنید");
      return;
    }
    setSending(true);
    try {
      await ticketApi.createTicket(form);
      toast.success("تیکت با موفقیت ثبت شد");
      setForm({ subject: "", message: "", priority: "medium" });
      router.push("/panel/user/tickets");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ثبت تیکت");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12"
      dir="rtl"
    >
      {/* هدر */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
          <ShieldCheck className="w-4 h-4" />
          پشتیبانی ویژه
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          ما همیشه کنار شما هستیم
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          هر سوال، مشکل یا پیشنهادی دارید، از طریق فرم زیر با ما در میان
          بگذارید. تیم پشتیبانی معمولاً در کمتر از ۲۴ ساعت پاسخگوی شما خواهد
          بود.
        </p>
      </div>

      {/* دو ستون */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* فرم تیکت */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border/40 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-xl">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-extrabold text-xl">ثبت تیکت جدید</h2>
                <p className="text-xs text-muted-foreground">
                  مشکل خود را شرح دهید تا پیگیری کنیم
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">
                  موضوع تیکت
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder="عنوان مشکل یا درخواست..."
                  className="w-full rounded-xl border border-border/40 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">
                  اولویت
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="w-full rounded-xl border border-border/40 bg-background px-4 py-2.5 text-sm"
                >
                  <option value="low">کم</option>
                  <option value="medium">متوسط</option>
                  <option value="high">بالا</option>
                  <option value="urgent">فوری</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">
                  توضیحات
                </label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="لطفاً مشکل خود را کامل توضیح دهید..."
                  className="w-full rounded-xl border border-border/40 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="gap-2 rounded-xl w-full sm:w-auto"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? "در حال ارسال..." : "ارسال تیکت"}
              </Button>
            </form>
          </div>

          <div className="text-center">
            <Link href="/panel/user/tickets">
              <Button variant="outline" className="gap-2 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
                مشاهده تیکت‌های قبلی
              </Button>
            </Link>
          </div>
        </div>

        {/* راه‌های ارتباطی و سوالات */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              راه‌های ارتباطی
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">تلفن:</span>
                <span className="font-bold">۰۲۱-۱۲۳۴۵۶۷۸</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">ایمیل:</span>
                <span className="font-bold">support@yourplatform.ir</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">ساعت پاسخگویی:</span>
                <span className="font-bold">۹ صبح تا ۱۸</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              سوالات متداول
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group border border-border/30 rounded-xl p-3 [&>summary::-webkit-details-marker]:hidden"
                >
                  <summary className="cursor-pointer list-none text-sm font-bold flex items-center justify-between">
                    {faq.q}
                    <Star className="w-4 h-4 text-primary/50 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
