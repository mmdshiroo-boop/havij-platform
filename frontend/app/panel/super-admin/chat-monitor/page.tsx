"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "@/services/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Search,
  RefreshCw,
  Eye,
  Users,
  Trash2,
  Activity,
  MessageSquare,
  ShieldCheck,
  Paperclip,
  X,
  Tag,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/getImageUrl";

// تابع کمکی استخراج مطمئن ID کاربر
const getUserId = (user: any): string => {
  if (!user) return "";
  if (typeof user === "string") return user;
  if (typeof user === "object") return String(user._id || user.id || "");
  return String(user);
};

interface Participant {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role?: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage?: string;
  updatedAt: string;
  ad?: { title: string };
}

interface Message {
  _id: string;
  conversation: string;
  sender: Participant | string;
  content: string;
  type: "text" | "image" | "file";
  fileUrl?: string;
  createdAt: string;
}

export default function ChatMonitorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [stats, setStats] = useState({
    totalConversations: 0,
    todayMessages: 0,
    activeUsers: 0,
  });

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "message" | "conversation";
    id: string;
    label?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/super-admin/chat/conversations");
      if (data.success) setConversations(data.data || []);
    } catch {
      toast.error("خطا در دریافت مکالمات");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await axios.get("/super-admin/chat/stats");
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchStats();
  }, [fetchConversations, fetchStats]);

  const handleViewChat = async (conv: Conversation) => {
    setSelectedConv(conv);
    setMessagesLoading(true);
    try {
      const { data } = await axios.get(
        `/super-admin/chat/conversations/${conv._id}/messages`,
      );
      if (data.success) setMessages(data.data || []);
    } catch {
      toast.error("خطا در دریافت پیام‌ها");
    } finally {
      setMessagesLoading(false);
    }
  };

  const requestDelete = (
    type: "message" | "conversation",
    id: string,
    label?: string,
  ) => {
    setDeleteTarget({ type, id, label });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    try {
      if (type === "message") {
        await axios.delete(`/super-admin/chat/messages/${id}`);
        setMessages((prev) => prev.filter((m) => m._id !== id));
        toast.success("پیام با موفقیت حذف شد");
      } else {
        await axios.delete(`/super-admin/chat/conversations/${id}`);
        toast.success("مکالمه با موفقیت حذف شد");
        setSelectedConv(null);
        fetchConversations();
        fetchStats();
      }
    } catch {
      toast.error("خطا در عملیات حذف");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.participants?.some((p) =>
      `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );

  // محاسبه واقعی مقادیر کارت‌های آماری
  const realTotalConversations =
    stats.totalConversations || conversations.length || 0;

  const realActiveUsers =
    stats.activeUsers ||
    new Set(
      conversations.flatMap(
        (c) => c.participants?.map((p) => getUserId(p)) || [],
      ),
    ).size ||
    0;

  const realTodayMessages = stats.todayMessages || 0;

  // آرایه کارت‌های آماری جهت حفظ یک‌دستی و تمیزی کد
  const statCardsData = [
    {
      id: "total-conversations",
      title: "کل مکالمات",
      value: realTotalConversations,
      icon: <MessageSquare className="w-5 h-5 text-primary" />,
    },
    {
      id: "today-messages",
      title: "پیام‌های امروز",
      value: realTodayMessages,
      icon: <Activity className="w-5 h-5 text-primary" />,
    },
    {
      id: "active-users",
      title: "کاربران فعال",
      value: realActiveUsers,
      icon: <Users className="w-5 h-5 text-primary" />,
    },
  ];

  // طرفین گفتگو برای مودال
  const p1 = selectedConv?.participants?.[0]; // چپ
  const p2 = selectedConv?.participants?.[1]; // راست
  const p1Id = getUserId(p1);

  return (
    <div className="space-y-6 w-full" dir="rtl">
      {/* هدر اصلی */}
      <div className="relative overflow-hidden rounded-2xl bg-card text-card-foreground p-6 border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  رصد و نظارت بر چت‌ها
                </h1>
                <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 font-normal px-2 py-0 rounded-md">
                  زنده
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                بررسی و نظارت بر گفتگوهای کاربران
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchConversations();
              fetchStats();
            }}
            className="rounded-lg border-border"
          >
            <RefreshCw className="w-4 h-4 ml-2" /> به‌روزرسانی
          </Button>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCardsData.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * (idx + 1) }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-all flex items-center justify-between"
          >
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {card.title}
              </span>
              <div className="text-2xl font-black text-foreground tracking-tight">
                {loading || statsLoading ? (
                  <Skeleton className="h-8 w-16 bg-muted rounded-lg" />
                ) : (
                  card.value.toLocaleString("fa-IR")
                )}
              </div>
            </div>
            <div className="p-3.5 bg-primary/10 rounded-xl shrink-0">
              {card.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* جستجو */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی کاربر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 rounded-xl bg-card border-input placeholder:text-muted-foreground text-foreground"
          />
        </div>
      </div>

      {/* جدول مکالمات */}
      <div className="rounded-xl border border-border overflow-hidden bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
              <TableHead className="text-right font-medium text-muted-foreground">
                شرکت‌کنندگان
              </TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">
                آگهی مربوطه
              </TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">
                آخرین پیام
              </TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">
                تاریخ بروزرسانی
              </TableHead>
              <TableHead className="text-center font-medium text-muted-foreground">
                عملیات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell colSpan={5} className="py-4">
                    <Skeleton className="h-6 w-full rounded-md bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredConversations.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  هیچ مکالمه‌ای یافت نشد.
                </TableCell>
              </TableRow>
            ) : (
              filteredConversations.map((conv) => (
                <TableRow
                  key={conv._id}
                  className="border-border hover:bg-muted/30"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2 space-x-reverse">
                        {conv.participants?.map((p, idx) => (
                          <Avatar
                            key={p._id || idx}
                            className="w-8 h-8 border-2 border-background"
                          >
                            <AvatarImage
                              src={
                                p.avatar
                                  ? getImageUrl(p.avatar)
                                  : "/images/user.webp"
                              }
                              alt={p.firstName || "کاربر"}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs" />
                          </Avatar>
                        ))}
                      </div>
                      <span className="font-medium text-sm text-foreground">
                        {conv.participants
                          ?.map((p) => `${p.firstName} ${p.lastName}`)
                          .join(" و ") || "کاربر ناشناس"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {conv.ad?.title ? (
                      <Badge
                        variant="outline"
                        className="font-normal truncate max-w-[150px] border-border text-muted-foreground"
                      >
                        {conv.ad.title}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {conv.lastMessage || "بدون پیام"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(conv.updatedAt).toLocaleDateString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewChat(conv)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="w-4 h-4 ml-1" /> مشاهده
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* مودال چت */}
      <Dialog open={!!selectedConv} onOpenChange={() => setSelectedConv(null)}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-2xl h-[85vh] p-0 border border-border rounded-2xl shadow-xl overflow-hidden bg-background flex flex-col"
        >
          <DialogTitle className="sr-only">
            گفتگوی {p1?.firstName || "کاربر ۱"} و {p2?.firstName || "کاربر ۲"}
          </DialogTitle>

          {/* هدر مودال */}
          <div className="bg-card border-b border-border p-4 shrink-0 shadow-sm z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 space-x-reverse">
                  <Avatar className="w-10 h-10 border-2 border-card shadow-sm z-10">
                    <AvatarImage
                      src={
                        p1?.avatar
                          ? getImageUrl(p1.avatar)
                          : "/images/user.webp"
                      }
                      alt={p1?.firstName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-foreground font-bold text-sm" />
                  </Avatar>
                  <Avatar className="w-10 h-10 border-2 border-card shadow-sm">
                    <AvatarImage
                      src={
                        p2?.avatar
                          ? getImageUrl(p2.avatar)
                          : "/images/user.webp"
                      }
                      alt={p2?.firstName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm" />
                  </Avatar>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <span className="text-foreground">{p1?.firstName}</span>
                    <span className="text-muted-foreground font-normal">و</span>
                    <span className="text-foreground">{p2?.firstName}</span>
                  </div>
                  {selectedConv?.ad?.title && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Tag className="w-3 h-3" />
                      آگهی: {selectedConv.ad.title}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  onClick={() =>
                    requestDelete(
                      "conversation",
                      selectedConv?._id || "",
                      `${p1?.firstName} و ${p2?.firstName}`,
                    )
                  }
                >
                  <Trash2 className="w-4 h-4 ml-1" /> حذف چت
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:bg-muted"
                  onClick={() => setSelectedConv(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* راهنمای طرفین چت */}
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-border bg-muted inline-block" />
                <span>سمت چپ: {p1 ? p1.firstName : "کاربر ۱"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                <span>سمت راست: {p2 ? p2.firstName : "کاربر ۲"}</span>
              </div>
            </div>
          </div>

          {/* بدنه چت */}
          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full px-4 py-6">
              {messagesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-2 max-w-[70%]",
                        i % 2 === 0
                          ? "mr-auto flex-row-reverse"
                          : "ml-auto flex-row",
                      )}
                    >
                      <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-muted" />
                      <Skeleton className="h-12 w-full rounded-2xl bg-muted" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">هیچ پیامی در این گفتگو وجود ندارد.</p>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col">
                  {messages.map((msg) => {
                    const senderId = getUserId(msg.sender);
                    const senderObj =
                      typeof msg.sender === "object" ? msg.sender : null;

                    const isAdmin =
                      senderObj?.role === "admin" ||
                      senderObj?.role === "super_admin";

                    // آیا فرستنده کاربر اول (سمت چپ) است؟
                    const isP1 = p1Id !== "" && senderId === p1Id;

                    return (
                      <div
                        key={msg._id}
                        dir="ltr"
                        className={cn(
                          "w-full flex",
                          isAdmin
                            ? "justify-center"
                            : isP1
                              ? "justify-start"
                              : "justify-end",
                        )}
                      >
                        <div
                          dir="rtl"
                          className={cn(
                            "flex items-end gap-2 group relative max-w-[85%] sm:max-w-[75%]",
                            isAdmin
                              ? "flex-col items-center"
                              : isP1
                                ? "flex-row-reverse"
                                : "flex-row",
                          )}
                        >
                          {/* آواتار */}
                          {!isAdmin && (
                            <Avatar className="w-7 h-7 shrink-0 mb-1">
                              <AvatarImage
                                src={
                                  senderObj?.avatar
                                    ? getImageUrl(senderObj.avatar)
                                    : "/images/user.webp"
                                }
                                alt={senderObj?.firstName || "کاربر"}
                                className="object-cover"
                              />
                              <AvatarFallback
                                className={
                                  isP1
                                    ? "bg-muted text-muted-foreground text-xs"
                                    : "bg-primary text-primary-foreground text-xs"
                                }
                              />
                            </Avatar>
                          )}

                          <div
                            className={cn(
                              "flex flex-col",
                              isAdmin
                                ? "items-center"
                                : isP1
                                  ? "items-start"
                                  : "items-end",
                            )}
                          >
                            {/* نام فرستنده */}
                            {!isAdmin && (
                              <span className="text-[10px] text-muted-foreground mb-1 px-1">
                                {senderObj?.firstName ||
                                  (isP1 ? p1?.firstName : p2?.firstName)}
                              </span>
                            )}

                            {/* حباب پیام */}
                            <div
                              className={cn(
                                "relative p-3 shadow-sm text-sm break-words transition-all",
                                isAdmin
                                  ? "bg-muted text-muted-foreground rounded-2xl text-center px-4"
                                  : isP1
                                    ? "bg-card text-card-foreground border border-border rounded-2xl rounded-tl-sm"
                                    : "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm",
                              )}
                            >
                              {/* دکمه حذف */}
                              <button
                                onClick={() =>
                                  requestDelete(
                                    "message",
                                    msg._id,
                                    msg.content?.slice(0, 30),
                                  )
                                }
                                className={cn(
                                  "absolute -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground p-1.5 rounded-full shadow-md hover:bg-destructive/90",
                                  isP1 ? "-right-2" : "-left-2",
                                )}
                                title="حذف پیام"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>

                              {/* محتوا */}
                              {isAdmin && (
                                <div className="flex items-center justify-center gap-1 text-xs font-bold mb-1">
                                  <ShieldCheck className="w-3.5 h-3.5" /> سیستم
                                </div>
                              )}

                              {msg.type === "text" ? (
                                <p className="leading-relaxed whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                              ) : msg.type === "image" ? (
                                <div className="space-y-2">
                                  <img
                                    src={msg.fileUrl}
                                    alt="پیوست"
                                    className="rounded-lg max-h-48 object-cover w-full"
                                  />
                                  {msg.content && <p>{msg.content}</p>}
                                </div>
                              ) : (
                                <a
                                  href={msg.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors",
                                    isP1
                                      ? "bg-muted border-border text-foreground hover:bg-muted/80"
                                      : "bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30",
                                  )}
                                >
                                  <Paperclip className="w-4 h-4" />
                                  <span>دانلود فایل پیوست</span>
                                </a>
                              )}

                              {/* زمان پیام */}
                              <div
                                className={cn(
                                  "flex items-center gap-1 text-[10px] mt-2 dir-ltr",
                                  isP1 && !isAdmin
                                    ? "text-muted-foreground"
                                    : isAdmin
                                      ? "text-muted-foreground justify-center"
                                      : "text-primary-foreground/80 justify-end",
                                )}
                              >
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString(
                                    "fa-IR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                {!isAdmin && (
                                  <CheckCheck className="w-3 h-3 opacity-70" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* هشدار حذف */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-xl bg-card text-card-foreground border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-foreground">
              {deleteTarget?.type === "message"
                ? "حذف پیام"
                : "حذف کامل مکالمه"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right text-muted-foreground dir-rtl">
              {deleteTarget?.type === "message"
                ? `آیا از حذف این پیام مطمئن هستید؟`
                : `آیا از حذف کامل این مکالمه مطمئن هستید؟`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-lg border-border">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              بله، حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}