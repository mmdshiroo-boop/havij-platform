"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Play,
  Eye,
  EyeOff,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Globe,
  Clock,
} from "lucide-react";
import { useWebhooks } from "@/hooks/useWebhooks";
import { toast } from "sonner";

const eventLabels: Record<string, string> = {
  "ad.created": "آگهی جدید",
  "ad.updated": "ویرایش آگهی",
  "ad.deleted": "حذف آگهی",
  "ad.approved": "تایید آگهی",
  "user.registered": "ثبت نام کاربر",
  "user.updated": "ویرایش پروفایل",
};

const statusConfig: Record<string, { label: string; cls: string; icon: any }> =
  {
    active: {
      label: "فعال",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-0",
      icon: CheckCircle2,
    },
    inactive: {
      label: "غیرفعال",
      cls: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400 border-0",
      icon: XCircle,
    },
    failed: {
      label: "خطا",
      cls: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-0",
      icon: AlertTriangle,
    },
  };

export default function WebhooksPage() {
  const { webhooks, loading, deleteWebhook, regenerateSecret, testWebhook } =
    useWebhooks();
  const [showCreate, setShowCreate] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<
    Record<string, string | null>
  >({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const setAction = (id: string, action: string) => {
    setActionLoading((p) => ({ ...p, [id]: action }));
    setTimeout(() => setActionLoading((p) => ({ ...p, [id]: null })), 5000);
  };

  const handleTest = async (id: string, name: string) => {
    setAction(id, "test");
    try {
      const res = await testWebhook(id);
      toast.success(`تست وب‌هوک "${name}" ارسال شد`, {
        description: "پاسخ موفق دریافت شد",
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      });
    } catch (e: any) {
      toast.error(`تست وب‌هوک "${name}" ناموفق`, {
        description: e?.response?.data?.error || "خطای شبکه",
      });
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const handleRegenerate = async (id: string, name: string) => {
    setAction(id, "regen");
    try {
      await regenerateSecret(id);
      toast.success(`Secret وب‌هوک "${name}" بازسازی شد`, {
        description: "Secret قبلی دیگر معتبر نیست",
        icon: <RefreshCw className="w-5 h-5 text-orange-500" />,
      });
    } catch (e: any) {
      toast.error(`خطا در بازسازی Secret`, {
        description: e?.response?.data?.error || "",
      });
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setAction(id, "delete");
    try {
      await deleteWebhook(id);
      toast.success(`وب‌هوک "${name}" حذف شد`, {
        icon: <Trash2 className="w-5 h-5 text-red-500" />,
      });
    } catch (e: any) {
      toast.error(`خطا در حذف وب‌هوک`, {
        description: e?.response?.data?.error || "",
      });
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const copySecret = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Secret کپی شد");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6 p-4 md:p-8" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100/70 dark:bg-orange-500/10 rounded-2xl border border-orange-200/50 dark:border-orange-500/20">
            <Webhook className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Webhook‌ها</h1>
            <p className="text-muted-foreground text-sm">
              مدیریت رویدادهای سیستمی ({webhooks.length} وب‌هوک)
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" /> وب‌هوک جدید
        </Button>
      </div>

      {/* لیست */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Webhook className="w-14 h-14 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground mb-1">هیچ وب‌هوکی ندارید</p>
            <p className="text-xs text-muted-foreground mb-4">
              رویدادهای سیستم رو به سرورتون ارسال کنید
            </p>
            <Button
              variant="outline"
              onClick={() => setShowCreate(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> ساخت اولین وب‌هوک
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook: any) => {
            const sc = statusConfig[webhook.status] || statusConfig.active;
            const action = actionLoading[webhook._id || webhook.id];
            return (
              <motion.div
                key={webhook._id || webhook.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-all border-border/40">
                  <CardContent className="p-5 space-y-4">
                    {/* هدر */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="p-1.5 rounded-lg bg-muted/50">
                          <sc.icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-lg">{webhook.name}</h3>
                        <Badge className={`${sc.cls} text-xs`}>
                          {sc.label}
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!action}
                          onClick={() =>
                            handleTest(webhook._id || webhook.id, webhook.name)
                          }
                          className="gap-1.5 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-500/20 dark:hover:bg-emerald-500/10"
                        >
                          {action === "test" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          {action === "test" ? "در حال تست..." : "تست ارسال"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!action}
                          onClick={() =>
                            handleRegenerate(
                              webhook._id || webhook.id,
                              webhook.name,
                            )
                          }
                          className="gap-1.5 border-orange-200 hover:bg-orange-50 dark:border-orange-500/20 dark:hover:bg-orange-500/10 text-orange-600"
                        >
                          {action === "regen" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          {action === "regen"
                            ? "در حال بازسازی..."
                            : "بازسازی Secret"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!action}
                          onClick={() =>
                            handleDelete(
                              webhook._id || webhook.id,
                              webhook.name,
                            )
                          }
                          className="gap-1.5 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10 text-red-500"
                        >
                          {action === "delete" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          حذف
                        </Button>
                      </div>
                    </div>

                    {/* URL */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Endpoint URL
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted/80 px-3 py-2 rounded-lg flex-1 break-all font-mono">
                          {webhook.url}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(webhook.url);
                            toast.success("URL کپی شد");
                          }}
                        >
                          {copiedId === `url-${webhook._id}` ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Secret */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Signing Secret
                      </p>
                      <div className="flex items-center gap-2">
                        <code
                          className="text-sm bg-muted/80 px-3 py-2 rounded-lg flex-1 font-mono select-all"
                          dir="ltr"
                        >
                          {showSecrets[webhook._id]
                            ? webhook.secret
                            : "••••••••••••••••••••••••••••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() =>
                            setShowSecrets((p) => ({
                              ...p,
                              [webhook._id]: !p[webhook._id],
                            }))
                          }
                        >
                          {showSecrets[webhook._id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() =>
                            copySecret(webhook.secret, webhook._id)
                          }
                        >
                          {copiedId === webhook._id ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* رویدادها */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        رویدادهای فعال
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event: string) => (
                          <Badge
                            key={event}
                            variant="outline"
                            className="text-xs border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/5"
                          >
                            {eventLabels[event] || event}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* آمار */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-3 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {new Date(webhook.createdAt).toLocaleDateString(
                          "fa-IR",
                        )}
                      </span>
                      <span>
                        ارسال:{" "}
                        <span className="font-medium text-foreground">
                          {webhook.deliveryCount}
                        </span>
                      </span>
                      <span className="text-emerald-600">
                        موفق:{" "}
                        <span className="font-bold">
                          {webhook.successCount}
                        </span>
                      </span>
                      <span className="text-red-500">
                        ناموفق:{" "}
                        <span className="font-bold">
                          {webhook.failureCount}
                        </span>
                      </span>
                      {webhook.lastError && (
                        <span className="text-red-500">
                          آخرین خطا: {webhook.lastError}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* مودال ساخت */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <CreateDialog onClose={() => setShowCreate(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const { createWebhook } = useWebhooks();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const allEvents = [
    { value: "ad.created", label: "آگهی جدید" },
    { value: "ad.updated", label: "ویرایش آگهی" },
    { value: "ad.deleted", label: "حذف آگهی" },
    { value: "ad.approved", label: "تایید آگهی" },
    { value: "user.registered", label: "ثبت نام کاربر" },
    { value: "user.updated", label: "ویرایش پروفایل" },
  ];

  const toggle = (v: string) =>
    setEvents((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("نام وب‌هوک الزامی است");
    if (!url.trim() || !url.startsWith("https://"))
      return toast.error("URL باید با https:// شروع شود");
    if (events.length === 0) return toast.error("حداقل یک رویداد انتخاب کنید");
    setLoading(true);
    try {
      await createWebhook(name, url, events);
      toast.success(`وب‌هوک "${name}" ساخته شد`, {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      });
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "خطا در ساخت وب‌هوک");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">ساخت وب‌هوک جدید</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            نام وب‌هوک *
          </label>
          <Input
            placeholder="مثال: سرور فروشگاه"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Endpoint URL *
          </label>
          <Input
            placeholder="https://example.com/webhook"
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">رویدادها *</label>
          <div className="grid grid-cols-2 gap-2">
            {allEvents.map((e) => (
              <button
                key={e.value}
                onClick={() => toggle(e.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all text-right ${
                  events.includes(e.value)
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                    : "border-border hover:border-orange-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    events.includes(e.value)
                      ? "bg-orange-500 border-orange-500"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {events.includes(e.value) && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                {e.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-orange-600 hover:bg-orange-700 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> در حال ساخت...
              </>
            ) : (
              "ساخت وب‌هوک"
            )}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            انصراف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
