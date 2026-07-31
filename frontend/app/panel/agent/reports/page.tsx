"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Building,
  Eye,
  Users,
  DollarSign,
  TrendingUp,
  Home,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { agentApi, AgentStats } from "@/services/api/agent.api";
import { InfoCardStatic } from "@/components/ui/info-card";

const defaultStats: AgentStats = {
  properties: { total: 0, active: 0, sold: 0, pending: 0, expired: 0 },
  views: { total: 0, averagePerProperty: 0 },
  leads: { total: 0, new: 0, converted: 0, conversionRate: 0 },
  revenue: { total: 0, commission: 0, averagePerSale: 0 },
  topProperties: [],
};

export default function AgentReportsPage() {
  const [stats, setStats] = useState<AgentStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await agentApi.getStats();
      setStats({
        properties: {
          total: data?.properties?.total ?? 0,
          active: data?.properties?.active ?? 0,
          sold: data?.properties?.sold ?? 0,
          pending: data?.properties?.pending ?? 0,
          expired: data?.properties?.expired ?? 0,
        },
        views: {
          total: data?.views?.total ?? 0,
          averagePerProperty: data?.views?.averagePerProperty ?? 0,
        },
        leads: {
          total: data?.leads?.total ?? 0,
          new: data?.leads?.new ?? 0,
          converted: data?.leads?.converted ?? 0,
          conversionRate: data?.leads?.conversionRate ?? 0,
        },
        revenue: {
          total: data?.revenue?.total ?? 0,
          commission: data?.revenue?.commission ?? 0,
          averagePerSale: data?.revenue?.averagePerSale ?? 0,
        },
        topProperties: data?.topProperties ?? [],
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      toast.error(error?.response?.data?.error || "خطا در دریافت آمار");
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success("آمار به‌روزرسانی شد");
  };

  const handleGenerateReport = async () => {
    setRefreshing(true); // اگر state دارید
    try {
      const response = await agentApi.generateDailyReport();
      console.log("Report saved:", response);
      toast.success("گزارش ذخیره شد");
    } catch (error: any) {
      console.error("Generate report error:", error);
      toast.error(error?.response?.data?.message || "خطا");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadExcel = () => {
    setDownloadingExcel(true);
    try {
      agentApi.downloadReportExcel();
      toast.success("فایل Excel دانلود شد");
    } catch (error) {
      toast.error("خطا در دانلود Excel");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPDF = () => {
    setDownloadingPDF(true);
    try {
      agentApi.downloadReportPDF();
      toast.success("PDF دانلود شد");
    } catch (error) {
      toast.error("خطا در دانلود PDF");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header با تم نارنجی */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10 shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                گزارشات آژانس
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                آمار و گزارشات عملکرد املاک و فروش
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className="gap-2 text-green-600 border-green-300 hover:bg-green-50 rounded-xl"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {downloadingExcel ? "..." : "Excel"}
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl"
            >
              <FileText className="w-4 h-4" />
              {downloadingPDF ? "..." : "PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateReport}
              className="gap-2 rounded-xl"
            >
              <Download className="w-4 h-4" />
              ذخیره گزارش
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              بروزرسانی
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards با InfoCardStatic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InfoCardStatic
            icon={<Building className="w-5 h-5" />}
            title="کل املاک"
            value={stats.properties.total.toLocaleString("fa-IR")}
            subtitle={`${stats.properties.active} فعال | ${stats.properties.sold} فروش رفته`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InfoCardStatic
            icon={<Eye className="w-5 h-5" />}
            title="کل بازدیدها"
            value={stats.views.total.toLocaleString("fa-IR")}
            subtitle={`میانگین ${stats.views.averagePerProperty} بازدید در هر ملک`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <InfoCardStatic
            icon={<Users className="w-5 h-5" />}
            title="لیدها"
            value={stats.leads.total.toLocaleString("fa-IR")}
            subtitle={`${stats.leads.converted} تبدیل شده (${stats.leads.conversionRate}%)`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <InfoCardStatic
            icon={<DollarSign className="w-5 h-5" />}
            title="درآمد"
            value={formatCurrency(stats.revenue.total)}
            subtitle={`کمیسیون: ${formatCurrency(stats.revenue.commission)}`}
          />
        </motion.div>
      </div>

      {/* وضعیت املاک + آمار لیدها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent shadow-md border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <Home className="w-4 h-4" />
              </div>
              وضعیت املاک
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  icon: CheckCircle,
                  color: "text-green-500",
                  label: "فعال",
                  value: stats.properties.active,
                },
                {
                  icon: Clock,
                  color: "text-yellow-500",
                  label: "در انتظار",
                  value: stats.properties.pending,
                },
                {
                  icon: XCircle,
                  color: "text-red-500",
                  label: "فروش رفته",
                  value: stats.properties.sold,
                },
                {
                  icon: Clock,
                  color: "text-gray-500",
                  label: "منقضی",
                  value: stats.properties.expired,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center"
                >
                  <span className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />{" "}
                    {item.label}
                  </span>
                  <span className="font-bold">
                    {item.value.toLocaleString("fa-IR")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent shadow-md border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              آمار لیدها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "کل لیدها", value: stats.leads.total },
                {
                  label: "لیدهای جدید",
                  value: stats.leads.new,
                  color: "text-blue-500",
                },
                {
                  label: "لیدهای تبدیل شده",
                  value: stats.leads.converted,
                  color: "text-green-500",
                },
                {
                  label: "نرخ تبدیل",
                  value: `${stats.leads.conversionRate}%`,
                  color: "text-amber-500",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center"
                >
                  <span>{item.label}</span>
                  <span className={`font-bold ${item.color || ""}`}>
                    {item.value.toLocaleString?.("fa-IR") ?? item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* املاک برتر */}
      <Card className="transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            املاک برتر (بیشترین بازدید)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topProperties.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              هیچ ملکی وجود ندارد
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topProperties.map((property, index) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{property.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {property.views.toLocaleString("fa-IR")} بازدید
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      property.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : property.status === "sold"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {property.status === "active"
                      ? "فعال"
                      : property.status === "sold"
                        ? "فروش رفته"
                        : "در انتظار"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* درآمد و کمیسیون */}
      <Card className="transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent shadow-md border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل درآمد</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(stats.revenue.total)}
                </p>
              </div>
            </div>
            <div className="h-12 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کمیسیون دریافتی</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(stats.revenue.commission)}
                </p>
              </div>
            </div>
            <div className="h-12 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  میانگین فروش هر ملک
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(Math.round(stats.revenue.averagePerSale))}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
