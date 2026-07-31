// app/panel/super-admin/webhooks/page.tsx
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
  Webhook,
  Search,
  RefreshCw,
  Eye,
  RotateCw,
  Play,
  CheckCircle,
  XCircle,
  Info,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// ─── تایپ Webhook (هماهنگ با پاسخ سرویس) ──────
interface WebhookData {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  status: "active" | "inactive" | "failed";
  lastTriggeredAt?: string;
  lastError?: string;
  deliveryCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
}

// رویدادهای قابل انتخاب با برچسب فارسی
const EVENT_OPTIONS = [
  { value: "ad.created", label: "ثبت آگهی جدید" },
  { value: "ad.updated", label: "ویرایش آگهی" },
  { value: "ad.deleted", label: "حذف آگهی" },
  { value: "ad.approved", label: "تأیید آگهی" },
  { value: "user.registered", label: "ثبت‌نام کاربر" },
  { value: "user.updated", label: "ویرایش پروفایل کاربر" },
];

// ─── نمایش Secret جدید ──────────────────────────
const SecretDisplay = ({ secret }: { secret: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success("Secret کپی شد");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("کپی ناموفق");
    }
  };
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
      <code className="text-xs flex-1 break-all">{secret}</code>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        <Copy className="w-3.5 h-3.5 ml-1" />
        {copied ? "کپی شد" : "کپی"}
      </Button>
    </div>
  );
};

