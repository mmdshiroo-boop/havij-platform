// frontend/components/notifications/NotificationSettings.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Mail,
  Smartphone,
  Megaphone,
  Shield,
  MessageCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  getNotificationSettings,
  updateNotificationSettings,
  NotificationSettings as NotificationSettingsType,
} from "@/services/api/notification.api";

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("خطا در دریافت تنظیمات اعلان");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettingsType) => {
    if (settings) {
      setSettings({ ...settings, [key]: !settings[key] });
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await updateNotificationSettings(settings);
      toast.success("تنظیمات اعلان‌ها با موفقیت به‌روزرسانی شد");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!settings) return null;

  const settingsGroups = [
    {
      title: "کانال‌های دریافت اطلاع‌رسانی",
      description: "تنظیم کنید که بستر ارتباطی شما برای دریافت هر پیام چگونه باشد.",
      icon: <Bell className="w-5 h-5 text-primary" />,
      items: [
        {
          key: "emailNotifications",
          label: "اطلاع‌رسانی ایمیلی",
          icon: <Mail className="w-4 h-4" />,
          description: "ارسال خلاصه وضعیت‌ها و فاکتورها به ایمیل شما",
        },
        {
          key: "smsNotifications",
          label: "اطلاع‌رسانی پیامکی (SMS)",
          icon: <Smartphone className="w-4 h-4" />,
          description: "ارسال هشدارهای فوری و وضعیت آگهی‌ها به موبایل ثبت‌شده",
        },
      ],
    },
    {
      title: "دسته‌بندی هشدارهای سیستم",
      description: "انتخاب کنید مایل به دریافت کدام گروه‌ها از اعلان‌ها هستید.",
      icon: <Shield className="w-5 h-5 text-primary" />,
      items: [
        {
          key: "newAdAlerts",
          label: "پیشنهاد آگهی‌های جدید",
          icon: <Megaphone className="w-4 h-4" />,
          description: "انتشار آگهی‌های جدید مطابق با فیلترها و علایق شما",
        },
        {
          key: "adStatusAlerts",
          label: "تغییر وضعیت آگهی‌ها",
          icon: <Bell className="w-4 h-4" />,
          description: "تایید، رد، انقضا و هشدارهای مربوط به محتوای آگهی شخص شما",
        },
        {
          key: "messageAlerts",
          label: "چت‌ها و پیام‌های دریافتی",
          icon: <MessageCircle className="w-4 h-4" />,
          description: "اعلان لحظه‌ای چت‌های جدید خریداران یا کارشناسان پلتفرم",
        },
        {
          key: "marketingEmails",
          label: "کمپین‌های تخفیفی و اخبار سرویس",
          icon: <Megaphone className="w-4 h-4" />,
          description: "کدهای تخفیف دوره‌ای، بروزرسانی پلتفرم و رویدادها ویژه",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر بخش تنظیمات */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/10 p-4 border rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">تنظیمات اعلان‌ها</h2>
          <p className="text-muted-foreground text-xs mt-1">
            دسترسی‌ها و بسترهای مجاز برای ارتباط پلتفرم با خود را سفارشی‌سازی کنید
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl h-10 font-bold px-5">
          <Save className="w-4 h-4" />
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </div>

      {settingsGroups.map((group, idx) => (
        <Card key={idx} className="rounded-2xl border-border/70 overflow-hidden shadow-xs">
          <CardHeader className="bg-muted/20 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-sm font-black">
              {group.icon}
              {group.title}
            </CardTitle>
            <CardDescription className="text-xs">{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/40">
            {group.items.map((item) => {
              const isChecked = settings[item.key as keyof NotificationSettingsType] as boolean;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/5 cursor-pointer select-none"
                  onClick={() => handleToggle(item.key as keyof NotificationSettingsType)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground border border-border/50">
                      {item.icon}
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor={item.key} className="text-xs font-bold cursor-pointer">
                        {item.label}
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      id={item.key}
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(item.key as keyof NotificationSettingsType)}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}