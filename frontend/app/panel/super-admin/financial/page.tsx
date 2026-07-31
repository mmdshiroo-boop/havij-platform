"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "@/services/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpLeft,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { InfoCardStatic } from "@/components/ui/info-card";
import { cn } from "@/lib/utils";

interface FinancialSummary {
  totalRevenue: number;
  todayRevenue: number;
  thisMonthRevenue: number;
  chartData: { month: string; revenue: number; count: number }[];
  recentTransactions: any[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value) + " تومان";

// ─── کانفیگ وضعیت تراکنش‌ها (بدون بک‌گراند کدر - شفاف و شیک) ─────
const trxStatusConfig: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  success: {
    label: "موفق",
    className:
      "bg-transparent border-emerald-500/60 text-emerald-600 dark:text-emerald-400 font-medium",
    icon: (
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    ),
  },
  failed: {
    label: "ناموفق",
    className:
      "bg-transparent border-rose-500/60 text-rose-600 dark:text-rose-400 font-medium",
    icon: <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
  },
  pending: {
    label: "در انتظار",
    className:
      "bg-transparent border-amber-500/60 text-amber-600 dark:text-amber-400 font-medium",
    icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
  },
};

// ─── کانفیگ نوع تراکنش‌ها ───────────────────────────
const trxTypeConfig: Record<string, { label: string; className: string }> = {
  subscription: {
    label: "اشتراک",
    className:
      "bg-transparent border-blue-500/50 text-blue-600 dark:text-blue-400 font-medium",
  },
  vip: {
    label: "ارتقا VIP",
    className:
      "bg-transparent border-purple-500/50 text-purple-600 dark:text-purple-400 font-medium",
  },
  other: {
    label: "سایر",
    className:
      "bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium",
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border/80 rounded-xl p-3.5 shadow-xl text-right">
        <p className="font-bold text-xs text-foreground mb-1.5">{label}</p>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-primary flex items-center justify-between gap-3">
            <span>درآمد:</span>
            <span className="font-mono">
              {formatCurrency(payload[0].value)}
            </span>
          </p>
          {payload[0].payload.count !== undefined && (
            <p className="text-[11px] text-muted-foreground flex items-center justify-between gap-3">
              <span>تعداد تراکنش:</span>
              <span className="font-mono">
                {payload[0].payload.count.toLocaleString("fa-IR")}
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function FinancialPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/super-admin/financial/summary");
      if (data.success) setSummary(data.data);
      else toast.error("خطا در دریافت گزارش مالی");
    } catch {
      toast.error("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-6 w-full" dir="rtl">
      {/* هدر صفحه */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 border border-primary/10 shadow-sm">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20 shrink-0">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                گزارش‌های مالی
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                بررسی درآمد حاصل از فروش اشتراک‌ها و ارتقای حسابت‌ها
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={loading}
            className="gap-2 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            به‌روزرسانی
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-36" />
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </Card>
        </div>
      ) : summary ? (
        <>
          {/* کارت‌های آمار اصلی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <InfoCardStatic
                icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
                title="کل درآمد"
                value={formatCurrency(summary.totalRevenue)}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <InfoCardStatic
                icon={<DollarSign className="w-5 h-5 text-blue-500" />}
                title="درآمد امروز"
                value={formatCurrency(summary.todayRevenue)}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <InfoCardStatic
                icon={<ShoppingCart className="w-5 h-5 text-purple-500" />}
                title="درآمد این ماه"
                value={formatCurrency(summary.thisMonthRevenue)}
              />
            </motion.div>
          </div>

          {/* نمودار روند درآمد */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  روند درآمد ماهانه
                </div>
                <span className="text-xs font-normal text-muted-foreground hidden sm:inline-block">
                  نمایش مقایسه‌ای فروش بر اساس ماه
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={summary.chartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) =>
                        val >= 1000000
                          ? `${(val / 1000000).toFixed(0)} میلیون`
                          : `${(val / 1000).toFixed(0)} هزار`
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      dot={{ r: 3, strokeWidth: 1.5, fill: "#fff" }}
                      activeDot={{
                        r: 5,
                        stroke: "hsl(var(--primary))",
                        strokeWidth: 2,
                        fill: "#fff",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* جدول تراکنش‌ها */}
          <Card className="shadow-sm border-border/60 overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  آخرین تراکنش‌ها
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {summary.recentTransactions.length.toLocaleString("fa-IR")}{" "}
                  تراکنش اخیر
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-right whitespace-nowrap">
                        کاربر
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        مبلغ
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        نوع پرداختی
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        وضعیت
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        تاریخ
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-12 text-muted-foreground text-sm"
                        >
                          تراکنشی یافت نشد.
                        </TableCell>
                      </TableRow>
                    ) : (
                      summary.recentTransactions.map((trx: any) => {
                        const status =
                          trxStatusConfig[trx.status] ||
                          trxStatusConfig["pending"];
                        const type =
                          trxTypeConfig[trx.type] || trxTypeConfig["other"];

                        return (
                          <TableRow
                            key={trx._id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-medium text-xs sm:text-sm text-foreground">
                                  {trx.userId
                                    ? `${trx.userId.firstName || ""} ${trx.userId.lastName || ""}`.trim() ||
                                      "کاربر کاربر"
                                    : "کاربر ناشناس"}
                                </span>
                                {trx.userId?.phone && (
                                  <span className="text-[11px] text-muted-foreground font-mono dir-ltr text-right mt-0.5">
                                    {trx.userId.phone}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="whitespace-nowrap font-mono font-semibold text-sm">
                              {formatCurrency(trx.amount)}
                            </TableCell>

                            <TableCell className="whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[11px] px-2.5 py-0.5 border",
                                  type.className,
                                )}
                              >
                                {type.label}
                              </Badge>
                            </TableCell>

                            <TableCell className="whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[11px] px-2.5 py-0.5 gap-1 border",
                                  status.className,
                                )}
                              >
                                {status.icon}
                                {status.label}
                              </Badge>
                            </TableCell>

                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-mono">
                              {new Date(trx.createdAt).toLocaleDateString(
                                "fa-IR",
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm mb-4">
            اطلاعات گزارش مالی دریافت نشد.
          </p>
          <Button variant="outline" size="sm" onClick={fetchSummary}>
            تلاش مجدد
          </Button>
        </div>
      )}
    </div>
  );
}
