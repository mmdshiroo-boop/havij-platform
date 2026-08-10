"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  FileArchive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  ArrowUp,
  Trash2,
  Zap,
  Loader2,
  XOctagon,
  Clock,
  RefreshCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { expertApi } from "@/services/api/expert.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_WAIT_MS = 10 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;
const MAX_FAILED_POLLS = 3;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 80 },
  },
};

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display.toLocaleString("fa-IR")}</span>;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pollFailedCount, setPollFailedCount] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimer = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => clearInterval(pollTimer.current);
  }, []);

const fetchTaskStatus = useCallback(async () => {
  if (!taskId) return;
  try {
    const data = await expertApi.getTaskStatus(taskId);
    setTaskStatus(data);
    setPollFailedCount(0);
    if (data.progress) {
      // محدود کردن درصد به ۱۰۰
      const pct = data.progress.percent || 0;
      setProgress(pct > 100 ? 100 : pct);
    }
    if (data.status === "completed" || data.status === "failed") {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (data.status === "completed") {
        toast.success("عملیات با موفقیت به پایان رسید. 🎉");
      } else {
        toast.error("پردازش با خطا مواجه شد.");
      }
    }
  } catch (err) {
    console.warn("دریافت وضعیت ناموفق:", err);
    setPollFailedCount((prev) => prev + 1);
  }
}, [taskId]);
  const stopPolling = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    toast.info("بررسی وضعیت متوقف شد. می‌توانید بعداً ادامه دهید.");
  };

  useEffect(() => {
    if (taskId && taskStatus?.status !== "completed" && taskStatus?.status !== "failed") {
      startTimeRef.current = Date.now();
      fetchTaskStatus();
      pollTimer.current = setInterval(() => {
        if (Date.now() - startTimeRef.current > MAX_WAIT_MS) {
          clearInterval(pollTimer.current);
          toast.error("مدت زمان پردازش طولانی شد. لطفاً دوباره تلاش کنید.");
          return;
        }
        fetchTaskStatus();
      }, POLL_INTERVAL_MS);
      return () => clearInterval(pollTimer.current);
    }
  }, [taskId, taskStatus?.status, fetchTaskStatus]);

  useEffect(() => {
    if (pollFailedCount >= MAX_FAILED_POLLS) {
      if (pollTimer.current) clearInterval(pollTimer.current);
      toast.error("ارتباط با سرور قطع شد. لطفاً وضعیت را دوباره بررسی کنید.");
    }
  }, [pollFailedCount]);

  const handleFile = useCallback((f: File | null) => {
    if (f && f.name.endsWith(".zip")) {
      setFile(f);
      setTaskId(null);
      setTaskStatus(null);
      setProgress(0);
      setPollFailedCount(0);
    } else if (f) {
      toast.error("فقط فایل‌های ZIP مجاز هستند.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("zipFile", file);
    try {
      const res = await expertApi.uploadBulkAds(formData);
      setTaskId(res.data.taskId);
      toast.success("فایل با موفقیت ارسال شد. پردازش در پس‌زمینه آغاز شد.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "خطا در ارسال فایل");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTaskId(null);
    setTaskStatus(null);
    setProgress(0);
    setPollFailedCount(0);
    clearInterval(pollTimer.current);
  };

  const isFinished = taskStatus?.status === "completed" || taskStatus?.status === "failed";
  const isProcessing = taskId && !isFinished;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen space-y-6 px-4 sm:px-6 lg:px-8 pb-10"
      dir="rtl"
    >
      {/* هدر */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-5 sm:p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-md shadow-primary/10">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                بارگذاری فله‌ای آگهی‌ها
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                فایل ZIP حاوی JSON را آپلود کنید، پردازش خودکار در پس‌زمینه
              </p>
            </div>
          </div>
          {file && !uploading && !taskId && (
            <Button
              onClick={handleUpload}
              className="rounded-xl gap-2 h-11 px-6 text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <ArrowUp className="w-4 h-4" />
              شروع آپلود و پردازش
            </Button>
          )}
          {(uploading || isProcessing) && (
            <Badge
              variant="secondary"
              className="h-11 px-5 text-sm font-bold border border-primary/20 bg-primary/5 text-primary"
            >
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              {uploading ? "در حال آپلود فایل..." : "در حال پردازش..."}
            </Badge>
          )}
        </div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/5 rounded-full blur-xl" />
      </motion.div>

      <AnimatePresence mode="wait">
        {!taskId && (
          <motion.div key="upload" variants={item}>
            <Card
              className={cn(
                "border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-background/60 backdrop-blur-sm transition-all",
                dragOver && "ring-2 ring-primary/40 border-primary/30 scale-[1.01]",
              )}
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-16 px-6 cursor-pointer"
              >
                {!file ? (
                  <>
                    <div className="h-20 w-20 rounded-2xl bg-muted/40 flex items-center justify-center mb-5 ring-1 ring-border shadow-inner">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      فایل ZIP را اینجا رها کنید
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      یا کلیک کنید تا فایل را انتخاب کنید
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2 text-sm font-bold border-border/60 hover:bg-muted/50"
                    >
                      <FileArchive className="w-4 h-4" />
                      انتخاب فایل ZIP
                    </Button>
                  </>
                ) : (
                  <motion.div
                    key="selected"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/10 border border-border/30">
                      <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                        <FileArchive className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-bold text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div key="processing" variants={item} className="space-y-5">
            <Card className="border border-border/50 bg-card/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  پیشرفت پردازش
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
      <circle
  className="text-primary stroke-current"
  strokeWidth="3"
  fill="none"
  cx="18"
  cy="18"
  r="15"
  strokeDasharray={`${Math.min(progress, 100) * 0.94} 94`}
  strokeLinecap="round"
/>
                <circle
  className="text-primary stroke-current"
  strokeWidth="3"
  fill="none"
  cx="18"
  cy="18"
  r="15"
  strokeDasharray={`${Math.min(progress, 100) * 0.94} 94`}
  strokeLinecap="round"
/>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {progress}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <Progress value={progress} className="h-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-lg font-black text-emerald-600">
                      <AnimatedNumber value={taskStatus?.progress?.success || 0} />
                    </p>
                    <p className="text-xs text-emerald-700/70 font-medium">موفق</p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <p className="text-lg font-black text-rose-600">
                      <AnimatedNumber value={taskStatus?.progress?.errors || 0} />
                    </p>
                    <p className="text-xs text-rose-700/70 font-medium">خطا</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-lg font-black text-amber-600">
                      <AnimatedNumber value={taskStatus?.progress?.skipped || 0} />
                    </p>
                    <p className="text-xs text-amber-700/70 font-medium">رد شده</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {taskStatus?.progress?.processed || 0} از{" "}
                    {taskStatus?.progress?.total || 0} پردازش شد
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopPolling}
                    className="text-xs gap-1 h-8"
                  >
                    <XOctagon className="w-3.5 h-3.5" />
                    توقف پیگیری
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isFinished && taskStatus && (
          <motion.div
            key="result"
            variants={item}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            <Card className="border border-border/50 bg-card/70 backdrop-blur-md shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  خلاصهٔ عملیات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="text-2xl font-black text-emerald-600">
                        <AnimatedNumber value={taskStatus.progress?.success || 0} />
                      </p>
                      <p className="text-xs font-medium text-emerald-700/70">آگهی موفق</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <XCircle className="w-6 h-6 text-rose-600" />
                    <div>
                      <p className="text-2xl font-black text-rose-600">
                        <AnimatedNumber value={taskStatus.progress?.errors || 0} />
                      </p>
                      <p className="text-xs font-medium text-rose-700/70">خطا</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="text-2xl font-black text-amber-600">
                        <AnimatedNumber value={taskStatus.progress?.skipped || 0} />
                      </p>
                      <p className="text-xs font-medium text-amber-700/70">رد شده</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {taskStatus.errorLog?.length > 0 && (
              <Card className="border border-border/50 shadow-sm rounded-2xl">
                <CardHeader
                  className="pb-2 cursor-pointer flex flex-row items-center justify-between"
                  onClick={() => setShowErrors(!showErrors)}
                >
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    موارد رد شده و خطاها
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {taskStatus.errorLog.length}
                    </Badge>
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    {showErrors ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </CardHeader>
                {showErrors && (
                  <CardContent>
                    <ScrollArea className="h-48 rounded-xl border border-border/40 bg-muted/10 p-3">
                      <ul className="space-y-2 text-sm">
                        {taskStatus.errorLog.map((entry: any, i: number) => {
                          const isSkip = entry.type === "skip";
                          return (
                            <li key={i} className="flex items-start gap-2">
                              {isSkip ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              )}
                              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                {entry.row}
                              </span>
                              <span className="text-muted-foreground">{entry.message}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                )}
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={clearFile}
                className="rounded-xl gap-2 text-sm font-bold shadow-md"
              >
                <RefreshCcw className="w-4 h-4" />
                بارگذاری فایل جدید
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
    </motion.div>
  );
}