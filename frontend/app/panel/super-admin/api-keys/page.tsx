"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "@/services/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Copy,
  Key,
  Search,
  RefreshCw,
  Eye,
  RotateCw,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

// ─── تایپ هماهنگ ────────
interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: "active" | "inactive" | "expired";
  lastUsedAt?: string;
  expiresAt?: string;
  requestCount: number;
  createdAt: string;
}

const SCOPE_OPTIONS = ["read", "write", "delete", "admin"];

const formatNum = (num: number | undefined | null) => {
  if (num === undefined || num === null) return "0";
  return num.toLocaleString("en-US");
};

// ─── نمایش کلید جدید (هنگام ساخت) ─────────────────
const NewKeyDisplay = ({ plainKey }: { plainKey: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainKey);
      setCopied(true);
      toast.success("کلید کپی شد");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("کپی ناموفق");
    }
  };
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
      <code className="text-xs font-mono flex-1 break-all text-primary font-bold">
        {plainKey}
      </code>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="rounded-lg"
      >
        <Copy className="w-3.5 h-3.5 ml-1" />
        {copied ? "کپی شد" : "کپی"}
      </Button>
    </div>
  );
};

// ─── فرم ایجاد کلید ──────────────────────────────
const CreateApiKeyForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read"]);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [newPlainKey, setNewPlainKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const payload: any = { name: name.trim(), scopes };
      if (expiresInDays && expiresInDays > 0)
        payload.expiresInDays = expiresInDays;

      const { data } = await axios.post("/developer/api-keys", payload);
      if (data.plainKey) {
        setNewPlainKey(data.plainKey);
        toast.success("کلید جدید با موفقیت ساخته شد.");
      } else {
        toast.success("کلید ایجاد شد");
        handleClose();
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ایجاد کلید");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setName("");
    setScopes(["read"]);
    setExpiresInDays(undefined);
    setNewPlainKey(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> ایجاد کلید جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            ایجاد کلید API جدید
          </DialogTitle>
        </DialogHeader>
        {newPlainKey ? (
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-amber-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                این کلید فقط <strong>یک‌بار</strong> نمایش داده می‌شود. حتماً آن
                را کپی کرده و برای تست یا استفاده ذخیره کنید.
              </span>
            </div>
            <NewKeyDisplay plainKey={newPlainKey} />
            <Button
              className="w-full rounded-xl font-bold"
              onClick={() => {
                handleClose();
                onSuccess();
              }}
            >
              تأیید و بازگشت به لیست
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">نام کلید / برنامه‌ کاربردی</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثلاً: اپلیکیشن موبایل / سرور تست"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>دسترسی‌ها (Scopes)</Label>
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-xl border">
                {SCOPE_OPTIONS.map((scope) => (
                  <div key={scope} className="flex items-center gap-2">
                    <Checkbox
                      id={`scope-${scope}`}
                      checked={scopes.includes(scope)}
                      onCheckedChange={(checked) => {
                        if (checked) setScopes([...scopes, scope]);
                        else setScopes(scopes.filter((s) => s !== scope));
                      }}
                    />
                    <Label
                      htmlFor={`scope-${scope}`}
                      className="text-sm cursor-pointer"
                    >
                      {scope}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">مدت اعتبار</Label>
              <Select
                onValueChange={(val) =>
                  setExpiresInDays(val === "never" ? undefined : Number(val))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="بدون انقضا" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="never">بدون انقضا</SelectItem>
                  <SelectItem value="30">30 روز</SelectItem>
                  <SelectItem value="90">90 روز</SelectItem>
                  <SelectItem value="180">180 روز</SelectItem>
                  <SelectItem value="365">365 روز</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-xl"
              >
                انصراف
              </Button>
              <Button type="submit" disabled={loading} className="rounded-xl">
                {loading ? "در حال ایجاد..." : "ایجاد کلید"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── ویرایش کلید ─────────────────────────────────
const EditApiKeyForm = ({
  apiKey,
  onSuccess,
}: {
  apiKey: ApiKeyData;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(apiKey.name);
  const [scopes, setScopes] = useState<string[]>(apiKey.scopes);
  const [status, setStatus] = useState(apiKey.status);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(apiKey.name);
    setScopes(apiKey.scopes);
    setStatus(apiKey.status);
  }, [apiKey, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.patch(`/developer/api-keys/${apiKey.id}`, {
        name: name.trim(),
        scopes,
        status,
      });
      toast.success("کلید بروزرسانی شد");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ویرایش");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>ویرایش کلید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>نام کلید</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>دسترسی‌ها</Label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-muted/20 rounded-xl border">
              {SCOPE_OPTIONS.map((scope) => (
                <div key={scope} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-scope-${scope}`}
                    checked={scopes.includes(scope)}
                    onCheckedChange={(c) => {
                      if (c) setScopes([...scopes, scope]);
                      else setScopes(scopes.filter((s) => s !== scope));
                    }}
                  />
                  <Label
                    htmlFor={`edit-scope-${scope}`}
                    className="cursor-pointer"
                  >
                    {scope}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>وضعیت</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as any)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              انصراف
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl">
              ذخیره
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── تست کلید API (درخواست شفاف و مستقل بدون توکن ادمین) ──────────────
const TestApiKeyDialog = ({ apiKeyName }: { apiKeyName: string }) => {
  const [open, setOpen] = useState(false);
  const [plainKey, setPlainKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(10);
  const [result, setResult] = useState<{
    valid: boolean;
    message: string;
    ads?: any[];
  } | null>(null);
  // ─── تابع هوشمند تشخیص و نمایش قیمت ───
  const renderAdPrice = (ad: any) => {
    // 1. بررسی فیلدهای مختلف قیمت
    const rawPrice =
      ad.price ?? ad.totalPrice ?? ad.priceAmount ?? ad.details?.price;

    // 2. اگر آگهی رهن و اجاره باشد
    if (ad.depositPrice || ad.rentPrice) {
      const deposit = ad.depositPrice
        ? `${formatNum(ad.depositPrice)} ودیعه`
        : "";
      const rent = ad.rentPrice ? `${formatNum(ad.rentPrice)} اجاره` : "";
      return [deposit, rent].filter(Boolean).join(" / ");
    }

    // 3. اگر قیمت عددی معتبر و بزرگتر از 0 باشد
    if (typeof rawPrice === "number" && rawPrice > 0) {
      return `${formatNum(rawPrice)} تومان`;
    }

    // 4. اگر قیمت به صورت متن ارسال شده باشد (مثلاً "توافقی")
    if (
      typeof rawPrice === "string" &&
      rawPrice.trim() !== "" &&
      rawPrice !== "0"
    ) {
      return rawPrice;
    }

    // 5. در غیر این صورت، قیمت توافقی است
    return "توافقی";
  };
  const handleTest = async () => {
    const trimmedKey = plainKey.trim();
    if (!trimmedKey) {
      toast.error("لطفاً کلید اصلی را وارد کنید");
      return;
    }

    if (trimmedKey.includes("****")) {
      toast.error(
        "پیشوند کلید قابل تست نیست! باید کلید کامل ساخت‌شده را وارد کنید.",
      );
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // استفاده از fetch خالص بدون هدرهای Axios و Bearer
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      // 1. تست اعتبار کلید
      const testRes = await fetch(`${baseUrl}/public/test-api-key`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": trimmedKey,
        },
      });

      const testData = await testRes.json();

      if (!testRes.ok || !testData.success) {
        setResult({
          valid: false,
          message:
            testData.error ||
            testData.message ||
            "کلید نامعتبر است یا منقضی شده است",
        });
        return;
      }

      // 2. دریافت آگهی‌ها با کلید
      const adsRes = await fetch(`${baseUrl}/public/ads?limit=${limit}`, {
        headers: {
          "x-api-key": trimmedKey,
        },
      });
      const adsData = await adsRes.json();

      setResult({
        valid: true,
        message: "کلید معتبر است و ارتباط با سرویس برقرار شد.",
        ads: adsData.data || [],
      });
    } catch (error: any) {
      setResult({
        valid: false,
        message:
          "خطا در برقراری ارتباط با سرور: " +
          (error.message || "بررسی کنید آیا بک‌اند روشن است"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary rounded-lg"
        >
          <Play className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-500" />
            تست عملکرد کلید ({apiKeyName})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs text-muted-foreground leading-relaxed">
            💡 <strong>راهنما:</strong> کد اصلی را که هنگام ساخت کپی کرده‌اید در
            کادر زیر وارد کنید. (کد ناقص مانند{" "}
            <code className="bg-muted px-1 py-0.5 rounded">
              divar_dev_...****
            </code>{" "}
            کار نخواهد کرد).
          </div>

          <div className="space-y-2">
            <Label>کلید کامل (Plain Key)</Label>
            <Input
              value={plainKey}
              onChange={(e) => setPlainKey(e.target.value)}
              placeholder="مثال: divar_dev_8f91a2b3c4..."
              dir="ltr"
              className="font-mono rounded-xl text-xs"
            />
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
              <Skeleton className="h-4 w-4 rounded-full animate-spin" />
              در حال تست کلید روی سرور...
            </div>
          )}

          {result && (
            <>
              <div
                className={`p-3.5 rounded-xl flex items-center gap-2 text-sm ${
                  result.valid
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                }`}
              >
                {result.valid ? (
                  <CheckCircle className="w-5 h-5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="font-bold">{result.message}</span>
              </div>

              {result.valid && result.ads && result.ads.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">
                    آگهی‌های دریافت‌شده با این کلید (
                    {formatNum(result.ads.length)})
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto p-1">
                    {result.ads.map((ad: any, idx: number) => (
                      <div
                        key={ad._id || ad.id || idx}
                        className="border rounded-xl p-3 bg-muted/20 flex justify-between items-center text-xs"
                      >
                        <span className="font-bold truncate max-w-[250px]">
                          {ad.title}
                        </span>
                        <span
                          className={`font-mono font-bold text-xs px-2 py-1 rounded-md ${
                            renderAdPrice(ad) === "توافقی"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}
                        >
                          {renderAdPrice(ad)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between items-center border-t pt-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">تعداد آگهی:</Label>
              <Select
                value={String(limit)}
                onValueChange={(val) => setLimit(Number(val))}
              >
                <SelectTrigger className="w-[100px] h-8 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 آگهی</SelectItem>
                  <SelectItem value="50">50 آگهی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-xl"
              >
                بستن
              </Button>
              <Button
                onClick={handleTest}
                disabled={loading}
                className="rounded-xl gap-1"
              >
                <Play className="w-3.5 h-3.5 ml-1" /> اجرا و تست
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── تأیید حذف ──────────────────────────────────
const DeleteKeyAlert = ({
  id,
  name,
  onSuccess,
}: {
  id: string;
  name: string;
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/developer/api-keys/${id}`);
      toast.success("کلید حذف شد");
      onSuccess();
    } catch (error: any) {
      toast.error("خطا در حذف کلید");
    } finally {
      setLoading(false);
    }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>حذف کلید "{name}"</AlertDialogTitle>
          <AlertDialogDescription>
            این عملیات غیرقابل بازگشت است.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl bg-destructive hover:bg-destructive/90"
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// ─── بازسازی کلید ──────────────────────────────
const RegenerateKeyButton = ({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`/developer/api-keys/${id}/regenerate`);
      setNewKey(data.newKey || data.plainKey);
      toast.success("کلید جدید بازسازی شد");
      onSuccess();
    } catch (error: any) {
      toast.error("خطا در بازسازی کلید");
    } finally {
      setLoading(false);
    }
  };

  if (newKey) {
    return (
      <div className="flex flex-col gap-2">
        <NewKeyDisplay plainKey={newKey} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNewKey(null)}
          className="rounded-lg"
        >
          بستن
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRegenerate}
            disabled={loading}
            className="h-8 w-8 rounded-lg"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>بازسازی (Regenerate)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─── صفحه اصلی ──────────────────────────────────
export default function SuperAdminApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/developer/api-keys");
      setApiKeys(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      toast.error("خطا در دریافت لیست کلیدها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const filteredKeys = apiKeys.filter((k) =>
    k.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-6 max-w-[1400px] mx-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Key className="w-6 h-6 text-primary" />
              </div>
              مدیریت کلیدهای API
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              صدور، تست و مدیریت کلیدهای دسترسی برنامه‌نویسان
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchApiKeys}
              className="rounded-xl h-10 w-10"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <CreateApiKeyForm onSuccess={fetchApiKeys} />
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی کلید..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 bg-card rounded-xl border-border/60"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold">نام کلید</TableHead>
                <TableHead className="font-bold">پیشوند کلید</TableHead>
                <TableHead className="font-bold">دسترسی‌ها</TableHead>
                <TableHead className="font-bold text-center">
                  تعداد درخواست
                </TableHead>
                <TableHead className="font-bold">تاریخ انقضا</TableHead>
                <TableHead className="font-bold">وضعیت</TableHead>
                <TableHead className="text-center font-bold">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredKeys.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    هیچ کلید API یافت نشد.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKeys.map((key) => (
                  <TableRow
                    key={key.id}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="font-bold text-foreground">
                      {key.name}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded-md text-foreground">
                        {key.keyPrefix}****
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes?.map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-xs">
                      {formatNum(key.requestCount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {key.expiresAt
                        ? new Date(key.expiresAt).toLocaleDateString("fa-IR")
                        : "بدون انقضا"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          key.status === "active"
                            ? "default"
                            : key.status === "inactive"
                              ? "destructive"
                              : "secondary"
                        }
                        className="rounded-lg text-[11px]"
                      >
                        {key.status === "active"
                          ? "فعال"
                          : key.status === "inactive"
                            ? "غیرفعال"
                            : "منقضی"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <EditApiKeyForm apiKey={key} onSuccess={fetchApiKeys} />
                        <TestApiKeyDialog apiKeyName={key.name} />
                        <RegenerateKeyButton
                          id={key.id}
                          onSuccess={fetchApiKeys}
                        />
                        <DeleteKeyAlert
                          id={key.id}
                          name={key.name}
                          onSuccess={fetchApiKeys}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
