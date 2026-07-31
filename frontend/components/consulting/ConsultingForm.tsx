"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Phone,
  Mail,
  Clock,
  FileText,
  CheckCircle,
  Shield,
  User,
  ArrowRight,
  Send,
  Loader2,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  consultingApi,
  CreateConsultingData,
} from "@/services/api/consulting.api";
import { useAuth } from "@/app/context/AuthContext";

const SUBJECTS = [
  { value: "buy", label: "خرید ملک" },
  { value: "sell", label: "فروش ملک" },
  { value: "legal", label: "مشاوره حقوقی" },
  { value: "valuation", label: "ارزش‌گذاری ملک" },
  { value: "investment", label: "مشاوره سرمایه‌گذاری" },
  { value: "other", label: "سایر موارد" },
];

export default function ConsultingForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateConsultingData>({
    firstName: "",
    lastName: "",
    phone: "",
    subject: "",
    message: "",
    preferredDate: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      toast.error("لطفاً نام خود را وارد کنید");
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error("لطفاً نام خانوادگی خود را وارد کنید");
      return;
    }
    if (!formData.phone.trim() || !formData.phone.match(/^09[0-9]{9}$/)) {
      toast.error("لطفاً شماره تماس معتبر وارد کنید (۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }
    if (!formData.subject) {
      toast.error("لطفاً موضوع مشاوره را انتخاب کنید");
      return;
    }
    if (!formData.message?.trim() || formData.message.trim().length < 10) {
      toast.error("توضیحات درخواست باید حداقل ۱۰ کاراکتر باشد");
      return;
    }

    setLoading(true);
    try {
      const response = await consultingApi.create(formData);
      toast.success(response.message || "✅ درخواست مشاوره با موفقیت ثبت شد", {
        duration: 6000,
        icon: "🎉",
      });
      setFormData((prev) => ({
        ...prev,
        subject: "",
        message: "",
        preferredDate: "",
      }));
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "خطا در ثبت درخواست مشاوره. لطفاً مجدداً تلاش کنید.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                درخواست مشاوره
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مشاوره رایگان و تخصصی املاک
              </p>
            </div>
          </div>
          <Badge className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20">
            <Shield className="w-3.5 h-3.5" />
            مشاوره رایگان
          </Badge>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              فرم درخواست مشاوره
            </CardTitle>
            <CardDescription>
              فرم زیر را تکمیل کنید تا کارشناسان ما در اسرع وقت با شما تماس
              بگیرند
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-bold">
                    نام <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="مثلاً: علی"
                    className="rounded-xl h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-bold">
                    نام خانوادگی <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="مثلاً: محمدی"
                    className="rounded-xl h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold">
                  شماره تماس <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="rounded-xl h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs font-bold">
                  موضوع مشاوره <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    handleSelectChange("subject", value)
                  }
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="انتخاب کنید..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SUBJECTS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-bold">
                  توضیحات درخواست <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="توضیحات کامل درخواست خود را وارد کنید..."
                  className="rounded-xl resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredDate" className="text-xs font-bold">
                  تاریخ ترجیحی (اختیاری)
                </Label>
                <Input
                  id="preferredDate"
                  name="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  className="rounded-xl h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 h-12 text-base font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ثبت درخواست...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    ارسال درخواست مشاوره
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                با ثبت این فرم، اطلاعات شما نزد ما محفوظ است و فقط برای ارتباط
                با شما استفاده خواهد شد.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                راه‌های ارتباطی
              </CardTitle>
              <CardDescription>
                از طریق یکی از راه‌های زیر با ما در تماس باشید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">شماره تماس</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ۰۲۱-۱۲۳۴۵۶۷۸
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    همه روزه ۸ تا ۲۰
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">ایمیل</p>
                  <p className="text-xs text-muted-foreground">
                    support@divarclone.com
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    پاسخگویی در ۲۴ ساعت
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-400 transition-all cursor-pointer group"
              >
                <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">واتساپ</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ۰۹۱۲۳۴۵۶۷۸۹
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    پاسخگویی فوری
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
              </motion.div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                مزایای مشاوره
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
                <div className="p-1.5 bg-emerald-100/80 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">کاملاً رایگان</p>
                  <p className="text-xs text-muted-foreground">
                    مشاوره تخصصی بدون هیچ هزینه‌ای
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
                <div className="p-1.5 bg-amber-100/80 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">پاسخگویی سریع</p>
                  <p className="text-xs text-muted-foreground">
                    حداکثر ۴۵ دقیقه پاسخ شما داده می‌شود
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">مشاوران خبره</p>
                  <p className="text-xs text-muted-foreground">
                    تیم کارشناسی با سال‌ها تجربه
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
