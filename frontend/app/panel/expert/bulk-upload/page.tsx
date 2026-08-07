"use client";

import { useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import { apiClient } from "@/services/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (f && f.name.endsWith(".zip")) {
      setFile(f);
      setResult(null);
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
    setProgress(0);
    const formData = new FormData();
    formData.append("zipFile", file);

    try {
      const res = await apiClient.post("/expert/bulk-ads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000, // ۱۰ دقیقه (چون واترمارک ممکن است طول بکشد)
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setProgress(pct);
          }
        },
      });
      setResult(res.data.data);
      toast.success(res.data.message || "تزریق با موفقیت انجام شد");
      setProgress(100);
    } catch (err: any) {
      if (err.code === "ECONNABORTED") {
        toast.error(
          "مدت زمان درخواست به پایان رسید. لطفاً فایل کوچک‌تری انتخاب کنید.",
        );
      } else {
        toast.error(err.response?.data?.message || "خطا در تزریق فایل");
      }
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            بارگذاری آگهی‌های فله‌ای
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            فایل ZIP شامل فایل‌های JSON دیوار یا شیپور را یک‌باره پردازش کنید.
          </p>
        </div>
        {file && !uploading && (
          <Button
            variant="default"
            onClick={handleUpload}
            className="rounded-lg gap-2 h-10 px-6 text-sm font-semibold"
          >
            <ArrowUp className="w-4 h-4" />
            شروع آپلود
          </Button>
        )}
        {file && uploading && (
          <Badge variant="secondary" className="h-10 px-5 text-sm font-medium">
            <Clock className="w-4 h-4 ml-2" />
            در حال پردازش...
          </Badge>
        )}
      </div>

      {/* Upload Area */}
      <Card className="border shadow-sm">
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
              dragOver && "bg-primary/5 border-primary/30",
            )}
          >
            {!file ? (
              <>
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5 ring-1 ring-border">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  فایل ZIP را اینجا بکشید و رها کنید
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  یا برای انتخاب فایل کلیک کنید
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg gap-2 text-xs"
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
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border">
                  <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                    <FileArchive className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="font-semibold text-sm truncate">
                      {file.name}
                    </p>
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

                {/* Progress */}
                {uploading && (
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        در حال آپلود
                      </span>
                      <span className="tabular-nums font-mono font-bold">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      لطفاً تا پایان عملیات صبر کنید
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                خلاصهٔ عملیات
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-500/5 shadow-none">
                <CardContent className="p-5">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
                  <p className="text-3xl font-bold text-emerald-700">
                    {result.success}
                  </p>
                  <p className="text-sm font-medium text-emerald-700/70">
                    موفق
                  </p>
                </CardContent>
              </Card>
              <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-500/5 shadow-none">
                <CardContent className="p-5">
                  <XCircle className="w-6 h-6 text-rose-600 mb-2" />
                  <p className="text-3xl font-bold text-rose-700">
                    {result.errors}
                  </p>
                  <p className="text-sm font-medium text-rose-700/70">خطا</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-500/5 shadow-none">
                <CardContent className="p-5">
                  <AlertTriangle className="w-6 h-6 text-amber-600 mb-2" />
                  <p className="text-3xl font-bold text-amber-700">
                    {result.skipped || 0}
                  </p>
                  <p className="text-sm font-medium text-amber-700/70">
                    رد شده
                  </p>
                </CardContent>
              </Card>
            </div>

            {result.details?.length > 0 && (
              <Card className="mt-6 border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">موارد خطا</h4>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {result.details.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-44 rounded-lg border bg-muted/10 p-3">
                    <ul className="space-y-2 text-sm">
                      {result.details.map((d: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded ml-1">
                            #{d.index ?? i + 1}
                          </span>
                          <span className="text-muted-foreground">
                            {d.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <div className="mt-5 flex justify-end">
              <Button
                variant="outline"
                onClick={clearFile}
                className="rounded-lg gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                بارگذاری فایل جدید
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
