// app/panel/super-admin/graph/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Network,
  RefreshCw,
  Users,
  FileText,
  MessageCircle,
  Bookmark,
  Maximize2,
  Minimize2,
  X,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Search,
  Layers,
  Phone,
  Info,
  Filter,
  MousePointer,
  Globe,
  UserCheck,
  Sparkles,
} from "lucide-react";
import apiClient from "@/services/api/client";

// جلوگیری از خطای SSR در eCharts
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

/* ================= TYPES ================= */
interface GraphNode {
  id: string;
  name: string;
  type: string;
  category?: number;
  symbolSize?: number;
  itemStyle?: { color: string; borderColor?: string; borderWidth?: number };
  role?: string;
  phone?: string;
  ip?: string;
  [key: string]: any;
}

interface GraphEdge {
  source: string;
  target: string;
  value?: number;
  label?: any;
  lineStyle?: any;
}

interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  categories?: { name: string }[];
  stats?: Record<string, number>;
}

/* ================= CONSTANTS & COLOR MAPPER ================= */
const NODE_TYPE_MAP: Record<
  string,
  { label: string; bg: string; border: string; icon: any }
> = {
  user: {
    label: "کاربر",
    bg: "hsl(217, 91%, 60%)",
    border: "hsl(217, 91%, 75%)",
    icon: UserCheck,
  },
  ad: {
    label: "آگهی",
    bg: "hsl(142, 71%, 45%)",
    border: "hsl(142, 71%, 65%)",
    icon: FileText,
  },
  ip: {
    label: "آی‌پی مشکوک",
    bg: "hsl(0, 84%, 60%)",
    border: "hsl(0, 84%, 75%)",
    icon: Globe,
  },
  default: {
    label: "سایر",
    bg: "hsl(262, 83%, 58%)",
    border: "hsl(262, 83%, 75%)",
    icon: Layers,
  },
};

/* ================= THEME CONFIG ================= */
function useThemeDetector() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();

    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => obs.disconnect();
  }, []);

  return isDark;
}

function getEChartsThemeConfig(isDark: boolean) {
  return {
    text: isDark ? "hsl(0, 0%, 95%)" : "hsl(240, 10%, 15%)",
    textSub: isDark ? "hsl(240, 5%, 65%)" : "hsl(240, 4%, 40%)",
    tooltipBg: isDark ? "rgba(18, 18, 20, 0.92)" : "rgba(255, 255, 255, 0.95)",
    tooltipBorder: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
    tooltipText: isDark ? "hsl(0, 0%, 98%)" : "hsl(240, 10%, 10%)",
    lineColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
    activeLineColor: "hsl(var(--primary))",
  };
}

