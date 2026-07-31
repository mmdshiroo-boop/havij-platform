// ═══════════════════════════════════════════════════════════════════════════════
//  graph.controller.ts — گراف شبکهٔ جامع
//  کاربران، IPها، آگهی‌ها، چت‌ها، ذخیره‌ها
// ═══════════════════════════════════════════════════════════════════════════════

import { Request, Response } from "express";
import mongoose from "mongoose";

// ✅ ثبت مدل CookieAudit قبل از استفاده
import "../models/CookieAudit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  name: string;
  type: string;
  category?: string | number;
  value?: number;
  symbolSize?: number;
  itemStyle?: { color: string };
  [key: string]: any;
}

interface GraphEdge {
  source: string;
  target: string;
  value?: number;
  lineStyle?: {
    width?: number;
    color?: string;
    type?: string;
    opacity?: number;
  };
  label?: { show?: boolean; formatter?: string; fontSize?: number };
}

// ─── رنگ‌ها ─────────────────────────────────────────────────────────────────

const COLORS = {
  super_admin: "#e74c3c",
  admin: "#e67e22",
  agent: "#2ecc71",
  ad: "#9b59b6",
  user: "#95a5a6",
  chat: "#f39c12",
  save: "#1abc9c",
};

// ═══════════════════════════════════════════════════════════════════════════════
//  گراف شبکهٔ جامع (Network Graph)
// ═══════════════════════════════════════════════════════════════════════════════