// ─── فرم ایجاد Webhook ─────────────────────────
const CreateWebhookForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || events.length === 0) return;
    setLoading(true);
    try {
      const payload = { name: name.trim(), url: url.trim(), events };
      const { data } = await axios.post("/developer/webhooks", payload);
      if (data.webhook?.secret) {
        setNewSecret(data.webhook.secret);
        toast.success("Webhook ساخته شد. Secret را ذخیره کنید.");
      } else {
        toast.success("Webhook ایجاد شد");
        handleClose();
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ایجاد Webhook");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setName("");
    setUrl("");
    setEvents([]);
    setNewSecret(null);
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
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> ایجاد Webhook جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            ایجاد Webhook جدید
          </DialogTitle>
        </DialogHeader>
        {newSecret ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Webhook با موفقیت ساخته شد. Secret زیر فقط یک بار نمایش داده
              می‌شود. آن را ذخیره کنید.
            </p>
            <SecretDisplay secret={newSecret} />
            <Button
              className="w-full"
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
              <Label htmlFor="wh-name">نام</Label>
              <Input
                id="wh-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثلاً اطلاع‌رسانی آگهی جدید"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-url">آدرس URL</Label>
              <Input
                id="wh-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://example.com/webhook"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>رویدادها</Label>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_OPTIONS.map((ev) => (
                  <div key={ev.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`event-${ev.value}`}
                      checked={events.includes(ev.value)}
                      onCheckedChange={(checked) => {
                        if (checked) setEvents([...events, ev.value]);
                        else setEvents(events.filter((e) => e !== ev.value));
                      }}
                    />
                    <Label htmlFor={`event-${ev.value}`} className="text-sm">
                      {ev.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                انصراف
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "در حال ایجاد..." : "ایجاد"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── ویرایش Webhook ────────────────────────────
const EditWebhookForm = ({
  webhook,
  onSuccess,
}: {
  webhook: WebhookData;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(webhook.name);
  const [url, setUrl] = useState(webhook.url);
  const [events, setEvents] = useState<string[]>(webhook.events);
  const [status, setStatus] = useState(webhook.status);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(webhook.name);
    setUrl(webhook.url);
    setEvents(webhook.events);
    setStatus(webhook.status);
  }, [webhook, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.patch(`/developer/webhooks/${webhook.id}`, {
        name: name.trim(),
        url: url.trim(),
        events,
        status,
      });
      toast.success("Webhook بروزرسانی شد");
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ویرایش Webhook</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>نام</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>آدرس URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>رویدادها</Label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_OPTIONS.map((ev) => (
                <div key={ev.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-event-${ev.value}`}
                    checked={events.includes(ev.value)}
                    onCheckedChange={(checked) => {
                      if (checked) setEvents([...events, ev.value]);
                      else setEvents(events.filter((e) => e !== ev.value));
                    }}
                  />
                  <Label htmlFor={`edit-event-${ev.value}`}>{ev.label}</Label>
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={loading}>
              ذخیره
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── تست Webhook ──────────────────────────────
const TestWebhookDialog = ({ webhook }: { webhook: WebhookData }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await axios.post(
        `/developer/webhooks/${webhook.id}/test`,
      );
      setResult({ success: true, message: data.message || "ارسال موفق" });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.error || "خطا در تست",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
          <Play className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تست Webhook: {webhook.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {result ? (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {result.message}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              با کلیک روی دکمه زیر یک درخواست آزمایشی به آدرس {webhook.url}{" "}
              ارسال می‌شود.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              بستن
            </Button>
            <Button onClick={handleTest} disabled={loading}>
              {loading ? "در حال ارسال..." : "ارسال تست"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── بازسازی Secret ───────────────────────────
const RegenerateSecretDialog = ({
  id,
  name,
  onSuccess,
}: {
  id: string;
  name: string;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `/developer/webhooks/${id}/regenerate-secret`,
      );
      setNewSecret(data.secret);
      toast.success("Secret جدید تولید شد");
    } catch (error: any) {
      toast.error("خطا در بازسازی Secret");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Key className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>بازسازی Secret برای {name}</DialogTitle>
        </DialogHeader>
        {newSecret ? (
          <div className="space-y-3">
            <SecretDisplay secret={newSecret} />
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false);
                onSuccess();
              }}
            >
              تأیید
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Secret جدید جایگزین قبلی می‌شود. درخواست‌های امضا‌شده با Secret
              قدیمی نامعتبر خواهند شد.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                انصراف
              </Button>
              <Button onClick={handleRegenerate} disabled={loading}>
                بازسازی
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── حذف Webhook ─────────────────────────────
const DeleteWebhookAlert = ({
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
      await axios.delete(`/developer/webhooks/${id}`);
      toast.success("Webhook حذف شد");
      onSuccess();
    } catch (error: any) {
      toast.error("خطا در حذف");
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
          className="h-8 w-8 text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف Webhook "{name}"</AlertDialogTitle>
          <AlertDialogDescription>
            این عملیات غیرقابل بازگشت است.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// ─── صفحه اصلی ──────────────────────────────────
export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/developer/webhooks");
      setWebhooks(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      toast.error("خطا در دریافت Webhookها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const filteredWebhooks = webhooks.filter(
    (wh) =>
      wh.name.toLowerCase().includes(search.toLowerCase()) ||
      wh.url.toLowerCase().includes(search.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge>فعال</Badge>;
      case "inactive":
        return <Badge variant="destructive">غیرفعال</Badge>;
      case "failed":
        return <Badge variant="secondary">ناموفق</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Webhook className="w-7 h-7 text-primary" />
              مدیریت Webhookها
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              دریافت خودکار رویدادهای سیستم در URLهای تعیین‌شده.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchWebhooks}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <CreateWebhookForm onSuccess={fetchWebhooks} />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">نام</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>رویدادها</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className="text-center">تحویل</TableHead>
                <TableHead className="text-center">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredWebhooks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    هیچ Webhook ای یافت نشد.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWebhooks.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-bold">{wh.name}</TableCell>
                    <TableCell className="text-xs dir-ltr text-left">
                      {wh.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {wh.events.map((ev) => (
                          <Badge
                            key={ev}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {EVENT_OPTIONS.find((e) => e.value === ev)?.label ||
                              ev}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(wh.status)}</TableCell>
                    <TableCell className="text-center text-xs">
                      <span className="text-green-600">{wh.successCount}</span>
                      <span className="mx-1">/</span>
                      <span className="text-red-600">{wh.failureCount}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <EditWebhookForm
                          webhook={wh}
                          onSuccess={fetchWebhooks}
                        />
                        <TestWebhookDialog webhook={wh} />
                        <RegenerateSecretDialog
                          id={wh.id}
                          name={wh.name}
                          onSuccess={fetchWebhooks}
                        />
                        <DeleteWebhookAlert
                          id={wh.id}
                          name={wh.name}
                          onSuccess={fetchWebhooks}
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
