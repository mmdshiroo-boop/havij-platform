"use client";

import { CookieAudit } from "@/types";
import { format, isValid } from "date-fns";
import { faIR } from "date-fns/locale";
import {
  Copy,
  X,
  ShieldAlert,
  Fingerprint,
  Globe,
  Monitor,
  Cookie,
  Clock,
  User,
  Smartphone,
  MapPin,
  Terminal,
  ChevronDown,
  Ban,
  LogIn,
  LogOut,
  RefreshCw,
  ScanSearch,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";
import { useState, ReactNode, ElementType } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api/client";
import { toast } from "sonner";

// ─── پیکربندی وضعیت و نوع رویداد ───
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: ElementType;
    color: string;
    bg: string;
    border: string;
    dot: string;
  }
> = {
  success: {
    label: "موفق",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "ناموفق",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800/40",
    dot: "bg-red-500",
  },
  expired: {
    label: "منقضی",
    icon: Timer,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/40",
    dot: "bg-amber-500",
  },
  revoked: {
    label: "باطل‌شده",
    icon: Ban,
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800/40",
    border: "border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  suspicious: {
    label: "مشکوک",
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800/40",
    dot: "bg-red-500 animate-pulse",
  },
};

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: ElementType; color: string; bg: string }
> = {
  login: {
    label: "ورود",
    icon: LogIn,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  logout: {
    label: "خروج",
    icon: LogOut,
    color: "text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-500/10",
  },
  token_refresh: {
    label: "تازه‌سازی توکن",
    icon: RefreshCw,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  session_check: {
    label: "بررسی نشست",
    icon: ScanSearch,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/10",
  },
  suspicious: {
    label: "مشکوک",
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-500/10",
  },
};

// ─── کامپوننت فیلد اطلاعاتی ───
function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
  copyable = false,
  copiedField,
  onCopy,
  iconColor = "text-orange-500",
}: {
  icon: ElementType;
  label: string;
  value?: string;
  mono?: boolean;
  copyable?: boolean;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  iconColor?: string;
}) {
  if (!value && !copyable) return null;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200",
        "bg-white/60 dark:bg-card/40 border border-border/30",
        "hover:bg-white dark:hover:bg-card/70 hover:shadow-sm hover:border-orange-200/60 dark:hover:border-orange-800/30",
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
          "bg-orange-50 dark:bg-orange-500/10 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20",
        )}
      >
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium mb-1">
          {label}
        </p>
        <p
          className={cn(
            "text-sm leading-relaxed",
            mono
              ? "font-mono text-xs tracking-wide text-foreground/90"
              : "font-semibold text-foreground",
          )}
          dir={mono ? "ltr" : "rtl"}
        >
          {value || "—"}
        </p>
      </div>
      {copyable && value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(value, label)}
          className={cn(
            "h-8 px-2.5 shrink-0 gap-1.5 rounded-lg transition-all",
            copiedField === label
              ? "text-emerald-600 bg-emerald-50"
              : "text-muted-foreground hover:text-orange-600 hover:bg-orange-50",
          )}
        >
          {copiedField === label ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">کپی شد!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">کپی</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── کامپوننت بخش قابل باز/بسته شدن ───
function CollapsibleSection({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
  badge,
  badgeColor = "",
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  badgeColor?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border/40 bg-white/40 dark:bg-card/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-right hover:bg-muted/30 transition-colors"
      >
        <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-orange-500" />
        </div>
        <span className="text-sm font-bold flex-1">{title}</span>
        {badge && (
          <Badge
            variant="outline"
            className={cn("text-[10px] px-2", badgeColor)}
          >
            {badge}
          </Badge>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───
export default function CookieAuditDetailModal({
  log,
  open,
  onClose,
}: {
  log?: CookieAudit | null;
  open: boolean;
  onClose: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  if (!log) return null;

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRevokeSession = async () => {
    if (!log.sessionId) return;
    if (
      !confirm(
        "آیا از باطل‌کردن این نشست اطمینان دارید؟ کاربر مجبور به ورود مجدد خواهد شد.",
      )
    )
      return;

    setRevoking(true);
    try {
      await apiClient.post("/super-admin/cookie-audits/revoke-session", {
        sessionId: log.sessionId,
      });
      toast.success("نشست با موفقیت باطل شد");
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "خطا در باطل‌سازی نشست";
      toast.error(errorMessage || "خطا در باطل‌سازی نشست");
    } finally {
      setRevoking(false);
    }
  };

  const statusKey = log.status || "success";
  const typeKey = log.type || "login";
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.success;
  const typeCfg = TYPE_CONFIG[typeKey] || TYPE_CONFIG.login;
  const StatusIcon = statusCfg.icon;
  const TypeIcon = typeCfg.icon;
  // حالا با اصلاح تایپ، "suspicious" معتبر است
  const isSuspicious = statusKey === "suspicious" || typeKey === "suspicious";

  let formattedDate = "—";
  if (log.createdAt) {
    const d = new Date(log.createdAt);
    if (isValid(d)) {
      try {
        formattedDate = format(d, "yyyy/MM/dd - HH:mm:ss", { locale: faIR });
      } catch {
        formattedDate = "—";
      }
    }
  }

  const isUserObject = log.userId && typeof log.userId === "object";
  const userDisplay = isUserObject
    ? (log.userId as { name?: string; phone?: string; _id?: string }).name ||
      (log.userId as { name?: string; phone?: string; _id?: string }).phone ||
      (log.userId as { name?: string; phone?: string; _id?: string })._id
    : String(log.userId || "");

  const hasUserObjName = isUserObject
    ? !!(log.userId as { name?: string }).name
    : false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-xl p-0 gap-0 flex flex-col rounded-2xl overflow-hidden bg-card text-card-foreground border-border max-h-[90vh]"
        dir="rtl"
      >
        {/* هدر مودال */}
        <div className="relative p-5 bg-gradient-to-l from-orange-500/15 via-orange-500/5 to-transparent border-b border-orange-200/50 dark:border-orange-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-xl border",
                  statusCfg.bg,
                  statusCfg.border,
                )}
              >
                <StatusIcon className={cn("w-5 h-5", statusCfg.color)} />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  جزئیات رویداد نشست
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  شناسه ثبت:{" "}
                  <span className="font-mono">{log._id || "—"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs gap-1.5 py-1 px-2.5 font-medium",
                  statusCfg.bg,
                  statusCfg.color,
                  statusCfg.border,
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", statusCfg.dot)} />
                {statusCfg.label}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* بدنه اسکرول‌پذیر */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[calc(90vh-130px)]">
          {isSuspicious && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-0.5">هشدار امنیت نشست</p>
                <p className="opacity-90">
                  این فعالیت به‌عنوان رفتار مشکوک یا غیرمجاز پرچم‌گذاری شده است.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <InfoRow icon={TypeIcon} label="نوع رویداد" value={typeCfg.label} iconColor={typeCfg.color} copiedField={copiedField} onCopy={copyToClipboard} />
            <InfoRow icon={Clock} label="زمان ثبت" value={formattedDate} copiedField={copiedField} onCopy={copyToClipboard} />
            <InfoRow icon={User} label="شناسه کاربر" value={userDisplay} mono={!hasUserObjName} copyable={!!log.userId} copiedField={copiedField} onCopy={copyToClipboard} />
            <InfoRow icon={Globe} label="آدرس IP" value={log.ip} mono copyable copiedField={copiedField} onCopy={copyToClipboard} />
          </div>

          <CollapsibleSection icon={Fingerprint} title="مشخصات نشست و کوکی" defaultOpen>
            <div className="space-y-2 pt-2">
              <InfoRow icon={Cookie} label="شناسه نشست (Session ID)" value={log.sessionId} mono copyable copiedField={copiedField} onCopy={copyToClipboard} />
              {log.tokenId && (
                <InfoRow icon={Terminal} label="توکن / کلید کوکی" value={log.tokenId} mono copyable copiedField={copiedField} onCopy={copyToClipboard} />
              )}
              {log.location && (
                <InfoRow
                  icon={MapPin}
                  label="موقعیت جغرافیایی"
                  value={
                    typeof log.location === "string"
                      ? log.location
                      : `${log.location.city || ""} ${log.location.country || ""}`.trim()
                  }
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection icon={Monitor} title="اطلاعات دستگاه و مرورگر" defaultOpen>
            <div className="space-y-2 pt-2">
              <InfoRow icon={Smartphone} label="مرورگر / دستگاه" value={log.device || log.userAgent} mono copyable copiedField={copiedField} onCopy={copyToClipboard} />
              {log.userAgent && log.device && (
                <InfoRow icon={Terminal} label="User-Agent" value={log.userAgent} mono copyable copiedField={copiedField} onCopy={copyToClipboard} />
              )}
            </div>
          </CollapsibleSection>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <CollapsibleSection icon={Terminal} title="متادیتا و جزییات فنی" defaultOpen={false}>
              <div className="pt-2">
                <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto text-left dir-ltr">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </CollapsibleSection>
          )}
        </div>

        <div className="p-4 bg-muted/30 border-t border-border/40 flex items-center justify-between gap-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRevokeSession}
            disabled={revoking || log.status === "revoked"}
            className="gap-2 rounded-xl text-xs font-semibold h-10 px-4"
          >
            {revoking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Ban className="w-4 h-4" />
            )}
            {log.status === "revoked" ? "نشست باطل شده" : "باطل‌سازی این نشست"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold h-10 px-5"
          >
            بستن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}