export const getNetworkGraph = async (req: Request, res: Response) => {
  try {
    const User = mongoose.model("User");
    const Ad = mongoose.model("Ad");
    const Favorite = mongoose.model("Favorite");
    const Conversation = mongoose.model("Conversation");
    const CookieAudit = mongoose.model("CookieAudit");

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeSet = new Set<string>();

    // ─── ۱. همهٔ کاربران فعال ───
    const users = (await User.find({ isActive: true })
      .select("_id firstName lastName phone role")
      .lean()) as any[];

    // ذخیره آیدی‌های واقعی کاربران برای استفاده در کوئری‌های بعدی
    const activeUserIds = users.map((u) => u._id);

    for (const u of users) {
      const id = u._id.toString();
      if (nodeSet.has(id)) continue;
      nodeSet.add(id);
      const name =
        `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.phone || "کاربر";
      const color =
        u.role === "agent" || u.role === "developer"
          ? COLORS.agent
          : u.role === "admin" || u.role === "super_admin"
            ? COLORS.super_admin
            : COLORS.user;
      nodes.push({
        id,
        name,
        type: "user",
        category: 0,
        symbolSize: u.role === "agent" ? 28 : 20,
        itemStyle: { color },
        role: u.role,
        phone: u.phone,
      });
    }

    // ─── ۲. آگهی‌های محبوب (حداکثر ۵۰) ───
    const topSavedAds = await Favorite.aggregate([
      { $group: { _id: "$adId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    // فیلتر کردن آیدی‌های معتبر ObjectId برای آگهی‌ها
    const savedAdIds = topSavedAds
      .map((a: any) => a._id)
      .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id));

    const savedAds =
      savedAdIds.length > 0
        ? ((await Ad.find({ _id: { $in: savedAdIds } })
            .select("_id title price")
            .lean()) as any[])
        : [];

    const adSaveCountMap = new Map(
      topSavedAds.map((a: any) => [a._id?.toString(), a.count]),
    );

    for (const ad of savedAds) {
      const id = `ad_${ad._id}`;
      if (nodeSet.has(id)) continue;
      nodeSet.add(id);
      nodes.push({
        id,
        name:
          ad.title.length > 20 ? ad.title.substring(0, 20) + "..." : ad.title,
        type: "ad",
        category: 1,
        symbolSize: 14,
        itemStyle: { color: COLORS.ad },
        price: ad.price,
        savedCount: adSaveCountMap.get(ad._id.toString()) || 0,
      });
    }

    // ─── ۳. یال‌های ذخیره (User → Ad) ───
    // ✅ اصلاح اصلی: استفاده از activeUserIds به جای Array.from(nodeSet)
    const favorites =
      activeUserIds.length > 0 && savedAdIds.length > 0
        ? ((await Favorite.find({
            userId: { $in: activeUserIds },
            adId: { $in: savedAdIds },
          })
            .select("userId adId")
            .lean()) as any[])
        : [];

    for (const fav of favorites) {
      const uid = fav.userId?.toString?.() || String(fav.userId);
      const aid = `ad_${fav.adId?.toString?.() || String(fav.adId)}`;
      if (nodeSet.has(uid) && nodeSet.has(aid)) {
        edges.push({
          source: uid,
          target: aid,
          lineStyle: {
            width: 1,
            color: COLORS.save,
            type: "dotted" as const,
            opacity: 0.7,
          },
        });
      }
    }

    // ─── ۴. یال‌های چت (User → User) ───
    const conversations = (await Conversation.find({
      participants: { $exists: true, $not: { $size: 0 } },
    })
      .select("participants")
      .limit(300)
      .lean()) as any[];

    const chatEdgeMap = new Map<string, GraphEdge>();
    for (const conv of conversations) {
      if (conv.participants && conv.participants.length >= 2) {
        const u1 = conv.participants[0].toString();
        const u2 = conv.participants[1].toString();
        if (nodeSet.has(u1) && nodeSet.has(u2)) {
          const key = [u1, u2].sort().join("::");
          const existing = chatEdgeMap.get(key);
          if (existing) {
            existing.value = (existing.value || 0) + 1;
            existing.lineStyle!.width = Math.min(
              6,
              1.5 + (existing.value || 0) * 0.5,
            );
          } else {
            chatEdgeMap.set(key, {
              source: u1,
              target: u2,
              value: 1,
              lineStyle: { width: 1.5, color: COLORS.chat, opacity: 0.7 },
            });
          }
        }
      }
    }

    // ─── ۵. IPهای مشکوک (حداقل ۲ کاربر) ───
    const sharedIPs = await CookieAudit.aggregate([
      { $match: { type: "login" } },
      {
        $group: {
          _id: "$ip",
          users: { $addToSet: "$userId" },
          count: { $sum: 1 },
        },
      },
      { $match: { $expr: { $gt: [{ $size: "$users" }, 1] } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]);

    for (const ip of sharedIPs) {
      if (!ip._id) continue;
      const ipId = `ip_${ip._id.replace(/\./g, "_")}`;
      if (nodeSet.has(ipId)) continue;
      nodeSet.add(ipId);
      nodes.push({
        id: ipId,
        name: ip._id,
        type: "ip",
        category: 2,
        symbolSize: Math.min(35, 15 + ip.users.length * 3),
        itemStyle: { color: "#e74c3c" },
        userCount: ip.users.length,
      });

      for (const uid of ip.users) {
        const userId = uid?.toString();
        if (userId && nodeSet.has(userId)) {
          edges.push({
            source: userId,
            target: ipId,
            lineStyle: { width: 1.5, color: "#e74c3c", opacity: 0.8 },
          });
        }
      }
    }

    const mergedEdges = [...edges, ...chatEdgeMap.values()];

    res.json({
      success: true,
      data: {
        nodes,
        edges: mergedEdges,
        categories: [{ name: "کاربر" }, { name: "آگهی" }, { name: "IP" }],
        stats: {
          totalUsers: users.length,
          totalAds: savedAds.length,
          totalSuspiciousIPs: sharedIPs.length,
          totalChatEdges: chatEdgeMap.size,
          totalSaveEdges: edges.filter(
            (e) => e.lineStyle?.color === COLORS.save,
          ).length,
        },
      },
    });
  } catch (error) {
    console.error("Network graph error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت گراف شبکه" });
  }
};
