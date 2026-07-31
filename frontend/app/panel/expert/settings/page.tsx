// app/panel/expert/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Palette,
  Shield,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
  Globe,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import AccountSecurity from "@/components/ui/AccountSecurity";
import apiClient from "@/services/api/client";
import { cn } from "@/lib/utils";

// ─── types ─────────────────────────────
interface ExpertSettings {
  theme: "light" | "dark" | "system";
  language: "fa" | "en";
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// ✅ تغییر پیش‌فرض به "light" به‌جای "system"
const defaults: ExpertSettings = {
  theme: "light",
  language: "fa",
  emailNotifications: true,
  smsNotifications: false,
};

// ─── منوی کناری ─────────────────────────
const menuItems = [
  { id: "general", label: "عمومی", icon: Palette },
  { id: "notifications", label: "اعلان‌ها", icon: Bell },
  { id: "security", label: "امنیت", icon: Shield },
];

export default function ExpertSettingsPage() {
  const [activeMenu, setActiveMenu] = useState("general");
  const [settings, setSettings] = useState<ExpertSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // بارگذاری تنظیمات
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      // localStorage
      const saved = localStorage.getItem("expertSettings");
      if (saved) {
        try {
          setSettings({ ...defaults, ...JSON.parse(saved) });
        } catch {}
      }
      // تلاش برای گرفتن از سرور
      try {
        const response = await apiClient.get("/notifications/settings");
        const data = response.data.data;
        setSettings((prev) => ({
          ...prev,
          emailNotifications:
            data.emailNotifications ?? prev.emailNotifications,
          smsNotifications: data.smsNotifications ?? prev.smsNotifications,
        }));
      } catch {}
      setLoading(false);
    };
    fetchSettings();
  }, []);

  // اعمال تم (با پیش‌فرض لایت، دیگر به‌طور خودکار دارک نمی‌شود)
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") root.classList.add("dark");
    else if (settings.theme === "light") root.classList.remove("dark");
    else {
      // system: پیروی از سیستم
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, [settings.theme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("expertSettings", JSON.stringify(settings));
      await apiClient.put("/notifications/settings", {
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
      });
      toast.success("تنظیمات با موفقیت ذخیره شد");
      setIsDirty(false);
    } catch (error: any) {
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaults);
    localStorage.removeItem("expertSettings");
    setIsDirty(false);
    toast.success("تنظیمات به پیش‌فرض بازنشانی شد");
  };

  const updateSetting = <K extends keyof ExpertSettings>(
    key: K,
    value: ExpertSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  // ─── محتوای هر تب ─────────────────────
  const renderContent = () => {
    switch (activeMenu) {
      case "general":
        return (
          <div className="space-y-5">
            <Card>
              <CardHeader className="bg-muted/40 border-b px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Globe className="h-4 w-4 text-primary" />
                  تنظیمات ظاهری
                </CardTitle>
                <CardDescription>انتخاب تم و زبان رابط کاربری</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-sm font-semibold">تم برنامه</Label>
                    <p className="text-xs text-muted-foreground">
                      روشن، تاریک یا پیروی از سیستم
                    </p>
                  </div>
                  <Select
                    value={settings.theme}
                    onValueChange={(v) => updateSetting("theme", v as any)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">روشن</SelectItem>
                      <SelectItem value="dark">تاریک</SelectItem>
                      <SelectItem value="system">پیروی از سیستم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-sm font-semibold">زبان</Label>
                    <p className="text-xs text-muted-foreground">
                      زبان رابط کاربری
                    </p>
                  </div>
                  <Select
                    value={settings.language}
                    onValueChange={(v) => updateSetting("language", v as any)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fa">فارسی</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-5">
            <Card>
              <CardHeader className="bg-muted/40 border-b px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Bell className="h-4 w-4 text-primary" />
                  تنظیمات اعلان‌ها
                </CardTitle>
                <CardDescription>
                  مدیریت نحوه دریافت اعلان‌ها (تغییرات بلافاصله ذخیره می‌شود)
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-5 space-y-4">
                {/* اعلان ایمیلی */}
                <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold">اعلان ایمیلی</p>
                    <p className="text-xs text-muted-foreground">
                      دریافت اعلان‌ها از طریق ایمیل
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={async (checked) => {
                      updateSetting("emailNotifications", checked);
                      try {
                        await apiClient.put("/notifications/settings", {
                          emailNotifications: checked,
                          smsNotifications: settings.smsNotifications,
                        });
                      } catch {
                        updateSetting("emailNotifications", !checked);
                        toast.error("خطا در ذخیره تنظیمات");
                      }
                    }}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300"
                  />
                </div>

                {/* اعلان پیامکی */}
                <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold">اعلان پیامکی</p>
                    <p className="text-xs text-muted-foreground">
                      دریافت پیامک برای رویدادهای مهم
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={async (checked) => {
                      updateSetting("smsNotifications", checked);
                      try {
                        await apiClient.put("/notifications/settings", {
                          emailNotifications: settings.emailNotifications,
                          smsNotifications: checked,
                        });
                      } catch {
                        updateSetting("smsNotifications", !checked);
                        toast.error("خطا در ذخیره تنظیمات");
                      }
                    }}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <Card>
            <CardHeader className="bg-muted/40 border-b px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Shield className="h-4 w-4 text-primary" />
                امنیت حساب
              </CardTitle>
              <CardDescription>مدیریت رمز عبور و نشست‌های فعال</CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <AccountSecurity />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* هدر و دکمه‌ها */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تنظیمات کارشناس</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت تنظیمات شخصی و امنیت حساب
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isDirty && (
            <Badge
              variant="outline"
              className="gap-1 text-[0.72rem] font-medium bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-1 rounded-full"
            >
              <AlertCircle className="h-3 w-3" /> تغییرات ذخیره نشده
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> بازنشانی
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 shadow-[0_2px_10px_hsl(var(--primary)_/_0.25)] hover:shadow-[0_4px_16px_hsl(var(--primary)_/_0.35)] hover:brightness-105 transition-all"
          >
            <Save className="h-3.5 w-3.5" />{" "}
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </div>

      {/* محتوای اصلی با منوی کناری */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-[20%] lg:w-[18%]">
          <div className="sticky top-20 space-y-1.5 bg-background/50 rounded-xl p-2 border border-border/50">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 text-right",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive && "text-primary-foreground",
                    )}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="w-full md:w-[80%] lg:w-[82%]">
          <div className="animate-slide-up">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}