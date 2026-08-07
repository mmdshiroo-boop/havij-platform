"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileArchive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  Clock,
  ArrowUp,
  Trash2,
  Zap,
  Loader2,
} from "lucide-react";
import apiClient from "@/services/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
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
  return <span>{display.toLocaleString()}</span>;
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // درصد آپلود فایل
  const [processingProgress, setProcessingProgress] = useState(0); // درصد پردازش
  const [result, setResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (f && f.name.endsWith(".zip")) {
      setFile(f);
      setResult(null);
      setUploadProgress(0);
      setProcessingProgress(0);
      setTaskId(null);
    } else if (f) {
      toast.error("فقط فایل‌های ZIP مجاز هستند.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setResult(null);
    const formData = new FormData();
    formData.append("zipFile", file);

    try {
      const res = await apiClient.post("/expert/bulk-ads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(pct);
          }
        },
      });
      setTaskId(res.data.taskId);
      setUploadProgress(100);
      toast.success(res.data.message || "فایل دریافت شد. در حال پردازش...");
    } catch (err: any) {
      if (err.code === "ECONNABORTED") {
        toast.error("مدت زمان درخواست به پایان رسید.");
      } else {
        toast.error(err.response?.data?.message || "خطا در ارسال فایل");
      }
    } finally {
      setUploading(false);
    }
  };

  // Polling وضعیت تسک
  useEffect(() => {
    if (!taskId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await apiClient.get(`/expert/bulk-ads/${taskId}/status`);
        const task = data.data;
        if (task.status === "completed") {
          setResult(task.results);
          setProcessingProgress(100);
          toast.success("پردازش کامل شد");
          clearInterval(interval);
          setTaskId(null);
        } else if (task.status === "failed") {
          toast.error(task.error || "خطا در پردازش");
          clearInterval(interval);
          setTaskId(null);
        } else {
          // محاسبه درصد پیشرفت پردازش
          const progress = task.totalItems > 0
            ? Math.round((task.processed / task.totalItems) * 100)
            : 0;
          setProcessingProgress(progress);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [taskId]);

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
    setProcessingProgress(0);
    setTaskId(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* هدر */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              بارگذاری آگهی‌های فله‌ای
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              فایل ZIP شامل فایل‌های JSON دیوار یا شیپور را یک‌باره پردازش کنید
            </p>
          </div>
        </div>
        {file && !uploading && !taskId && (
          <Button
            onClick={handleUpload}
            className="rounded-xl gap-2 h-10 px-6 text-sm font-bold shadow-md shadow-primary/10"
          >
            <ArrowUp className="w-4 h-4" />
            شروع آپلود
          </Button>
        )}
        {file && uploading && (
          <Badge variant="secondary" className="h-10 px-5 text-sm font-bold border-border/60">
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            در حال ارسال...
          </Badge>
        )}
        {taskId && (
          <Badge variant="secondary" className="h-10 px-5 text-sm font-bold border-border/60">
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            در حال پردازش...
          </Badge>
        )}
      </motion.div>

      {/* ناحیهٔ آپلود */}
      <motion.div variants={itemVariants}>
        <Card
          className={cn(
            "border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm transition-all",
            dragOver && "ring-2 ring-primary/40 border-primary/30",
          )}
        >
          <CardContent className="p-0">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center py-14 px-6 transition-colors cursor-pointer",
                !file && "hover:bg-muted/20",
              )}
            >
              {!file ? (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5 ring-1 ring-border">
                    <Upload className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">
                    فایل ZIP را اینجا بکشید و رها کنید
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    یا برای انتخاب فایل کلیک کنید
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2 text-xs font-bold border-border/60 hover:bg-muted"
                  >
                    <FileArchive className="w-4 h-4" />
                    انتخاب فایل
                  </Button>
                </>
              ) : (
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-lg"
                >
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/30">
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

                  {/* Progress آپلود فایل */}
                  {uploading && (
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">آپلود فایل</span>
                        <span className="tabular-nums font-mono font-bold text-primary">
                          {uploadProgress}%
                        </span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Progress پردازش */}
                  {taskId && (
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">پردازش آگهی‌ها</span>
                        <span className="tabular-nums font-mono font-bold text-primary">
                          {processingProgress}%
                        </span>
                      </div>
                      <Progress value={processingProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {processingProgress < 100
                          ? "در حال بررسی و ذخیرهٔ آگهی‌ها..."
                          : "پردازش کامل شد"}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          handleFile(f);
        }}
      />

      {/* نتایج */}
      <AnimatePresence>
        {result && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-extrabold text-foreground">
                خلاصهٔ عملیات
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-emerald-600">
                      <AnimatedNumber value={result.success || 0} />
                    </p>
                    <p className="text-xs font-bold text-emerald-700/70 mt-1">موفق</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-500/20 bg-rose-500/5 shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-600">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-rose-600">
                      <AnimatedNumber value={result.errors || 0} />
                    </p>
                    <p className="text-xs font-bold text-rose-700/70 mt-1">خطا</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-amber-600">
                      <AnimatedNumber value={result.skipped || 0} />
                    </p>
                    <p className="text-xs font-bold text-amber-700/70 mt-1">رد شده</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.details?.length > 0 && (
              <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <h4 className="font-extrabold text-sm">موارد خطا</h4>
                    <Badge variant="secondary" className="text-[10px] h-5 font-bold">
                      {result.details.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-44 rounded-xl border border-border/40 bg-muted/10 p-3">
                    <ul className="space-y-2 text-sm">
                      {result.details.map((d: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded ml-1">
                            #{d.index ?? i + 1}
                          </span>
                          <span className="text-muted-foreground">{d.message}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={clearFile}
                className="rounded-xl gap-2 text-sm font-bold border-border/60 hover:bg-muted"
              >
                <Upload className="w-4 h-4" />
                بارگذاری فایل جدید
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}