function networkOption(
  data: GraphResponse,
  isDark: boolean,
  filteredNodes: GraphNode[],
  filteredEdges: GraphEdge[],
) {
  const tc = getEChartsThemeConfig(isDark);

  const formattedNodes = filteredNodes.map((node) => {
    const config = NODE_TYPE_MAP[node.type] || NODE_TYPE_MAP.default;
    return {
      ...node,
      symbolSize:
        node.symbolSize ||
        (node.type === "user" ? 38 : node.type === "ad" ? 30 : 26),
      itemStyle: node.itemStyle || {
        color: config.bg,
        borderColor: config.border,
        borderWidth: 2,
        shadowBlur: 8,
        shadowColor: "rgba(0, 0, 0, 0.15)",
      },
    };
  });

  return {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily: "Vazirmatn, system-ui, sans-serif",
      color: tc.textSub,
    },
    tooltip: {
      trigger: "item",
      backgroundColor: tc.tooltipBg,
      borderColor: tc.tooltipBorder,
      borderWidth: 1,
      padding: [12, 16],
      borderRadius: 14,
      shadowBlur: 20,
      shadowColor: "rgba(0, 0, 0, 0.2)",
      textStyle: {
        color: tc.tooltipText,
        fontSize: 12,
        fontFamily: "Vazirmatn, sans-serif",
      },
      formatter: (params: any) => {
        if (params.dataType === "node") {
          const node = params.data as GraphNode;
          const config = NODE_TYPE_MAP[node.type] || NODE_TYPE_MAP.default;
          return `
            <div style="direction: rtl; font-family: Vazirmatn, sans-serif;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${config.bg}"></span>
                <strong style="font-size: 14px;">${node.name}</strong>
              </div>
              <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">
                نوع: <span style="font-weight: 600;">${config.label}</span>
              </div>
              ${node.phone ? `<div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">شماره: <span dir="ltr">${node.phone}</span></div>` : ""}
              <div style="font-size: 10px; margin-top: 8px; color: hsl(var(--primary));">برای مشاهده جزئیات کلیک کنید</div>
            </div>
          `;
        }
        if (params.dataType === "edge") {
          const edge = params.data as GraphEdge;
          return `
            <div style="direction: rtl; font-family: Vazirmatn, sans-serif; font-size: 12px;">
              ارتباط بین: <strong>${edge.source}</strong> ↔ <strong>${edge.target}</strong>
            </div>
          `;
        }
        return "";
      },
    },
    animationDuration: 1200,
    animationEasingUpdate: "quinticInOut",
    legend: {
      data: data.categories?.map((cat) => cat.name) || [
        "کاربر",
        "آگهی",
        "آی‌پی مشکوک",
      ],
      bottom: 12,
      textStyle: { color: tc.textSub, fontSize: 12 },
      itemGap: 20,
      icon: "circle",
    },
    series: [
      {
        type: "graph",
        layout: "force",
        animation: true,
        draggable: true,
        roam: true,
        categories: data.categories || [],
        data: formattedNodes,
        links: filteredEdges,
        label: {
          show: true,
          position: "right",
          formatter: (p: any) => p.data?.name || "",
          fontSize: 11,
          color: tc.textSub,
          distance: 6,
        },
        force: {
          repulsion: 380,
          edgeLength: [80, 220],
          gravity: 0.08,
          friction: 0.5,
        },
        lineStyle: {
          width: 1.5,
          curveness: 0.15,
          color: tc.lineColor,
          opacity: 0.7,
        },
        emphasis: {
          focus: "adjacency",
          lineStyle: { width: 3.5, color: tc.activeLineColor, opacity: 1 },
          label: {
            show: true,
            fontSize: 12,
            fontWeight: "bold",
            color: tc.text,
          },
        },
      },
    ],
  };
}

/* ================= COMPONENTS ================= */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  accentBg,
}: {
  icon: any;
  label: string;
  value: number;
  color?: string;
  accentBg?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur-md text-card-foreground p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 group">
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 group-hover:opacity-25 blur-2xl transition-opacity pointer-events-none"
        style={{ backgroundColor: color || "hsl(var(--primary))" }}
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p
            className="text-2xl font-black text-card-foreground tracking-tight"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {value !== undefined ? value.toLocaleString("fa-IR") : "۰"}
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-inner"
          style={{
            backgroundColor: accentBg || "hsl(var(--primary) / 0.12)",
            color: color || "hsl(var(--primary))",
          }}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function NodeDetailPanel({
  node,
  onClose,
}: {
  node: GraphNode | null;
  onClose: () => void;
}) {
  if (!node) return null;
  const config = NODE_TYPE_MAP[node.type] || NODE_TYPE_MAP.default;
  const IconComponent = config.icon;

  return (
    <div className="absolute right-4 top-4 z-20 w-80 max-w-[calc(100%-2rem)] bg-card/90 backdrop-blur-xl text-card-foreground rounded-2xl border border-border shadow-2xl p-5 animate-in fade-in slide-in-from-right-4 transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm"
            style={{ backgroundColor: config.bg }}
          >
            <IconComponent size={16} />
          </div>
          <h3 className="font-bold text-base truncate">{node.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg transition-colors shrink-0"
          title="بستن"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/30">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Layers size={14} className="text-primary" /> نوع موجودیت
          </span>
          <span className="font-semibold text-foreground">{config.label}</span>
        </div>

        {node.phone && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Phone size={14} className="text-primary" /> شماره تماس
            </span>
            <span className="font-mono font-medium text-foreground" dir="ltr">
              {node.phone}
            </span>
          </div>
        )}

        {node.ip && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Globe size={14} className="text-primary" /> آدرس آی‌پی
            </span>
            <span className="font-mono font-medium text-foreground" dir="ltr">
              {node.ip}
            </span>
          </div>
        )}

        {node.role && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <UserCheck size={14} className="text-primary" /> نقش
            </span>
            <span className="font-medium text-foreground">{node.role}</span>
          </div>
        )}

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/30">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" /> شناسه گره
          </span>
          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
            {node.id}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function SuperAdminGraphPage() {
  const isDark = useThemeDetector();
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/graph/network");
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || "داده‌ای از سرور دریافت نشد.");
      }
    } catch (err: any) {
      console.error("Graph Fetch Error:", err);
      setError(
        err.response?.data?.message ||
          "خطا در ارتباط با سرور. لطفاً وضعیت API را بررسی کنید.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // فیلتر کردن بر اساس نوع موجودیت
  const { filteredNodes, filteredEdges } = useMemo(() => {
    if (!data) return { filteredNodes: [], filteredEdges: [] };
    const nodes =
      typeFilter === "all"
        ? data.nodes
        : data.nodes.filter((n) => n.type === typeFilter);

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = data.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
    );

    return { filteredNodes: nodes, filteredEdges: edges };
  }, [data, typeFilter]);

  // فیلتر کردن بر اساس جستجو
  const displayedData = useMemo(() => {
    if (!data || !search.trim()) {
      return { nodes: filteredNodes, edges: filteredEdges };
    }

    const q = search.toLowerCase().trim();
    const matchedIds = new Set(
      filteredNodes
        .filter(
          (n) =>
            n.name?.toLowerCase().includes(q) ||
            n.phone?.toLowerCase().includes(q) ||
            n.ip?.toLowerCase().includes(q),
        )
        .map((n) => n.id),
    );

    return {
      nodes: filteredNodes.filter((n) => matchedIds.has(n.id)),
      edges: filteredEdges.filter(
        (e) => matchedIds.has(e.source) && matchedIds.has(e.target),
      ),
    };
  }, [filteredNodes, filteredEdges, search]);

  const wrapperClass = fullscreen
    ? "fixed inset-0 z-[100] bg-background text-foreground overflow-hidden flex flex-col p-4"
    : "min-h-screen bg-background text-foreground transition-colors duration-300 font-[Vazirmatn]";

  const containerClass = fullscreen
    ? "flex-1 w-full h-full flex flex-col gap-4"
    : "relative max-w-[1536px] mx-auto px-4 sm:px-6 py-6 space-y-6";

  const graphBoxHeight = fullscreen
    ? "flex-1 w-full min-h-[500px]"
    : "h-[calc(100vh-340px)] min-h-[550px]";

  return (
    <div className={wrapperClass} dir="rtl">
      <div className={containerClass}>
        {/* هدر اصلی */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-sm shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/25 shrink-0">
              <Network size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight">
                  گراف شبکه ارتباطات
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-full">
                  زنده
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                تحلیل هوشمند و ساختاری ارتباط کاربران، آگهی‌ها و آی‌پی‌های شبکه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/50 rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin text-primary" : ""}
              />
              <span>بروزرسانی</span>
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground bg-muted/80 hover:bg-muted border border-border/50 rounded-xl transition-all active:scale-95"
            >
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{fullscreen ? "خروج از تمام صفحه" : "تمام‌صفحه"}</span>
            </button>
          </div>
        </div>

        {/* کارت‌های آمار شبکه */}
        {data?.stats && !fullscreen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <StatCard
              icon={Users}
              label="تعداد کاربران"
              value={data.stats.totalUsers || 0}
              color="hsl(217, 91%, 60%)"
              accentBg="hsl(217, 91%, 60%, 0.12)"
            />
            <StatCard
              icon={FileText}
              label="کل آگهی‌ها"
              value={data.stats.totalAds || 0}
              color="hsl(142, 71%, 45%)"
              accentBg="hsl(142, 71%, 45%, 0.12)"
            />
            <StatCard
              icon={ShieldAlert}
              label="IPهای مشکوک"
              value={data.stats.totalSuspiciousIPs || 0}
              color="hsl(0, 84%, 60%)"
              accentBg="hsl(0, 84%, 60%, 0.12)"
            />
            <StatCard
              icon={MessageCircle}
              label="ارتباطات چت"
              value={data.stats.totalChatEdges || 0}
              color="hsl(262, 83%, 58%)"
              accentBg="hsl(262, 83%, 58%, 0.12)"
            />
            <StatCard
              icon={Bookmark}
              label="ذخیره‌سازی‌ها"
              value={data.stats.totalSaveEdges || 0}
              color="hsl(38, 92%, 50%)"
              accentBg="hsl(38, 92%, 50%, 0.12)"
            />
          </div>
        )}

        {/* نوار فیلتر و ابزارها */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="جستجوی نام، تلفن یا آی‌پی..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-xl bg-card border border-border text-foreground pr-10 pl-8 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/70"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 rounded-xl bg-card border border-border text-foreground pr-9 pl-4 text-xs focus:outline-none focus:border-primary cursor-pointer appearance-none transition-all font-medium"
                >
                  <option value="all">همه موجودیت‌ها</option>
                  <option value="user">فقط کاربران</option>
                  <option value="ad">فقط آگهی‌ها</option>
                  <option value="ip">فقط IPهای مشکوک</option>
                </select>
                <Filter
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>

              <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted/60 rounded-lg">
                {displayedData.nodes.length.toLocaleString("fa-IR")} گره
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border/40 px-3 py-2 rounded-xl">
            <MousePointer size={14} className="text-primary shrink-0" />
            <span>اسکرول: زوم | درگ: جابجایی | کلیک: انتخاب گره</span>
          </div>
        </div>

        {/* محیط اصلی نمایش گراف */}
        <div
          className={`relative rounded-2xl bg-card border border-border overflow-hidden shadow-sm transition-all ${graphBoxHeight}`}
        >
          {/* پنل اطلاعات گره انتخاب‌شده */}
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />

          {/* حالت لودینگ */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-md z-30 animate-in fade-in">
              <div className="p-6 rounded-2xl bg-card border border-border shadow-2xl flex flex-col items-center text-center max-w-xs">
                <Loader2 size={36} className="animate-spin text-primary mb-3" />
                <p className="text-sm font-bold text-foreground">
                  در حال بارگذاری گراف شبکه...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  شبیه‌سازی و پردازش گره‌های مرتبط
                </p>
              </div>
            </div>
          )}

          {/* حالت خطا */}
          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-30 p-4">
              <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 flex flex-col items-center max-w-sm text-center">
                <AlertTriangle size={42} className="text-destructive mb-3" />
                <h3 className="text-base font-bold text-destructive mb-1">
                  خطا در بارگذاری داده‌ها
                </h3>
                <p className="text-xs text-destructive/80 mb-5">{error}</p>
                <button
                  onClick={fetchData}
                  className="px-5 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          )}

          {/* کامپوننت چارت */}
          {data && !loading && !error && displayedData.nodes.length > 0 && (
            <ReactECharts
              option={networkOption(
                data,
                isDark,
                displayedData.nodes,
                displayedData.edges,
              )}
              style={{ height: "100%", width: "100%" }}
              notMerge
              lazyUpdate
              onEvents={{
                click: (params: any) => {
                  if (params?.dataType === "node" && params?.data) {
                    setSelectedNode(params.data as GraphNode);
                  }
                },
              }}
            />
          )}

          {/* حالت نتیجه خالی */}
          {data && !loading && !error && displayedData.nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground mb-3">
                <Search size={28} />
              </div>
              <p className="text-sm font-bold text-foreground">
                هیچ گرهی یافت نشد!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                عبارت جستجو یا فیلتر انتخابی خود را تغییر دهید.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
