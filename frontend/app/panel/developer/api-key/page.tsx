// frontend/app/panel/developer/api-key/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { toast } from "sonner";

export default function ApiKeyPage() {
  const { keys, loading, createKey, deleteKey, regenerateKey } = useApiKeys();
  const [showDialog, setShowDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState("90");
  const [creating, setCreating] = useState(false);
  const [newPlainKey, setNewPlainKey] = useState<string | null>(null);

  const toggleVis = (id: string) =>
    setVisibleKeys((p) => ({ ...p, [id]: !p[id] }));

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("کپی شد!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return toast.error("نام کلید الزامی است");
    if (selectedScopes.length === 0)
      return toast.error("حداقل یک دسترسی انتخاب کنید");
    setCreating(true);
    try {
      const result = await createKey({
        name: newKeyName,
        scopes: selectedScopes,
        expiresInDays: parseInt(expiresInDays) || 90,
      });
      setNewPlainKey(result?.plainKey || result?.newKey || null);
      setNewKeyName("");
      setSelectedScopes([]);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "خطا در ساخت کلید");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این کلید مطمئنید؟")) return;
    await deleteKey(id);
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm("کلید قبلی غیرفعال می‌شود. ادامه می‌دهید؟")) return;
    const result = await regenerateKey(id);
    if (result?.newKey) setNewPlainKey(result.newKey);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      active: {
        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
        label: "فعال",
      },
      inactive: {
        cls: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400",
        label: "غیرفعال",
      },
      expired: {
        cls: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
        label: "منقضی",
      },
    };
    const m = map[s] || { cls: "bg-gray-100 text-gray-600", label: s };
    return <Badge className={`${m.cls} border-0 text-xs`}>{m.label}</Badge>;
  };

  const scopeLabel = (s: string) => {
    const map: Record<string, string> = {
      "ads:read": "خواندن آگهی‌ها",
      "ads:write": "نوشتن آگهی‌ها",
      "users:read": "خواندن کاربران",
      "users:write": "نوشتن کاربران",
      "api-keys:read": "خواندن کلیدها",
      "api-keys:write": "نوشتن کلیدها",
      "webhooks:read": "خواندن وب‌هوک",
      "webhooks:write": "نوشتن وب‌هوک",
      read: "خواندن",
      write: "نوشتن",
      delete: "حذف",
      admin: "مدیریت",
    };
    return map[s] || s;
  };

  const isExpired = (exp: string | null) => exp && new Date(exp) < new Date();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-orange-500" /> کلیدهای API
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            مدیریت کلیدهای دسترسی به API ({keys.length} کلید)
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" /> کلید جدید
        </Button>
      </div>

      {/* لیست */}
      {keys.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Key className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">هیچ کلید API ندارید</p>
            <Button variant="link" onClick={() => setShowDialog(true)}>
              ساخت اولین کلید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => {
            const expired = isExpired(key.expiresAt);
            return (
              <Card
                key={key._id}
                className="hover:shadow-md transition-all border-border/40"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* نام + وضعیت */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg">{key.name}</h3>
                        {statusBadge(expired ? "expired" : key.status)}
                      </div>
                      {/* کلید */}
                      <div className="mt-2 flex items-center gap-2">
                        <code className="text-sm bg-muted px-3 py-1.5 rounded-lg font-mono select-all max-w-[400px] truncate">
                          {visibleKeys[key._id]
                            ? key.keyPrefix
                            : `${key.keyPrefix?.slice(0, 8)}••••••••••••••••••`}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => toggleVis(key._id)}
                        >
                          {visibleKeys[key._id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copy(key.keyPrefix, key._id)}
                        >
                          {copiedId === key._id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {/* متادیتا */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground">
                        <span>
                          ساخت:{" "}
                          {new Date(key.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                        {key.lastUsedAt && (
                          <span>
                            آخرین استفاده:{" "}
                            {new Date(key.lastUsedAt).toLocaleDateString(
                              "fa-IR",
                            )}
                          </span>
                        )}
                        {key.requestCount !== undefined && (
                          <span>
                            {key.requestCount.toLocaleString("fa-IR")} درخواست
                          </span>
                        )}
                        {key.expiresAt && (
                          <span
                            className={
                              expired ? "text-red-500 font-medium" : ""
                            }
                          >
                            انقضا:{" "}
                            {new Date(key.expiresAt).toLocaleDateString(
                              "fa-IR",
                            )}
                          </span>
                        )}
                      </div>
                      {/* Scopes */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {key.scopes.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">
                            {scopeLabel(s)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {/* اکشن‌ها */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerate(key._id)}
                        className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> بازسازی
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(key._id)}
                        className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* مودال ساخت */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">ساخت کلید API جدید</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowDialog(false);
                    setNewPlainKey(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {!newPlainKey ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      نام کلید *
                    </label>
                    <Input
                      placeholder="مثال: وب‌سایت فروشگاه"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      مدت انقضا (روز)
                    </label>
                    <Input
                      type="number"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      دسترسی‌ها *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: "ads:read", label: "خواندن آگهی‌ها" },
                        { val: "ads:write", label: "نوشتن آگهی‌ها" },
                        { val: "users:read", label: "خواندن کاربران" },
                        { val: "api-keys:read", label: "خواندن کلیدها" },
                        { val: "api-keys:write", label: "نوشتن کلیدها" },
                        { val: "webhooks:read", label: "خواندن وب‌هوک" },
                        { val: "webhooks:write", label: "نوشتن وب‌هوک" },
                      ].map((s) => (
                        <label
                          key={s.val}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${selectedScopes.includes(s.val) ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10" : "border-border hover:border-orange-300"}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedScopes.includes(s.val)}
                            onChange={(e) =>
                              setSelectedScopes(
                                e.target.checked
                                  ? [...selectedScopes, s.val]
                                  : selectedScopes.filter((x) => x !== s.val),
                              )
                            }
                            className="accent-orange-500"
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      {creating ? "در حال ساخت..." : "ساخت کلید"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDialog(false)}
                      className="flex-1"
                    >
                      انصراف
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                      کلید جدید ساخته شد!
                    </p>
                    <code className="text-xs block bg-white dark:bg-card p-3 rounded-lg break-all select-all font-mono border">
                      {newPlainKey}
                    </code>
                    <p className="text-xs text-red-500 mt-3 font-medium">
                      ⚠️ این کلید فقط همین یک بار نمایش داده می‌شود. حتماً کپی
                      کنید.
                    </p>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      copy(newPlainKey, "new");
                      setShowDialog(false);
                      setNewPlainKey(null);
                    }}
                  >
                    <Copy className="w-4 h-4" /> کپی و بستن
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
