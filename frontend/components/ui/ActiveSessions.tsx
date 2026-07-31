// components/ActiveSessions.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { motion } from "framer-motion";
import {
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  LogOut,
  X,
  MapPin,
  Clock,
  MonitorSmartphone,
} from "lucide-react";
import apiClient from "@/services/api/client";

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

export default function ActiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );
  const [revokingAll, setRevokingAll] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/users/sessions");
      setSessions(response.data.data || []);
    } catch (error: any) {
      toast.error("خطا در دریافت نشست‌های فعال");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">نشست‌های فعال</h3>
        </div>
        {sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            onClick={handleRevokeAllOtherSessions}
            disabled={revokingAll}
          >
            {revokingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            خروج از همه دستگاه‌های دیگر
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          هیچ نشست فعالی یافت نشد.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                session.isCurrent
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/20 border-border/50 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`p-2 rounded-lg ${
                    session.isCurrent ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  {getDeviceIcon(session)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">
                      {session.device || "دستگاه ناشناخته"}
                    </span>
                    {session.isCurrent && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        این دستگاه
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3 h-3" /> {session.browser} /{" "}
                      {session.os}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> IP: {session.ip}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{" "}
                      {formatDate(session.lastActive)}
                    </div>
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 shrink-0"
                  onClick={() => openRevokeDialog(session)}
                  disabled={revokingSessionId === session._id}
                >
                  {revokingSessionId === session._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
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
                sessionToRevoke && handleRevokeSession(sessionToRevoke._id)
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
    </div>
  );
}
