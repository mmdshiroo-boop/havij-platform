"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Trash2, Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api/client";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function UserNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/notifications");
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("خطا در دریافت اعلان‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("خطا در علامت زدن اعلان");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("همه اعلان‌ها خوانده شدند");
    } catch (error) {
      toast.error("خطا در علامت زدن اعلان‌ها");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("اعلان حذف شد");
    } catch (error) {
      toast.error("خطا در حذف اعلان");
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await apiClient.delete("/notifications/read/all");
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success("اعلان‌های خوانده شده حذف شدند");
    } catch (error) {
      toast.error("خطا در حذف اعلان‌ها");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 px-3 sm:px-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-3 sm:px-6 pb-8" dir="rtl">
      {/* هدر */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-md">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              اعلان‌های من
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} اعلان خوانده نشده`
                : "همه اعلان‌ها خوانده شده"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-end sm:self-auto">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-xs gap-2 border-primary/20 hover:bg-primary/5"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="w-4 h-4" />
              خواندن همه
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold text-xs gap-2 border-border/60 hover:bg-muted"
            onClick={handleDeleteAllRead}
          >
            <Trash2 className="w-4 h-4" />
            حذف خوانده‌ها
          </Button>
        </div>
      </motion.div>

      {/* لیست اعلان‌ها */}
      {notifications.length === 0 ? (
        <Card className="border-2 border-dashed border-border/60 bg-muted/20 rounded-2xl">
          <CardContent className="py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted flex items-center justify-center rounded-full text-muted-foreground/50">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1.5">
              هیچ اعلانی وجود ندارد
            </h3>
            <p className="text-muted-foreground text-xs font-medium">
              وقتی اعلان جدیدی دریافت کنید، اینجا نمایش داده می‌شود
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
          className="space-y-3"
        >
          {notifications.map((notification) => (
            <motion.div
              key={notification._id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:shadow-md border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden",
                  !notification.isRead
                    ? "border-r-4 border-r-primary bg-primary/5"
                    : ""
                )}
                onClick={() => {
                  if (notification.link) {
                    router.push(notification.link);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <p className="text-[11px] text-muted-foreground/70">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="خواندن"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="حذف"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}