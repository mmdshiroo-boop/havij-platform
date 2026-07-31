// @/components/cookie-ui/AdminGraphPanel.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Users,
  FileText,
  Globe,
  AlertTriangle,
  Shield,
  Activity,
  Network,
  Clock,
  Eye,
  Search,
  Filter,
  TrendingUp,
  UserPlus,
  LogIn,
  LogOut,
  FilePlus,
  FileSearch,
  AlertOctagon,
  Zap,
  BarChart3,
  CircleDot,
  MousePointerClick,
} from "lucide-react";

/* ============================================================
   تایپ‌های TypeScript
   ============================================================ */

export interface GraphNode {
  id: string;
  type: "user" | "ad" | "ip";
  label: string;
  detail: string;
  x?: number;
  y?: number;
  risk?: "low" | "medium" | "high";
}

export interface GraphEdge {
  from: string;
  to: string;
  type: "created" | "logged_from" | "accessed_from" | "shared_ip";
  weight: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: "login" | "ad_created" | "ad_viewed" | "suspicious" | "registered";
  details: string;
  ip?: string;
}

export interface IPStat {
  ip: string;
  userCount: number;
  adCount: number;
  status: "normal" | "suspect" | "blocked";
}

export interface AdminGraphPanelProps {
  usersData?: Omit<GraphNode, "x" | "y">[];
  adsData?: Omit<GraphNode, "x" | "y">[];
  ipsData?: Omit<GraphNode, "x" | "y">[];
  edgesData?: GraphEdge[];
  timelineData?: TimelineEvent[];
}

/* ============================================================
   داده‌های نمونه (در صورت عدم ارسال پروپس از بیرون)
   ============================================================ */
const CX = 420;
const CY = 310;

