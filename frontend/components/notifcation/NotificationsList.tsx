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
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Rocket,
  Database,
  Home,
  User,
  Star,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldCheck,
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
import { normalizeNotificationLink } from "@/lib/notification-utils";

interface NotificationsListProps {
  userRole: string;
}

// ✅ آیکون‌ها با رنگ‌های هماهنگ پروژه (نارنجی، سفید، خاکستری، سبز، قرمز)
const getTypeIcon = (type: string) => {
  switch (type) {
    case "ad_approved":
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case "ad_rejected":
      return <XCircle className="w-4 h-4 text-destructive" />;
    case "ad_submitted":
      return <FileText className="w-4 h-4 text-primary" />;
    case "ad_expired":
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case "vip_upgrade":
      return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
    case "new_ad_pending":
      return <Bell className="w-4 h-4 text-primary" />;
    case "new_user":
      return <User className="w-4 h-4 text-teal-500" />;
    case "user_banned":
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    case "user_unbanned":
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case "new_agent":
      return <User className="w-4 h-4 text-purple-500" />;
    case "property_submitted":
      return <Home className="w-4 h-4 text-primary" />;
    case "backup_created":
      return <Database className="w-4 h-4 text-emerald-500" />;
    case "server_error":
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    case "deploy_success":
      return <Rocket className="w-4 h-4 text-emerald-500" />;
    case "new_message":
      return <MessageSquare className="w-4 h-4 text-primary" />;
    case "report":
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
};

const getTypeText = (type: string) => {
  switch (type) {
    case "ad_approved":
      return "تایید آگهی";
    case "ad_rejected":
      return "رد آگهی";
    case "ad_submitted":
      return "ثبت آگهی";
    case "ad_expired":
      return "انقضای آگهی";
    case "vip_upgrade":
      return "ارتقا به ویژه";
    case "new_ad_pending":
      return "آگهی جدید در انتظار";
    case "new_user":
      return "کاربر جدید";
    case "user_banned":
      return "مسدودیت کاربر";
    case "user_unbanned":
      return "رفع مسدودیت";
    case "new_agent":
      return "آژانس جدید";
    case "property_submitted":
      return "ثبت ملک";
    case "backup_created":
      return "بکاپ سیستم";
    case "server_error":
      return "خطای سرور";
    case "deploy_success":
      return "دیپلوی موفق";
    case "new_message":
      return "پیام چت";
    case "report":
      return "گزارش تخلف";
    default:
      return "سیستمی عمومی";
  }
};

export function NotificationsList({ userRole }: NotificationsListProps) {
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
      let filtered = data.notifications || [];

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
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("خطا در دریافت لیست اعلان‌ها");
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
      toast.error("خطا در تغییر وضعیت اعلان");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("تمامی اعلان‌ها خوانده شدند");
    } catch (error) {
      toast.error("خطا در به‌روزرسانی وضعیت اعلان‌ها");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("اعلان مورد نظر حذف شد");
    } catch (error) {
      toast.error("خطا در حذف اعلان");
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await deleteAllReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success("اعلان‌های خوانده شده پاکسازی شدند");
    } catch (error) {
      toast.error("خطا در حذف گروهی اعلان‌ها");
    }
  };

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      const targetLink = normalizeNotificationLink(notification.link, userRole);
      router.push(targetLink);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-primary border-primary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر با رنگ نارنجی */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/10 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/25">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">
              مدیریت اعلان‌ها
            </h1>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {unreadCount > 0
                ? `شما ${unreadCount} اعلان خوانده‌نشده دارید.`
                : "تمامی اعلان‌ها را مطالعه کرده‌اید."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-9 rounded-xl border-primary/30 text-xs font-bold gap-1.5 hover:bg-primary/5 hover:border-primary/50 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-primary" />
              خواندن همه
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteAllRead}
            className="h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            حذف خوانده‌شده‌ها
          </Button>
        </div>
      </div>

      {/* فیلتر و جستجو */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در عنوان یا متن اعلان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-11 rounded-xl bg-background border-border/60 focus:border-primary/40 focus:ring-primary/30"
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl bg-background border-border/60 font-medium focus:border-primary/40 focus:ring-primary/30">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="فیلتر نوع" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/60">
            <SelectItem value="all" className="rounded-lg">
              همه موارد
            </SelectItem>
            <SelectItem value="ad_submitted" className="rounded-lg">
              ثبت آگهی
            </SelectItem>
            <SelectItem value="ad_approved" className="rounded-lg">
              تایید آگهی
            </SelectItem>
            <SelectItem value="ad_rejected" className="rounded-lg">
              رد آگهی
            </SelectItem>
            <SelectItem value="new_message" className="rounded-lg">
              پیام جدید
            </SelectItem>
            <SelectItem value="report" className="rounded-lg">
              گزارش تخلف
            </SelectItem>
            <SelectItem value="vip_upgrade" className="rounded-lg">
              ارتقا ویژه
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* لیست اعلان‌ها */}
      {notifications.length === 0 ? (
        <Card className="border-dashed border-border/60 rounded-2xl bg-muted/5">
          <CardContent className="py-16 text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-muted/20 rounded-2xl flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              هیچ اعلانی یافت نشد
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              با تغییر فیلتر یا جستجو، ممکن است نتیجه‌ای پیدا شود.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border rounded-xl overflow-hidden group ${
                !notification.isRead
                  ? "border-r-4 border-r-primary bg-primary/[0.04] hover:bg-primary/[0.07]"
                  : "border-border/50 hover:bg-muted/10"
              }`}
              onClick={() => handleClick(notification)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 p-1.5 bg-muted/50 rounded-lg border border-border/30 flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground">
                          {notification.title}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-2 py-0 font-medium rounded-md bg-muted/50 text-muted-foreground border-border/30"
                        >
                          {getTypeText(notification.type)}
                        </Badge>
                        {!notification.isRead && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-2.5 py-0 font-black rounded-full shadow-sm shadow-primary/20">
                            جدید
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-3xl">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground/60 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4 select-none">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl h-9 gap-1 text-xs font-bold border-border/60 hover:bg-primary/5 hover:border-primary/30 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
            قبلی
          </Button>
          <span className="text-xs font-bold text-muted-foreground font-mono bg-muted/30 px-4 py-1.5 rounded-xl border border-border/30">
            صفحه {page} از {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl h-9 gap-1 text-xs font-bold border-border/60 hover:bg-primary/5 hover:border-primary/30 disabled:opacity-40"
          >
            بعدی
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
