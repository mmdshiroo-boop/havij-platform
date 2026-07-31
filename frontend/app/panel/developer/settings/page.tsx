"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Palette,
  Terminal,
  Globe,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Code2,
  Zap,
  Shield,
} from "lucide-react";
import ActiveSessions from "@/components/ui/ActiveSessions";

// ---------- types ----------
interface DeveloperSettings {
  theme: "light" | "dark" | "system";
  language: "fa" | "en";
  debugMode: boolean;
  showApiKeyInLogs: boolean;
  autoRefreshDocs: boolean;
  webhookRetryCount: number;
  webhookTimeout: number;
  logLevel: "debug" | "info" | "warn" | "error";
}

const defaults: DeveloperSettings = {
  theme: "system",
  language: "fa",
  debugMode: false,
  showApiKeyInLogs: false,
  autoRefreshDocs: true,
  webhookRetryCount: 3,
  webhookTimeout: 10,
  logLevel: "info",
};

export default function DeveloperSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<DeveloperSettings>(defaults);
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);

  // بارگذاری تنظیمات و توکن از localStorage
  useEffect(() => {
    const saved = localStorage.getItem("devSettings");
    if (saved) {
      try {
        setSettings({ ...defaults, ...JSON.parse(saved) });
      } catch {}
    }
    const t = localStorage.getItem("token");
    if (t) setToken(t);
  }, []);

  // اعمال تم هنگام تغییر
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") root.classList.add("dark");
    else if (settings.theme === "light") root.classList.remove("dark");
    else {
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
      localStorage.setItem("devSettings", JSON.stringify(settings));
      toast.success("تنظیمات با موفقیت ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaults);
    localStorage.removeItem("devSettings");
    toast.success("تنظیمات به پیش‌فرض بازنشانی شد");
  };

  const handleRefreshToken = () => {
    localStorage.removeItem("token");
    window.location.href = "/auth/login";
  };

  const tabs = [
    { id: "general", label: "عمومی", icon: Settings },
    { id: "notifications", label: "اعلان‌ها", icon: Bell },
    { id: "developer", label: "توسعه‌دهنده", icon: Code2 },
    { id: "api", label: "API", icon: Globe },
    { id: "security", label: "امنیت", icon: Shield },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-orange-100/70 dark:bg-orange-500/10 rounded-2xl border border-orange-200/50 dark:border-orange-500/20">
          <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">تنظیمات پنل</h1>
          <p className="text-sm text-muted-foreground">
            مدیریت تنظیمات محیط توسعه و شخصی‌سازی
          </p>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Content */}
        <div className="flex-1">
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-orange-500" />
                  ظاهر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <Label>تم برنامه</Label>
                    <p className="text-xs text-muted-foreground">
                      انتخاب تم روشن، تاریک یا پیروی از سیستم
                    </p>
                  </div>
                  <Select
                    value={settings.theme}
                    onValueChange={(v) =>
                      setSettings({ ...settings, theme: v as any })
                    }
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

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <Label>زبان</Label>
                    <p className="text-xs text-muted-foreground">
                      زبان رابط کاربری
                    </p>
                  </div>
                  <Select
                    value={settings.language}
                    onValueChange={(v) =>
                      setSettings({ ...settings, language: v as any })
                    }
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
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  تنظیمات اعلان‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  تنظیمات اعلان‌ها در این بخش قرار خواهد گرفت. (جهت تکمیل توسط
                  تیم فنی)
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === "developer" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-orange-500" />
                  محیط توسعه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <Label>حالت دیباگ</Label>
                    <p className="text-xs text-muted-foreground">
                      نمایش اطلاعات دیباگ در کنسول
                    </p>
                  </div>
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, debugMode: v })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <Label>نمایش API Key در لاگ‌ها</Label>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ فقط برای دیباگ - امنیت را کاهش می‌دهد
                    </p>
                  </div>
                  <Switch
                    checked={settings.showApiKeyInLogs}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, showApiKeyInLogs: v })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <Label>بروزرسانی خودکار مستندات</Label>
                    <p className="text-xs text-muted-foreground">
                      دریافت خودکار آخرین نسخه مستندات API
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoRefreshDocs}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, autoRefreshDocs: v })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <Label>سطح لاگ</Label>
                    <p className="text-xs text-muted-foreground">
                      میزان جزئیات لاگ‌های سیستمی
                    </p>
                  </div>
                  <Select
                    value={settings.logLevel}
                    onValueChange={(v) =>
                      setSettings({ ...settings, logLevel: v as any })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug (جزئیات کامل)</SelectItem>
                      <SelectItem value="info">Info (اطلاعات)</SelectItem>
                      <SelectItem value="warn">
                        Warning (فقط هشدارها)
                      </SelectItem>
                      <SelectItem value="error">Error (فقط خطاها)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "api" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  تنظیمات Webhook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <Label>تعداد تلاش مجدد</Label>
                    <p className="text-xs text-muted-foreground">
                      تعداد دفعات تلاش مجدد در صورت شکست Webhook
                    </p>
                  </div>
                  <Select
                    value={settings.webhookRetryCount.toString()}
                    onValueChange={(v) =>
                      setSettings({
                        ...settings,
                        webhookRetryCount: parseInt(v),
                      })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">بدون تلاش مجدد</SelectItem>
                      <SelectItem value="3">۳ بار</SelectItem>
                      <SelectItem value="5">۵ بار</SelectItem>
                      <SelectItem value="10">۱۰ بار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <Label>زمان انتظار (ثانیه)</Label>
                    <p className="text-xs text-muted-foreground">
                      حداکثر زمان انتظار برای پاسخ Webhook
                    </p>
                  </div>
                  <Select
                    value={settings.webhookTimeout.toString()}
                    onValueChange={(v) =>
                      setSettings({ ...settings, webhookTimeout: parseInt(v) })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">۵ ثانیه</SelectItem>
                      <SelectItem value="10">۱۰ ثانیه</SelectItem>
                      <SelectItem value="30">۳۰ ثانیه</SelectItem>
                      <SelectItem value="60">۶۰ ثانیه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* توکن واقعی */}
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      توکن دسترسی (JWT)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs bg-background p-2 rounded flex-1 font-mono break-all">
                      {showToken
                        ? token
                        : token
                          ? "••••••••••••••••••••••••"
                          : "توکن یافت نشد"}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowToken(!showToken)}
                      disabled={!token}
                    >
                      {showToken ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={handleRefreshToken}
                    >
                      <RefreshCw className="w-4 h-4" />
                      تازه‌سازی
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    این توکن برای احراز هویت در API استفاده می‌شود.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  امنیت حساب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActiveSessions />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Tabs */}
        <div className="md:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-muted-foreground hover:bg-orange-100 dark:hover:bg-orange-500/10 hover:text-orange-600"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* دکمه‌های ذخیره و بازنشانی */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <Save className="w-4 h-4" />
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
        </Button>
        <Button onClick={handleReset} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          بازنشانی به پیش‌فرض
        </Button>
      </div>
    </div>
  );
}