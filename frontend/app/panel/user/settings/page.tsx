"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Moon,
  Shield,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  Mail,
  Smartphone,
  Megaphone,
  AlertCircle,
  MessageSquare,
  Palette,
  Languages,
  Lock,
  Monitor,
  Tablet,
  LogOut,
  BellOff,
  CheckCircle2,
  CheckCircle,
} from "lucide-react";
import apiClient from "@/services/api/client";
import ActiveSessions from "@/components/ui/ActiveSessions";

// ========================
// انواع داده
// ========================
interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  newAdAlerts: boolean;
  adStatusAlerts: boolean;
  messageAlerts: boolean;
  messageAlertSchedule: string;
}

interface Session {
  _id: string;
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

const tabs = [
  { id: "notifications", label: "اعلان‌ها", icon: Bell },
  { id: "appearance", label: "ظاهر", icon: Palette },
  { id: "security", label: "امنیت", icon: Shield },
];

// ⭐ تابع کمکی برای نمایش toast شیک
const showToggleToast = (label: string, checked: boolean) => {
  const Icon = checked ? CheckCircle : BellOff;
  const iconColor = checked ? "#10b981" : "#f59e0b";
  const bg = checked ? "#ecfdf5" : "#fefce8";
  const borderColor = checked ? "#10b981" : "#f59e0b";

  toast(
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Icon size={18} color={iconColor} />
      <span>{label}</span>
    </div>,
    {
      style: {
        background: bg,
        border: `1px solid ${borderColor}`,
        color: "#1e293b",
        fontWeight: 600,
        fontSize: "0.9rem",
        borderRadius: "12px",
        padding: "12px 16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      },
      duration: 3000,
    },
  );
};

export default function VipSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    newAdAlerts: true,
    adStatusAlerts: true,
    messageAlerts: true,
    messageAlertSchedule: "always",
  });
  const [appearance, setAppearance] = useState({
    darkMode: false,
    rtl: true,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // --- نشست‌ها ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );
  const [revokingAll, setRevokingAll] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showPasswordConfirmDialog, setShowPasswordConfirmDialog] =
    useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSessions();
    const isDark = localStorage.getItem("theme") === "dark";
    setAppearance((prev) => ({ ...prev, darkMode: isDark }));
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/notifications/settings");
      const data = response.data.data;
      setSettings({
        emailNotifications: data.emailNotifications ?? true,
        smsNotifications: data.smsNotifications ?? false,
        marketingEmails: data.marketingEmails ?? false,
        newAdAlerts: data.newAdAlerts ?? true,
        adStatusAlerts: data.adStatusAlerts ?? true,
        messageAlerts: data.messageAlerts ?? true,
        messageAlertSchedule: data.messageAlertSchedule || "always",
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await apiClient.get("/users/sessions");
      setSessions(response.data.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("خطا در دریافت نشست‌های فعال");
    } finally {
      setSessionsLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !appearance.darkMode;
    setAppearance({ ...appearance, darkMode: newDarkMode });
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    toast.success(newDarkMode ? "حالت تاریک فعال شد" : "حالت روشن فعال شد");
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await apiClient.put("/notifications/settings", settings);
      toast.success("تنظیمات اعلان‌ها با موفقیت ذخیره شد");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppearance = () => {
    toast.success("تنظیمات ظاهر با موفقیت ذخیره شد");
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("رمز عبور جدید و تکرار آن مطابقت ندارند");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }

    setSaving(true);
    try {
      await apiClient.post("/users/profile/change-password", {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در تغییر رمز عبور");
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await apiClient.delete(`/users/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      toast.success("نشست مورد نظر با موفقیت لغو شد");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در لغو نشست");
    } finally {
      setRevokingSessionId(null);
      setShowRevokeDialog(false);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setRevokingAll(true);
    try {
      await apiClient.delete("/users/sessions", { data: { allOther: true } });
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("همه دستگاه‌های دیگر از حساب خارج شدند");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در لغو نشست‌ها");
    } finally {
      setRevokingAll(false);
    }
  };

  const openRevokeDialog = (session: Session) => {
    setSessionToRevoke(session);
    setShowRevokeDialog(true);
  };

  const getDeviceIcon = (session: Session) => {
    const device = session.device?.toLowerCase() || "";
    if (device.includes("iphone") || device.includes("android"))
      return <Smartphone className="w-5 h-5" />;
    if (device.includes("ipad") || device.includes("tablet"))
      return <Tablet className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="space-y-8 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      dir="rtl"
    >
      {/* هدر شیشه‌ای */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent p-6 sm:p-8 backdrop-blur-sm border border-primary/10 shadow-sm"
      >
        <div className="relative flex items-center gap-4 sm:gap-5">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Settings className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              تنظیمات حساب
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              مدیریت اعلان‌ها، ظاهر و امنیت حساب کاربری
            </p>
          </div>
        </div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* نوار تب‌ها */}
        <div className="lg:w-64 shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* محتوای تب‌ها */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      تنظیمات اعلان‌ها
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      نحوه و زمان دریافت اطلاع‌رسانی‌ها را شخصی‌سازی کنید
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-8 px-6 pb-6">
                    {/* ---- راه‌های ارتباطی ---- */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-sm">راه‌های ارتباطی</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* اعلان ایمیلی */}
                        <div className="p-5 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Mail className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <Label className="font-semibold">
                                  اعلان ایمیلی
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  دریافت اعلان‌ها از طریق ایمیل
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={settings.emailNotifications}
                              onCheckedChange={(checked) => {
                                setSettings({
                                  ...settings,
                                  emailNotifications: checked,
                                });
                                showToggleToast("اعلان ایمیلی", checked);
                              }}
                            />
                          </div>
                        </div>

                        {/* اعلان پیامکی */}
                        <div className="p-5 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Smartphone className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <Label className="font-semibold">
                                  اعلان پیامکی
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  دریافت پیامک برای رویدادهای مهم
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={settings.smsNotifications}
                              onCheckedChange={(checked) => {
                                setSettings({
                                  ...settings,
                                  smsNotifications: checked,
                                });
                                showToggleToast("اعلان پیامکی", checked);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* ---- فعالیت آگهی ---- */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <Megaphone className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-sm">فعالیت آگهی‌ها</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* آگهی‌های جدید */}
                        <div className="p-5 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Megaphone className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <Label className="font-semibold">
                                  آگهی‌های جدید
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  هنگام انتشار آگهی جدید در دسته‌های منتخب
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={settings.newAdAlerts}
                              onCheckedChange={(checked) => {
                                setSettings({
                                  ...settings,
                                  newAdAlerts: checked,
                                });
                                showToggleToast("اعلان آگهی‌های جدید", checked);
                              }}
                            />
                          </div>
                        </div>

                        {/* تغییر وضعیت آگهی */}
                        <div className="p-5 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <Label className="font-semibold">
                                  وضعیت آگهی
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  تأیید، رد یا تغییر وضعیت آگهی‌های شما
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={settings.adStatusAlerts}
                              onCheckedChange={(checked) => {
                                setSettings({
                                  ...settings,
                                  adStatusAlerts: checked,
                                });
                                showToggleToast("اعلان وضعیت آگهی", checked);
                              }}
                            />
                          </div>
                        </div>

                        {/* پیام‌های جدید */}
                        <div className="p-5 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/30 transition-all md:col-span-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <Label className="font-semibold">
                                  پیام‌های جدید
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  اعلان پیام‌های دریافتی در چت داخلی
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <select
                                className="text-xs bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={settings.messageAlertSchedule}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    messageAlertSchedule: e.target.value,
                                  })
                                }
                              >
                                <option value="always">همیشه</option>
                                <option value="daytime">
                                  فقط در روز (۸ صبح تا ۱۰ شب)
                                </option>
                                <option value="working_hours">
                                  ساعات کاری (۹ تا ۱۸)
                                </option>
                              </select>
                              <Switch
                                checked={settings.messageAlerts}
                                onCheckedChange={(checked) => {
                                  setSettings({
                                    ...settings,
                                    messageAlerts: checked,
                                  });
                                  showToggleToast(
                                    "اعلان پیام‌های جدید",
                                    checked,
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleSaveNotifications}
                        disabled={saving}
                        className="gap-2 min-w-[140px]"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        ذخیره تنظیمات
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="w-5 h-5 text-primary" />
                      </div>
                      تنظیمات ظاهر
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 px-6 pb-6">
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Moon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <Label className="font-semibold">حالت تاریک</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            تغییر پوسته به رنگ‌های تیره
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={appearance.darkMode}
                        onCheckedChange={toggleDarkMode}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Languages className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <Label className="font-semibold">جهت راست‌چین</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            فعال بودن پیش‌فرض (فارسی)
                          </p>
                        </div>
                      </div>
                      <Switch checked={appearance.rtl} disabled />
                    </div>

                    <Separator />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleSaveAppearance}
                        className="gap-2 min-w-[140px]"
                      >
                        <Save className="w-4 h-4" />
                        ذخیره تنظیمات
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      تنظیمات امنیتی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 px-6 pb-6">
                    {/* ========== تغییر رمز عبور ========== */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Lock className="w-4 h-4 text-primary" />
                        تغییر رمز عبور
                      </div>

                      <div className="space-y-4">
                        {/* رمز فعلی */}
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="رمز عبور فعلی"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                            className="pl-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* رمز جدید */}
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="رمز عبور جدید"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                            className="pl-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* تکرار رمز جدید */}
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="تکرار رمز عبور جدید"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="pl-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          {showPassword ? "مخفی کردن رمز" : "نمایش رمزها"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setShowPasswordConfirmDialog(true)}
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          تغییر رمز عبور
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* نشست‌های فعال */}
                    <div className="space-y-4">
                      <ActiveSessions />
                    </div>
                  </CardContent>
                </Card>

                {/* ========== دیالوگ تأیید تغییر رمز عبور ========== */}
                <Dialog
                  open={showPasswordConfirmDialog}
                  onOpenChange={setShowPasswordConfirmDialog}
                >
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        تأیید تغییر رمز عبور
                      </DialogTitle>
                      <DialogDescription>
                        آیا مطمئن هستید می‌خواهید رمز عبور خود را تغییر دهید؟
                        <br />
                        پس از تغییر رمز، برای ورود مجدد باید از رمز جدید استفاده
                        کنید.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={() => setShowPasswordConfirmDialog(false)}
                      >
                        انصراف
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          handleChangePassword();
                          setShowPasswordConfirmDialog(false);
                        }}
                        className="gap-2"
                      >
                        <Save className="w-4 h-4" />
                        بله، تغییر بده
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* ========== مودال موفقیت تغییر رمز ========== */}
                <Dialog
                  open={showSuccessModal}
                  onOpenChange={setShowSuccessModal}
                >
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-green-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0a9 9 0 0118 0z"
                          />
                        </svg>
                        رمز عبور با موفقیت تغییر کرد
                      </DialogTitle>
                      <DialogDescription className="pt-2">
                        رمز عبور جدید شما با موفقیت ذخیره شد. از این پس برای
                        ورود از رمز جدید استفاده کنید.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        type="button"
                        onClick={() => setShowSuccessModal(false)}
                        className="gap-2"
                      >
                        متوجه شدم
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* دیالوگ لغو نشست */}
                <Dialog
                  open={showRevokeDialog}
                  onOpenChange={setShowRevokeDialog}
                >
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <LogOut className="w-5 h-5 text-destructive" />
                        لغو نشست
                      </DialogTitle>
                      <DialogDescription>
                        آیا مطمئن هستید می‌خواهید این دستگاه از حساب خارج شود؟
                        {sessionToRevoke && (
                          <span className="block mt-1 text-foreground font-medium">
                            {sessionToRevoke.device} - {sessionToRevoke.browser}
                          </span>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={() => setShowRevokeDialog(false)}
                      >
                        انصراف
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          sessionToRevoke &&
                          handleRevokeSession(sessionToRevoke._id)
                        }
                        disabled={revokingSessionId === sessionToRevoke?._id}
                      >
                        {revokingSessionId === sessionToRevoke?._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        خروج دستگاه
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
