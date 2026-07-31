// frontend/app/panel/developer/docs/page.tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Code2,
  Key,
  Webhook,
  User,
  FileText,
  MapPin,
  Bell,
  Shield,
  ExternalLink,
  Copy,
  Check,
  Heart,
  Building,
  Flag,
  Crown,
  MessageCircle,
  ShoppingCart,
  BarChart3,
  Terminal,
  Send,
  ChevronDown,
  ChevronLeft,
  Zap,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface EndpointItem {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  role?: string;
  params?: Record<string, any>;
  body?: Record<string, any>;
  response?: Record<string, any>;
}

interface EndpointCategory {
  id: string;
  category: string;
  icon: any;
  items: EndpointItem[];
}

const endpoints: EndpointCategory[] = [
  {
    id: "auth",
    category: "احراز هویت",
    icon: Key,
    items: [
      {
        method: "POST",
        path: "/auth/send-otp",
        description: "ارسال کد تایید به شماره تلفن",
        auth: false,
        body: { phone: "09123456789" },
      },
      {
        method: "POST",
        path: "/auth/verify-otp",
        description: "تایید کد و دریافت توکن JWT",
        auth: false,
        body: { phone: "09123456789", code: "123456" },
      },
      {
        method: "POST",
        path: "/auth/logout",
        description: "خروج از حساب کاربری",
        auth: true,
      },
      {
        method: "GET",
        path: "/auth/me",
        description: "دریافت اطلاعات کاربر فعلی",
        auth: true,
      },
      {
        method: "POST",
        path: "/auth/refresh-token",
        description: "دریافت توکن جدید",
        auth: true,
        body: { refreshToken: "your_refresh_token" },
      },
    ],
  },
  {
    id: "users",
    category: "کاربران",
    icon: User,
    items: [
      {
        method: "GET",
        path: "/users/profile",
        description: "دریافت پروفایل کاربر",
        auth: true,
      },
      {
        method: "PUT",
        path: "/users/profile",
        description: "ویرایش پروفایل کاربر",
        auth: true,
        body: { firstName: "علی", lastName: "رضایی", email: "ali@example.com" },
      },
      {
        method: "PUT",
        path: "/users/change-password",
        description: "تغییر رمز عبور",
        auth: true,
        body: { oldPassword: "old123", newPassword: "new123" },
      },
      {
        method: "POST",
        path: "/users/upload-avatar",
        description: "آپلود تصویر پروفایل",
        auth: true,
        body: { file: "multipart/form-data" },
      },
      {
        method: "DELETE",
        path: "/users/account",
        description: "حذف حساب کاربری",
        auth: true,
      },
    ],
  },
  {
    id: "ads",
    category: "آگهی‌ها",
    icon: FileText,
    items: [
      {
        method: "GET",
        path: "/ads",
        description: "دریافت لیست آگهی‌ها با فیلتر",
        auth: false,
        params: { page: 1, limit: 20, category: "ملک", city: "تهران" },
      },
      {
        method: "GET",
        path: "/ads/:id",
        description: "دریافت جزئیات یک آگهی",
        auth: false,
      },
      {
        method: "POST",
        path: "/ads",
        description: "ثبت آگهی جدید",
        auth: true,
        body: {
          title: "آپارتمان ۸۰ متری",
          price: 2500000000,
          category: "ملک",
          description: "نوساز با امکانات کامل...",
        },
      },
      {
        method: "PUT",
        path: "/ads/:id",
        description: "ویرایش آگهی",
        auth: true,
      },
      {
        method: "DELETE",
        path: "/ads/:id",
        description: "حذف آگهی",
        auth: true,
      },
      {
        method: "GET",
        path: "/ads/my-ads",
        description: "آگهی‌های من",
        auth: true,
      },
    ],
  },
  {
    id: "favorites",
    category: "علاقه‌مندی‌ها",
    icon: Heart,
    items: [
      {
        method: "GET",
        path: "/favorites",
        description: "لیست علاقه‌مندی‌ها",
        auth: true,
      },
      {
        method: "POST",
        path: "/favorites/:adId",
        description: "افزودن به علاقه‌مندی‌ها",
        auth: true,
      },
      {
        method: "DELETE",
        path: "/favorites/:adId",
        description: "حذف از علاقه‌مندی‌ها",
        auth: true,
      },
    ],
  },
  {
    id: "categories",
    category: "دسته‌بندی‌ها",
    icon: BookOpen,
    items: [
      {
        method: "GET",
        path: "/categories",
        description: "لیست دسته‌بندی‌ها",
        auth: false,
      },
      {
        method: "GET",
        path: "/categories/:id",
        description: "جزئیات دسته‌بندی",
        auth: false,
      },
      {
        method: "GET",
        path: "/categories/:id/subcategories",
        description: "زیردسته‌ها",
        auth: false,
      },
      {
        method: "POST",
        path: "/categories",
        description: "ایجاد دسته‌بندی جدید",
        auth: true,
        role: "admin",
        body: { name: "خودرو", icon: "car", parentId: null },
      },
    ],
  },
  {
    id: "locations",
    category: "موقعیت مکانی",
    icon: MapPin,
    items: [
      {
        method: "GET",
        path: "/locations/provinces",
        description: "لیست استان‌ها",
        auth: false,
      },
      {
        method: "GET",
        path: "/locations/cities/:provinceId",
        description: "شهرهای یک استان",
        auth: false,
      },
      {
        method: "GET",
        path: "/locations/search",
        description: "جستجوی موقعیت مکانی",
        auth: false,
        params: { q: "تهرانپارس", limit: 10 },
      },
    ],
  },
  {
    id: "notifications",
    category: "اعلان‌ها",
    icon: Bell,
    items: [
      {
        method: "GET",
        path: "/notifications",
        description: "لیست اعلان‌ها",
        auth: true,
        params: { page: 1, limit: 20 },
      },
      {
        method: "GET",
        path: "/notifications/unread-count",
        description: "تعداد اعلان‌های نخوانده",
        auth: true,
      },
      {
        method: "PUT",
        path: "/notifications/:id/read",
        description: "خواندن اعلان",
        auth: true,
      },
      {
        method: "PUT",
        path: "/notifications/read-all",
        description: "خواندن همه اعلان‌ها",
        auth: true,
      },
    ],
  },
  {
    id: "conversations",
    category: "چت و مکالمات",
    icon: MessageCircle,
    items: [
      {
        method: "GET",
        path: "/conversations",
        description: "لیست مکالمات",
        auth: true,
      },
      {
        method: "GET",
        path: "/conversations/:id",
        description: "جزئیات و پیام‌های مکالمه",
        auth: true,
      },
      {
        method: "POST",
        path: "/conversations",
        description: "شروع مکالمه جدید",
        auth: true,
        body: { adId: "ad_id", receiverId: "user_id", message: "سلام" },
      },
      {
        method: "POST",
        path: "/conversations/:id/messages",
        description: "ارسال پیام",
        auth: true,
        body: { content: "متن پیام", type: "text" },
      },
    ],
  },
  {
    id: "reports",
    category: "گزارشات تخلف",
    icon: Flag,
    items: [
      {
        method: "POST",
        path: "/reports",
        description: "ثبت گزارش تخلف",
        auth: true,
        body: { adId: "ad_id", reason: "تخلف", description: "توضیح..." },
      },
      {
        method: "GET",
        path: "/reports/my-reports",
        description: "گزارش‌های من",
        auth: true,
      },
    ],
  },
  {
    id: "properties",
    category: "املاک (آژانس)",
    icon: Building,
    items: [
      {
        method: "GET",
        path: "/properties",
        description: "لیست املاک",
        auth: true,
        role: "agent",
      },
      {
        method: "GET",
        path: "/properties/:id",
        description: "جزئیات ملک",
        auth: true,
        role: "agent",
      },
      {
        method: "POST",
        path: "/properties",
        description: "ثبت ملک جدید",
        auth: true,
        role: "agent",
        body: {
          title: "ویلای لوکس",
          address: "تهرانپارس",
          area: 200,
          rooms: 4,
        },
      },
    ],
  },
  {
    id: "admin",
    category: "ادمین",
    icon: Shield,
    items: [
      {
        method: "GET",
        path: "/admin/users",
        description: "لیست کاربران",
        auth: true,
        role: "admin",
        params: { page: 1, limit: 20 },
      },
      {
        method: "PUT",
        path: "/admin/users/:id/ban",
        description: "مسدود کردن کاربر",
        auth: true,
        role: "admin",
      },
      {
        method: "PUT",
        path: "/admin/users/:id/role",
        description: "تغییر نقش کاربر",
        auth: true,
        role: "admin",
        body: { role: "vip" },
      },
      {
        method: "GET",
        path: "/admin/ads",
        description: "لیست آگهی‌ها",
        auth: true,
        role: "admin",
      },
      {
        method: "DELETE",
        path: "/admin/ads/:id",
        description: "حذف آگهی",
        auth: true,
        role: "admin",
      },
      {
        method: "GET",
        path: "/admin/stats",
        description: "آمار سیستم",
        auth: true,
        role: "admin",
      },
    ],
  },
  {
    id: "super-admin",
    category: "سوپرادمین",
    icon: Crown,
    items: [
      {
        method: "GET",
        path: "/super-admin/admins",
        description: "لیست ادمین‌ها",
        auth: true,
        role: "super_admin",
      },
      {
        method: "POST",
        path: "/super-admin/admins",
        description: "افزودن ادمین",
        auth: true,
        role: "super_admin",
        body: { userId: "user_id", role: "admin" },
      },
      {
        method: "GET",
        path: "/super-admin/logs",
        description: "لاگ‌های سیستم",
        auth: true,
        role: "super_admin",
        params: { page: 1, limit: 50, level: "error" },
      },
      {
        method: "POST",
        path: "/super-admin/backup",
        description: "پشتیبان‌گیری",
        auth: true,
        role: "super_admin",
      },
      {
        method: "GET",
        path: "/super-admin/backups",
        description: "لیست پشتیبان‌ها",
        auth: true,
        role: "super_admin",
      },
      {
        method: "PUT",
        path: "/super-admin/settings",
        description: "تنظیمات سیستم",
        auth: true,
        role: "super_admin",
        body: { siteName: "Divar Clone", maintenanceMode: false },
      },
    ],
  },
  {
    id: "developer",
    category: "توسعه‌دهندگان",
    icon: Code2,
    items: [
      {
        method: "GET",
        path: "/developer/api-keys",
        description: "لیست کلیدهای API",
        auth: true,
        role: "developer",
      },
      {
        method: "POST",
        path: "/developer/api-keys",
        description: "ساخت کلید جدید",
        auth: true,
        role: "developer",
        body: {
          name: "سرویس موبایل",
          scopes: ["ads:read", "ads:write"],
          expiresInDays: 30,
        },
      },
      {
        method: "DELETE",
        path: "/developer/api-keys/:id",
        description: "حذف کلید API",
        auth: true,
        role: "developer",
      },
      {
        method: "POST",
        path: "/developer/api-keys/:id/regenerate",
        description: "بازسازی کلید",
        auth: true,
        role: "developer",
      },
      {
        method: "GET",
        path: "/developer/webhooks",
        description: "لیست Webhookها",
        auth: true,
        role: "developer",
      },
      {
        method: "POST",
        path: "/developer/webhooks",
        description: "ساخت Webhook",
        auth: true,
        role: "developer",
        body: {
          name: "سرور من",
          url: "https://example.com/webhook",
          events: ["ad.created"],
        },
      },
      {
        method: "POST",
        path: "/developer/webhooks/:id/test",
        description: "تست Webhook",
        auth: true,
        role: "developer",
      },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  PATCH:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
  DELETE:
    "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-500/20",
};

const roleLabels: Record<string, string> = {
  developer: "توسعه‌دهنده",
  admin: "ادمین",
  super_admin: "مدیر ارشد",
  user: "کاربر عادی",
  vip: "کاربر ویژه",
  agent: "آژانس",
  expert: "کارشناس",
};

const langTemplates = {
  curl: (m: string, p: string, auth: boolean, body?: any) => {
    let c = `curl -X ${m} "${API_BASE}${p}" \\\n  -H "Content-Type: application/json"`;
    if (auth) c += ` \\\n  -H "Authorization: Bearer YOUR_TOKEN"`;
    if (body) c += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
    return c;
  },
  js: (m: string, p: string, auth: boolean, body?: any) =>
    `fetch("${API_BASE}${p}", {\n  method: "${m}",\n  headers: {\n    "Content-Type": "application/json",${auth ? '\n    "Authorization": "Bearer YOUR_TOKEN",' : ""}\n  },${body ? `\n  body: JSON.stringify(${JSON.stringify(body)}),` : ""}\n}).then(r => r.json()).then(console.log);`,
  python: (m: string, p: string, auth: boolean, body?: any) =>
    `import requests\n\nresponse = requests.${m.toLowerCase()}(\n    "${API_BASE}${p}",\n    headers={"Content-Type": "application/json"${auth ? ',\n    "Authorization": "Bearer YOUR_TOKEN"' : ""}},${body ? `\n    json=${JSON.stringify(body)},` : ""}\n)\nprint(response.json())`,
};

const roleColor: Record<string, string> = {
  developer: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  admin:
    "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10",
  super_admin: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
  agent: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10",
  expert: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
};

export default function DeveloperDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("auth");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lang, setLang] = useState("curl");
  const [tryResp, setTryResp] = useState<{
    status: number;
    data: any;
    time: number;
  } | null>(null);
  const [tryLoading, setTryLoading] = useState(false);

  const filtered = useMemo(
    () =>
      endpoints.filter(
        (c) =>
          !search ||
          c.category.includes(search) ||
          c.items.some(
            (i) => i.path.includes(search) || i.description.includes(search),
          ),
      ),
    [search],
  );

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("کپی شد!");
    setTimeout(() => setCopied(null), 2000);
  };

  const tryIt = async (item: EndpointItem) => {
    setTryLoading(true);
    setTryResp(null);
    const start = Date.now();
    try {
      const token = localStorage.getItem("token");
      const opts: any = {
        method: item.method,
        headers: { "Content-Type": "application/json" },
      };
      if (item.auth && token) opts.headers.Authorization = `Bearer ${token}`;
      if (
        ["POST", "PUT", "PATCH"].includes(item.method) &&
        item.body &&
        item.body.file !== "multipart/form-data"
      ) {
        opts.body = JSON.stringify(item.body);
      }
      const res = await fetch(`${API_BASE}${item.path}`, opts);
      const data = await res.json();
      setTryResp({ status: res.status, data, time: Date.now() - start });
    } catch (e: any) {
      setTryResp({
        status: 0,
        data: { error: e.message },
        time: Date.now() - start,
      });
    }
    setTryLoading(false);
  };

  const totalEndpoints = endpoints.reduce((a, c) => a + c.items.length, 0);
  // بعد از این خط:

  // این رو اضافه کن:
  const scrollToCat = (id: string) => {
    setActiveCat(id);
    setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };
  return (
    <div className="flex h-[calc(100vh-64px)]" dir="rtl">
      {/* سایدبار */}
      <aside className="w-64 shrink-0 border-l border-border/50 bg-muted/20 hidden lg:block">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-500" /> API Reference
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {totalEndpoints} اندپوینت
          </p>
        </div>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <nav className="p-2 space-y-0.5">
            {endpoints.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCat(cat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-right ${activeCat === cat.id ? "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-medium" : "text-muted-foreground hover:bg-muted"}`}
              >
                <cat.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{cat.category}</span>
                <span className="mr-auto text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {cat.items.length}
                </span>
              </button>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* محتوا */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-orange-500" /> مستندات API
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                راهنمای کامل استفاده از API سامانه
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                placeholder="جستجو..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm w-full sm:w-56"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `${API_BASE.replace("/api", "")}/api-docs`,
                    "_blank",
                  )
                }
                className="gap-1.5 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />{" "}
                <span className="hidden sm:inline">Swagger</span>
              </Button>
            </div>
          </div>

          {/* Base URL + Auth */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-muted-foreground">Base URL:</span>
              <code className="text-xs font-mono font-medium">{API_BASE}</code>
              <button
                onClick={() => copy(API_BASE, "base")}
                className="text-muted-foreground hover:text-foreground"
              >
                {copied === "base" ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 px-3 py-1.5 rounded-lg">
              <Key className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <code className="text-xs font-mono">
                Authorization: Bearer TOKEN
              </code>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {filtered.map((cat) => (
            <Card
              key={cat.id}
              id={cat.id}
              className={
                activeCat && activeCat !== cat.id && !search
                  ? "opacity-40 pointer-events-none hidden lg:block"
                  : ""
              }
            >
              <CardContent className="p-0">
                {/* هدر دسته */}
                <button
                  onClick={() =>
                    setActiveCat(activeCat === cat.id ? "" : cat.id)
                  }
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-right"
                >
                  <div className="p-2 rounded-xl bg-orange-100/70 dark:bg-orange-500/10">
                    <cat.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold">{cat.category}</h2>
                    <p className="text-xs text-muted-foreground">
                      {cat.items.length} اندپوینت
                    </p>
                  </div>
                  {activeCat === cat.id && !search ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* اندپوینت‌ها */}
                <div className="border-t divide-y">
                  {cat.items.map((item, idx) => {
                    const epId = `${cat.id}-${idx}`;
                    const isExpanded = expanded === epId;
                    return (
                      <div key={idx} className="transition-colors">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : epId)}
                          className="w-full p-4 hover:bg-muted/20 transition-colors text-right flex items-start gap-3"
                        >
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-md border shrink-0 mt-0.5 ${methodColors[item.method] || methodColors.GET}`}
                          >
                            {item.method}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-sm font-mono">
                                {item.path}
                              </code>
                              {item.auth && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 dark:text-amber-400 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5"
                                >
                                  Auth
                                </Badge>
                              )}
                              {item.role && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${roleColor[item.role] || ""}`}
                                >
                                  {roleLabels[item.role] || item.role}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <ChevronLeft
                            className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </button>

                        {isExpanded && (
                          <div
                            className="px-4 pb-4 space-y-3 bg-muted/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* زبان‌ها + Try It */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex gap-1 bg-muted rounded-lg p-1">
                                {(["curl", "js", "python"] as const).map(
                                  (l) => (
                                    <button
                                      key={l}
                                      onClick={() => setLang(l)}
                                      className={`px-3 py-1 text-xs rounded-md transition-all ${lang === l ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                      {l === "js"
                                        ? "JavaScript"
                                        : l === "python"
                                          ? "Python"
                                          : "cURL"}
                                    </button>
                                  ),
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => tryIt(item)}
                                disabled={tryLoading}
                                className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-xs h-8"
                              >
                                {tryLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}{" "}
                                ارسال درخواست
                              </Button>
                            </div>

                            {/* کد */}
                            <div className="relative group">
                              <pre
                                className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs leading-relaxed"
                                dir="ltr"
                              >
                                <code className="whitespace-pre">
                                  {lang === "curl"
                                    ? langTemplates.curl(
                                        item.method,
                                        item.path,
                                        item.auth,
                                        item.body,
                                      )
                                    : lang === "js"
                                      ? langTemplates.js(
                                          item.method,
                                          item.path,
                                          item.auth,
                                          item.body,
                                        )
                                      : langTemplates.python(
                                          item.method,
                                          item.path,
                                          item.auth,
                                          item.body,
                                        )}
                                </code>
                              </pre>
                              <button
                                onClick={() =>
                                  copy(
                                    lang === "curl"
                                      ? langTemplates.curl(
                                          item.method,
                                          item.path,
                                          item.auth,
                                          item.body,
                                        )
                                      : lang === "js"
                                        ? langTemplates.js(
                                            item.method,
                                            item.path,
                                            item.auth,
                                            item.body,
                                          )
                                        : langTemplates.python(
                                            item.method,
                                            item.path,
                                            item.auth,
                                            item.body,
                                          ),
                                    epId,
                                  )
                                }
                                className="absolute top-2 left-2 p-1.5 rounded-md bg-gray-700/80 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
                              >
                                {copied === epId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* پارامترها */}
                            {item.params && (
                              <div>
                                <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> Query Parameters
                                </p>
                                <pre
                                  className="bg-muted p-3 rounded-lg text-xs"
                                  dir="ltr"
                                >
                                  <code>
                                    {JSON.stringify(item.params, null, 2)}
                                  </code>
                                </pre>
                              </div>
                            )}
                            {item.body && (
                              <div>
                                <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> Request Body
                                </p>
                                <pre
                                  className="bg-muted p-3 rounded-lg text-xs"
                                  dir="ltr"
                                >
                                  <code>
                                    {JSON.stringify(item.body, null, 2)}
                                  </code>
                                </pre>
                              </div>
                            )}

                            {/* پاسخ Try It */}
                            {tryResp && (
                              <div className="border rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span>Response</span>
                                    {tryResp.status >= 200 &&
                                      tryResp.status < 300 && (
                                        <span className="flex items-center gap-1 text-emerald-600">
                                          <CheckCircle2 className="w-3 h-3" />{" "}
                                          {tryResp.status}
                                        </span>
                                      )}
                                    {tryResp.status >= 400 && (
                                      <span className="flex items-center gap-1 text-red-600">
                                        <XCircle className="w-3 h-3" />{" "}
                                        {tryResp.status}
                                      </span>
                                    )}
                                    {tryResp.status === 0 && (
                                      <span className="flex items-center gap-1 text-red-600">
                                        <AlertCircle className="w-3 h-3" />{" "}
                                        Network Error
                                      </span>
                                    )}
                                    <span className="text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />{" "}
                                      {tryResp.time}ms
                                    </span>
                                  </div>
                                </div>
                                <pre
                                  className="bg-gray-900 text-gray-100 p-4 text-xs overflow-x-auto max-h-64"
                                  dir="ltr"
                                >
                                  <code>
                                    {JSON.stringify(tryResp.data, null, 2)}
                                  </code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
