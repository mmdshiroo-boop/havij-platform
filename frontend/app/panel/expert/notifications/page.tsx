// frontend/app/(main)/panel/expert/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  Notification,
} from "@/services/api/notification.api";

export default function ExpertNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(page, 20);
      let filtered = data.notifications;

      if (filter !== "all") {
        filtered = filtered.filter((n: Notification) => n.type === filter);
      }

      if (search) {
        filtered = filtered.filter(
          (n: Notification) =>
            n.title.includes(search) || n.message.includes(search),
        );
      }

      setNotifications(filtered);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("خطا در دریافت اعلان‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter, search]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      toast.error("خطا در علامت زدن اعلان");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("همه اعلان‌ها خوانده شدند");
    } catch (error) {
      toast.error("خطا در علامت زدن همه اعلان‌ها");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("اعلان حذف شد");
    } catch (error) {
      toast.error("خطا در حذف اعلان");
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await deleteAllReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success("اعلان‌های خوانده شده حذف شدند");
    } catch (error) {
      toast.error("خطا در حذف اعلان‌ها");
    }
  };

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ad_approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "ad_rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "ad_created":
        return <Bell className="w-4 h-4 text-blue-500" />;
      case "new_message":
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case "report":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "ad_approved":
        return "تایید آگهی";
      case "ad_rejected":
        return "رد آگهی";
      case "ad_created":
        return "آگهی جدید";
      case "new_message":
        return "پیام جدید";
      case "report":
        return "گزارش تخلف";
      default:
        return "سیستمی";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "numeric",
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading && page === 1) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">اعلان‌های من</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} اعلان خوانده نشده`
                : "همه اعلان‌ها خوانده شده"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="w-4 h-4 ml-2" />
              خواندن همه
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDeleteAllRead}>
            <Trash2 className="w-4 h-4 ml-2" />
            حذف خوانده‌ها
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در اعلان‌ها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl"
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder="فیلتر بر اساس نوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="ad_approved">تایید آگهی</SelectItem>
            <SelectItem value="ad_rejected">رد آگهی</SelectItem>
            <SelectItem value="ad_created">آگهی جدید</SelectItem>
            <SelectItem value="new_message">پیام جدید</SelectItem>
            <SelectItem value="report">گزارش تخلف</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">
              هیچ اعلانی وجود ندارد
            </h3>
            <p className="text-muted-foreground">
              وقتی اعلان جدیدی دریافت کنید، اینجا نمایش داده می‌شود
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !notification.isRead
                  ? "border-r-4 border-r-primary bg-primary/5"
                  : ""
              }`}
              onClick={() => handleClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{notification.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getTypeText(notification.type)}
                        </Badge>
                        {!notification.isRead && (
                          <Badge className="bg-primary text-white text-xs">
                            جدید
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {notification.link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClick(notification);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-50 hover:opacity-100"
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
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full"
          >
            قبلی
          </Button>
          <span className="flex items-center px-4 text-sm">
            صفحه {page} از {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full"
          >
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
}