function circularPos(
  index: number,
  total: number,
  radius: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

// داده‌های پیش‌فرض دمو
const mockUsers: Omit<GraphNode, "x" | "y">[] = [
  {
    id: "u1",
    type: "user",
    label: "علی محمدی",
    detail: "کاربر عادی | عضویت: ۱۴۰۳/۰۱/۱۵",
    risk: "low",
  },
  {
    id: "u2",
    type: "user",
    label: "سارا احمدی",
    detail: "مشاور املاک | عضویت: ۱۴۰۲/۱۱/۰۸",
    risk: "low",
  },
  {
    id: "u5",
    type: "user",
    label: "حسین رضایی",
    detail: "کاربر عادی | عضویت: ۱۴۰۳/۰۴/۰۵",
    risk: "high",
  },
];

const mockAds: Omit<GraphNode, "x" | "y">[] = [
  {
    id: "a1",
    type: "ad",
    label: "آپارتمان ۱۲۰ متری ونک",
    detail: "قیمت: ۸۵۰۰ میلیون | وضعیت: فعال",
  },
  {
    id: "a2",
    type: "ad",
    label: "ویلای ۳۰۰ متری لواسان",
    detail: "قیمت: ۲۵,۰۰۰ میلیون | وضعیت: فعال",
  },
];

const mockIps: Omit<GraphNode, "x" | "y">[] = [
  {
    id: "ip1",
    type: "ip",
    label: "185.23.44.12",
    detail: "تهران | لوکیشن: شمال تهران",
    risk: "low",
  },
  {
    id: "ip5",
    type: "ip",
    label: "185.55.227.10",
    detail: "VPN | کشور ناشناس — مشکوک!",
    risk: "high",
  },
];

const mockEdges: GraphEdge[] = [
  { from: "u1", to: "a1", type: "created", weight: 1 },
  { from: "u2", to: "a2", type: "created", weight: 1 },
  { from: "u1", to: "ip1", type: "logged_from", weight: 15 },
  { from: "u5", to: "ip5", type: "logged_from", weight: 28 },
  { from: "ip1", to: "a1", type: "accessed_from", weight: 45 },
];

const mockTimeline: TimelineEvent[] = [
  {
    id: "te1",
    timestamp: "۱۴۰۳/۰۷/۱۵ — ۱۴:۳۲",
    userId: "u5",
    userName: "حسین رضایی",
    action: "suspicious",
    details: "تلاش برای ورود با VPN متعدد",
    ip: "185.55.227.10",
  },
  {
    id: "te2",
    timestamp: "۱۴۰۳/۰۷/۱۵ — ۱۴:۲۸",
    userId: "u2",
    userName: "سارا احمدی",
    action: "ad_created",
    details: "آگهی جدید: ویلای ۳۰۰ متری لواسان",
    ip: "91.98.112.55",
  },
];

/* ============================================================
   کامپوننت‌های کمکی
   ============================================================ */
function getTimelineStyle(action: TimelineEvent["action"]) {
  switch (action) {
    case "login":
      return {
        color: "bg-emerald-500",
        icon: <LogIn size={16} />,
        text: "ورود",
      };
    case "ad_created":
      return {
        color: "bg-orange-500",
        icon: <FilePlus size={16} />,
        text: "ثبت آگهی",
      };
    case "ad_viewed":
      return {
        color: "bg-teal-500",
        icon: <FileSearch size={16} />,
        text: "مشاهده آگهی",
      }; // جایگزین آبی
    case "suspicious":
      return {
        color: "bg-red-500",
        icon: <AlertOctagon size={16} />,
        text: "فعالیت مشکوک",
      };
    case "registered":
      return {
        color: "bg-purple-500",
        icon: <UserPlus size={16} />,
        text: "ثبت‌نام",
      };
    default:
      return {
        color: "bg-neutral-500",
        icon: <Activity size={16} />,
        text: "نامشخص",
      };
  }
}

function getEdgeStyle(
  edge: GraphEdge,
  highlighted: boolean,
  dimmed: boolean,
): React.CSSProperties {
  const base: React.CSSProperties = {};
  if (dimmed) {
    base.opacity = "0.1";
  } else if (highlighted) {
    base.opacity = "1";
  } else {
    base.opacity = "0.35";
  }

  switch (edge.type) {
    case "created":
      return {
        ...base,
        stroke: "#14b8a6",
        strokeWidth: highlighted ? 2.5 : 1.5,
      }; // فیروزه‌ای/Teal جایگزین آبی
    case "logged_from":
      return {
        ...base,
        stroke: "#22c55e",
        strokeWidth: highlighted ? 2.5 : 1.5,
        strokeDasharray: "8 4",
      };
    case "accessed_from":
      return {
        ...base,
        stroke: "#a855f7",
        strokeWidth: highlighted ? 2.5 : 1.5,
        strokeDasharray: "3 3",
      };
    case "shared_ip":
      return { ...base, stroke: "#ef4444", strokeWidth: highlighted ? 3 : 2 };
  }
}

function StatBadge({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border border-neutral-700/50 bg-neutral-800/40`}
    >
      <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
      <div>
        <div className="text-[11px] text-neutral-400 font-medium mb-0.5">
          {label}
        </div>
        <div className="text-lg font-bold text-neutral-100 leading-none">
          {value}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   کامپوننت اصلی: AdminGraphPanel
   ============================================================ */
export default function AdminGraphPanel({
  usersData = mockUsers,
  adsData = mockAds,
  ipsData = mockIps,
  edgesData = mockEdges,
  timelineData = mockTimeline,
}: AdminGraphPanelProps) {
  // استیت‌های تب‌ها و فیلترها
  const [activeTab, setActiveTab] = useState<"graph" | "stats" | "timeline">(
    "graph",
  );
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<
    TimelineEvent["action"] | "all"
  >("all");
  const [ipSearch, setIpSearch] = useState("");

  // تولید گره‌ها بصورت پویا از Propها
  const allNodes = useMemo(() => {
    const nodes: GraphNode[] = [];
    usersData.forEach((u, i) =>
      nodes.push({ ...u, ...circularPos(i, usersData.length, 220, CX, CY) }),
    );
    adsData.forEach((a, i) =>
      nodes.push({ ...a, ...circularPos(i, adsData.length, 145, CX, CY) }),
    );
    ipsData.forEach((ip, i) =>
      nodes.push({ ...ip, ...circularPos(i, ipsData.length, 280, CX, CY) }),
    );
    return nodes;
  }, [usersData, adsData, ipsData]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    allNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [allNodes]);

  // محاسبه یال‌های مرتبط
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selectedNode);
    edgesData.forEach((e) => {
      if (e.from === selectedNode) ids.add(e.to);
      if (e.to === selectedNode) ids.add(e.from);
    });
    return ids;
  }, [selectedNode, edgesData]);

  // محاسبه آمار پویا برای پنل
  const summaryStats = useMemo(() => {
    const sharedIPUsers = new Set<string>();
    edgesData.forEach((e) => {
      if (e.type === "shared_ip") {
        sharedIPUsers.add(e.from);
        sharedIPUsers.add(e.to);
      }
    });
    return {
      totalUsers: usersData.length,
      activeAds: adsData.length,
      suspiciousIPs: ipsData.filter((ip) => ip.risk === "high").length,
      sharedIPUsers: sharedIPUsers.size,
    };
  }, [usersData, adsData, ipsData, edgesData]);

  const ipStats = useMemo(() => {
    const statMap = new Map<string, IPStat>();
    ipsData.forEach((ip) =>
      statMap.set(ip.id, {
        ip: ip.label,
        userCount: 0,
        adCount: 0,
        status: "normal",
      }),
    );

    edgesData.forEach((e) => {
      if (e.type === "logged_from" && statMap.has(e.to)) {
        const s = statMap.get(e.to)!;
        s.userCount += 1;
        if (s.userCount > 1) s.status = "suspect";
      }
      if (e.type === "accessed_from" && statMap.has(e.from)) {
        const s = statMap.get(e.from)!;
        s.adCount += 1;
      }
    });

    ipsData.forEach((ip) => {
      if (ip.risk === "high" && statMap.has(ip.id))
        statMap.get(ip.id)!.status = "blocked";
    });

    return Array.from(statMap.values()).sort(
      (a, b) => b.userCount + b.adCount - (a.userCount + a.adCount),
    );
  }, [ipsData, edgesData]);

  const filteredIPStats = useMemo(() => {
    if (!ipSearch) return ipStats;
    return ipStats.filter((s) => s.ip.includes(ipSearch));
  }, [ipSearch, ipStats]);

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "all") return timelineData;
    return timelineData.filter((e) => e.action === timelineFilter);
  }, [timelineFilter, timelineData]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const tooltipNode =
    hoveredNode || selectedNode
      ? nodeMap.get(hoveredNode || selectedNode!)
      : null;

  return (
    <div
      dir="rtl"
      className="w-full min-h-screen bg-neutral-950 text-neutral-100 font-[Vazirmatn,Tahoma,sans-serif]"
    >
      {/* هدر */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <Activity size={24} className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-50 flex items-center gap-2">
                پنل تحلیل شبکه‌ی ارتباطات
                <Shield size={18} className="text-orange-500" />
              </h1>
              <p className="text-sm text-neutral-400 mt-0.5">
                بررسی تعاملات کاربران، آگهی‌ها و آدرس‌های IP شبکه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <StatBadge
              icon={<Users size={16} />}
              label="کل کاربران"
              value={summaryStats.totalUsers}
              color="text-teal-400"
              bg="bg-teal-500/10"
            />
            <StatBadge
              icon={<FileText size={16} />}
              label="آگهی‌ها"
              value={summaryStats.activeAds}
              color="text-orange-400"
              bg="bg-orange-500/10"
            />
            <StatBadge
              icon={<AlertTriangle size={16} />}
              label="IP مشکوک"
              value={summaryStats.suspiciousIPs}
              color="text-red-400"
              bg="bg-red-500/10"
            />
            <StatBadge
              icon={<Globe size={16} />}
              label="IP مشترک"
              value={summaryStats.sharedIPUsers}
              color="text-yellow-400"
              bg="bg-yellow-500/10"
            />
          </div>
        </div>

        {/* تب‌ها */}
        <div className="flex items-center gap-2 mt-6 border-b border-neutral-800 pb-0">
          {[
            { key: "graph", label: "گراف تعاملی", icon: <Network size={18} /> },
            {
              key: "stats",
              label: "آمار و IP ها",
              icon: <BarChart3 size={18} />,
            },
            {
              key: "timeline",
              label: "گزارش رویدادها",
              icon: <Clock size={18} />,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-medium transition-all duration-200 border-b-2 -mb-px
                ${activeTab === tab.key ? "bg-neutral-800 text-orange-400 border-orange-500" : "text-neutral-400 hover:text-neutral-200 border-transparent hover:bg-neutral-800/50"}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* ===== تب ۱: گراف ارتباطات ===== */}
        {activeTab === "graph" && (
          <div className="relative">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-5 py-3 bg-neutral-900/50 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Network size={16} className="text-orange-500" />
                  <span>
                    {allNodes.length} گره موجود و {edgesData.length} خط ارتباطی
                  </span>
                </div>
                {selectedNode && (
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Eye size={14} /> پاک کردن انتخاب
                  </button>
                )}
              </div>

              <div
                className="relative overflow-auto p-2"
                style={{ maxHeight: "70vh" }}
              >
                <svg
                  width={840}
                  height={620}
                  viewBox="0 0 840 620"
                  className="mx-auto"
                  style={{ minWidth: 700 }}
                >
                  <defs>
                    <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
                      <stop offset="0%" stopColor="#171717" />
                      <stop offset="100%" stopColor="#0a0a0a" />
                    </radialGradient>
                  </defs>
                  <rect width="840" height="620" fill="url(#bgGrad)" rx={12} />

                  {/* حلقه‌های راهنما */}
                  {[145, 220, 280].map((r, idx) => (
                    <circle
                      key={`ring-${idx}`}
                      cx={CX}
                      cy={CY}
                      r={r}
                      fill="none"
                      stroke="#404040"
                      strokeWidth={0.5}
                      strokeDasharray="4 6"
                      opacity={0.3}
                    />
                  ))}

                  <text
                    x={CX + 148}
                    y={CY - 140}
                    fill="#737373"
                    fontSize={9}
                    fontFamily="Vazirmatn"
                  >
                    آگهی‌ها
                  </text>
                  <text
                    x={CX + 222}
                    y={CY - 216}
                    fill="#737373"
                    fontSize={9}
                    fontFamily="Vazirmatn"
                  >
                    کاربران
                  </text>
                  <text
                    x={CX + 282}
                    y={CY - 276}
                    fill="#737373"
                    fontSize={9}
                    fontFamily="Vazirmatn"
                  >
                    IPها
                  </text>

                  {/* یال‌ها */}
                  {edgesData.map((edge, i) => {
                    const fromNode = nodeMap.get(edge.from);
                    const toNode = nodeMap.get(edge.to);
                    if (!fromNode || !toNode) return null;

                    const isHighlighted =
                      (selectedNode &&
                        (edge.from === selectedNode ||
                          edge.to === selectedNode)) ||
                      (hoveredNode &&
                        (edge.from === hoveredNode || edge.to === hoveredNode));
                    const isDimmed =
                      (selectedNode && !isHighlighted) ||
                      (hoveredNode && !isHighlighted && !selectedNode);
                    const style = getEdgeStyle(
                      edge,
                      !!isHighlighted,
                      !!isDimmed,
                    );
                    const midX = ((fromNode.x || 0) + (toNode.x || 0)) / 2;
                    const midY = ((fromNode.y || 0) + (toNode.y || 0)) / 2;

                    return (
                      <g key={`edge-${i}`}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          {...(style as any)}
                        />
                        {isHighlighted && edge.weight > 1 && (
                          <g>
                            <rect
                              x={midX - 12}
                              y={midY - 8}
                              width={24}
                              height={16}
                              rx={4}
                              fill="#262626"
                              opacity={0.9}
                            />
                            <text
                              x={midX}
                              y={midY + 3}
                              textAnchor="middle"
                              fill="white"
                              fontSize={9}
                              fontFamily="Vazirmatn"
                            >
                              {edge.weight}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* گره‌ها */}
                  {allNodes.map((node) => {
                    const isSelected = selectedNode === node.id;
                    const isHovered = hoveredNode === node.id;
                    const isConnected = connectedNodeIds.has(node.id);
                    const isDimmed = selectedNode && !isConnected;
                    const opacity = isDimmed ? 0.15 : 1;
                    const scale = isSelected || isHovered ? 1.25 : 1;

                    let fillColor = "#14b8a6"; // Teal جایگزین آبی
                    let strokeColor = "#0f766e";
                    let labelColor = "#5eead4";

                    if (node.type === "ad") {
                      fillColor = "#f97316";
                      strokeColor = "#c2410c";
                      labelColor = "#fdba74";
                    } else if (node.type === "ip") {
                      fillColor = "#22c55e";
                      strokeColor = "#15803d";
                      labelColor = "#86efac";
                    }

                    if (node.risk === "high") {
                      strokeColor = "#ef4444";
                      labelColor = "#fca5a5";
                    } else if (node.risk === "medium") {
                      strokeColor = "#eab308";
                    }

                    const shapeProps = {
                      fill: fillColor,
                      stroke: strokeColor,
                      strokeWidth: isSelected ? 3 : 2,
                      opacity,
                      transform: `translate(${node.x}, ${node.y}) scale(${scale})`,
                      style: {
                        cursor: "pointer",
                        transition: "transform 0.2s ease, opacity 0.2s ease",
                      },
                      onClick: () => handleNodeClick(node.id),
                      onMouseEnter: () => setHoveredNode(node.id),
                      onMouseLeave: () => setHoveredNode(null),
                    };

                    return (
                      <g key={node.id}>
                        {node.type === "user" ? (
                          <circle r={16} {...shapeProps} />
                        ) : node.type === "ad" ? (
                          <rect
                            x={-13}
                            y={-13}
                            width={26}
                            height={26}
                            rx={4}
                            {...shapeProps}
                          />
                        ) : (
                          <polygon
                            points="0,-18 16,0 0,18 -16,0"
                            {...shapeProps}
                          />
                        )}

                        {isSelected && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.type === "ip" ? 24 : 22}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth={2}
                            strokeDasharray="5 3"
                            opacity={0.8}
                          >
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              from={`0 ${node.x} ${node.y}`}
                              to={`360 ${node.x} ${node.y}`}
                              dur="8s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}

                        {node.risk === "high" && (
                          <circle
                            cx={(node.x || 0) + 14}
                            cy={(node.y || 0) - 14}
                            r={6}
                            fill="#ef4444"
                            opacity={opacity}
                          >
                            <animate
                              attributeName="r"
                              values="5;7;5"
                              dur="1.5s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}

                        {(!selectedNode || isConnected) && (
                          <text
                            x={node.x}
                            y={(node.y || 0) + (node.type === "ip" ? 30 : 28)}
                            textAnchor="middle"
                            fill={labelColor}
                            fontSize={10}
                            fontFamily="Vazirmatn"
                            fontWeight={isSelected ? "bold" : "normal"}
                            opacity={opacity}
                            style={{ pointerEvents: "none" }}
                          >
                            {node.label.length > 18
                              ? node.label.slice(0, 18) + "…"
                              : node.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip تکمیل شده */}
                {tooltipNode && (
                  <div
                    className="absolute z-50 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 shadow-2xl pointer-events-none min-w[180px] max-w-xs"
                    style={{
                      left: `${(tooltipNode.x || 0) + 20}px`,
                      top: `${(tooltipNode.y || 0) - 20}px`,
                    }}
                  >
                    <div className="font-bold text-sm text-neutral-100 mb-1 border-b border-neutral-700 pb-1">
                      {tooltipNode.label}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      {tooltipNode.detail}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== تب ۲: آمار ===== */}
        {activeTab === "stats" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-neutral-100">
                تحلیل آدرس‌های IP شبکه
              </h2>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  placeholder="جستجوی IP..."
                  value={ipSearch}
                  onChange={(e) => setIpSearch(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 rounded-lg pr-10 pl-4 py-2 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-neutral-400 bg-neutral-950/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tr-lg">آدرس IP</th>
                    <th className="px-4 py-3">تعداد کاربران مرتبط</th>
                    <th className="px-4 py-3">دسترسی به آگهی‌ها</th>
                    <th className="px-4 py-3 rounded-tl-lg">وضعیت امنیتی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredIPStats.map((stat, i) => (
                    <tr
                      key={i}
                      className="hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-neutral-200 dir-ltr text-left w-max">
                        {stat.ip}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {stat.userCount} کاربر
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {stat.adCount} آگهی
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full ${
                            stat.status === "blocked"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : stat.status === "suspect"
                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {stat.status === "blocked"
                            ? "مسدود شده"
                            : stat.status === "suspect"
                              ? "مشکوک"
                              : "عادی"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== تب ۳: تایم‌لاین ===== */}
        {activeTab === "timeline" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
              <span className="text-sm text-neutral-400 flex items-center gap-1">
                <Filter size={16} /> فیلتر:
              </span>
              {[
                { key: "all", label: "همه رویدادها" },
                { key: "login", label: "ورود" },
                { key: "ad_created", label: "ثبت آگهی" },
                { key: "suspicious", label: "مشکوک" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTimelineFilter(f.key as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    timelineFilter === f.key
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                      : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredTimeline.map((event) => {
                const style = getTimelineStyle(event.action);
                return (
                  <div
                    key={event.id}
                    className="flex gap-4 p-4 rounded-xl bg-neutral-950/50 border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <div
                      className={`mt-1 p-2 rounded-lg text-white ${style.color} shadow-lg shrink-0 h-min`}
                    >
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start flex-wrap gap-2 mb-1">
                        <div className="font-medium text-neutral-200">
                          {event.userName}{" "}
                          <span className="text-neutral-500 text-sm font-normal">
                            ({style.text})
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 dir-ltr">
                          {event.timestamp}
                        </div>
                      </div>
                      <p className="text-sm text-neutral-400 mb-2">
                        {event.details}
                      </p>
                      {event.ip && (
                        <div className="inline-flex items-center gap-1 text-xs text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          <Globe size={12} /> {event.ip}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
