"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoCard, InfoCardStatic } from "@/components/ui/info-card";
import {
  Crown,
  Users,
  Shield,
  FileText,
  TrendingUp,
  Eye,
  Activity,
  Database,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import axios from "@/services/api/client";

// ─── تایپ پاسخ API داشبورد ──────────────────────────
interface DashboardData {
  totalUsers: number;
  totalAdmins: number;
  totalAds: number;
  totalViews: number;
  totalProperties: number;
  pendingAds: number;
  pendingProperties: number;
  serverUptime: string;
  databaseSize: string;
  monthlyGrowth: number;
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/super-admin/dashboard");
      if (data.success) {
        setStats(data.data);
      } else {
        setError("داده‌ای دریافت نشد");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError("خطا در دریافت آمار");
      toast.error("خطا در دریافت آمار از سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success("آمار به‌روزرسانی شد");
  };

  // ================== Loading state ==================
  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // ================== Error state ==================
  if (error && !stats) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-4"
        dir="rtl"
      >
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-muted-foreground font-medium">
          متأسفانه اطلاعات بارگذاری نشد.
        </p>
        <Button
          onClick={fetchStats}
          variant="outline"
          className="gap-2 rounded-xl"
        >
          <RefreshCw className="w-4 h-4" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  // ================== Normal state ==================
  return (
    <div className="space-y-6" dir="rtl">
      {/* ========== Header ========== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-md transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                داشبورد مدیر ارشد
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مدیریت کامل سیستم و نظارت بر تمام بخش‌ها
              </p>
            </div>
          </div>
          <Badge className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20">
            <Crown className="w-3.5 h-3.5" />
            مدیر ارشد
          </Badge>
        </div>
      </div>

      {/* ========== Stats Cards (قابل کلیک) ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/panel/super-admin/users">
            <InfoCardStatic
              icon={<Users className="w-5 h-5" />}
              title="کل کاربران"
              value={(stats?.totalUsers ?? 0).toLocaleString()}
            />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/panel/super-admin/admins">
            <InfoCardStatic
              icon={<Shield className="w-5 h-5" />}
              title="مدیران سیستم"
              value={(stats?.totalAdmins ?? 0).toLocaleString()}
            />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/panel/super-admin/ads">
            <InfoCardStatic
              icon={<FileText className="w-5 h-5" />}
              title="کل آگهی‌ها"
              value={(stats?.totalAds ?? 0).toLocaleString()}
            />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/panel/super-admin/market-analysis">
            <InfoCardStatic
              icon={<Eye className="w-5 h-5" />}
              title="کل بازدیدها"
              value={(stats?.totalViews ?? 0).toLocaleString()}
            />
          </Link>
        </motion.div>
      </div>

      {/* ========== System Stats (قابل کلیک) ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/panel/super-admin/ads?status=pending">
            <InfoCardStatic
              icon={<Activity className="w-5 h-5" />}
              title="آگهی‌های در انتظار"
              value={(stats?.pendingAds ?? 0).toLocaleString()}
              subtitle="نیاز به بررسی"
            />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/panel/super-admin/properties?status=pending">
            <InfoCardStatic
              icon={<Database className="w-5 h-5" />}
              title="املاک در انتظار"
              value={(stats?.pendingProperties ?? 0).toLocaleString()}
              subtitle="نیاز به تأیید"
            />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link href="/panel/super-admin/market-analysis">
            <InfoCardStatic
              icon={<TrendingUp className="w-5 h-5" />}
              title="رشد ماهانه"
              value={`${stats?.monthlyGrowth ?? 0}%`}
              subtitle={
                stats?.monthlyGrowth !== undefined
                  ? `${stats.monthlyGrowth >= 0 ? "▲" : "▼"} ${Math.abs(stats.monthlyGrowth)}% نسبت به ماه قبل`
                  : undefined
              }
            />
          </Link>
        </motion.div>
      </div>

      {/* ========== Quick Links (از قبل لینک دارند) ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            href: "/panel/super-admin/admins",
            icon: Shield,
            title: "مدیریت ادمین‌ها",
            desc: "افزودن/حذف ادمین‌ها",
          },
          {
            href: "/panel/super-admin/users",
            icon: Users,
            title: "مدیریت کاربران",
            desc: "مدیریت تمام کاربران",
          },
          {
            href: "/panel/super-admin/ads",
            icon: FileText,
            title: "مدیریت آگهی‌ها",
            desc: "بررسی و مدیریت آگهی‌ها",
          },
          {
            href: "/panel/super-admin/backup",
            icon: Database,
            title: "پشتیبان‌گیری",
            desc: "مدیریت پشتیبان‌ها",
          },
        ].map((link, index) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
          >
            <InfoCard
              icon={<link.icon className="w-5 h-5" />}
              title={link.title}
              description={link.desc}
              href={link.href}
            />
          </motion.div>
        ))}
      </div>

      {/* ========== System Info ========== */}
      <Card className="transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent shadow-md hover:shadow-lg border-border/50">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-2">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Database className="w-4 h-4" />
            </div>
            اطلاعات سرور
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-primary gap-1 rounded-xl text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            به‌روزرسانی
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              {[
                ["آپ تایم سرور", stats?.serverUptime ?? "—"],
                ["حجم دیتابیس", stats?.databaseSize ?? "—"],
                [
                  "کل املاک ثبت شده",
                  (stats?.totalProperties ?? 0).toLocaleString(),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between py-2 border-b border-border/30 last:border-0"
                >
                  <span className="text-muted-foreground text-sm">
                    {label}:
                  </span>
                  <span className="font-medium text-sm">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                ["وضعیت دیتابیس", "● فعال", "text-green-500"],
                ["وضعیت API", "● فعال", "text-green-500"],
                [
                  "آخرین به‌روزرسانی",
                  new Date().toLocaleTimeString("fa-IR"),
                  "",
                ],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="flex justify-between py-2 border-b border-border/30 last:border-0"
                >
                  <span className="text-muted-foreground text-sm">
                    {label}:
                  </span>
                  <span className={`font-medium text-sm ${color}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
