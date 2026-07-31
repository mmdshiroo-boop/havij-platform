"use client";

import { useEffect, useState } from "react";
import axios from "@/services/api/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database,
  RefreshCw,
  Trash2,
  Plus,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Backup {
  filename: string;
  size: string;
  createdAt: string;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/super-admin/backups");
      if (data.success) {
        setBackups(data.data || []);
      } else {
        toast.error("خطا در دریافت بکاپ‌ها");
      }
    } catch (error) {
      toast.error("خطا در دریافت بکاپ‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const { data } = await axios.post("/super-admin/backups");
      if (data.success) {
        toast.success("بکاپ با موفقیت ایجاد شد");
        fetchBackups();
      } else {
        toast.error("خطا در ایجاد بکاپ");
      }
    } catch (error) {
      toast.error("خطا در ایجاد بکاپ");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const response = await axios.get(
        `/super-admin/backups/download/${filename}`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("خطا در دانلود فایل");
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    try {
      await axios.delete(`/super-admin/backups/${filename}`);
      toast.success("بکاپ حذف شد");
      fetchBackups();
    } catch (error) {
      toast.error("خطا در حذف بکاپ");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Database className="w-7 h-7 text-primary" />
            پشتیبان‌گیری
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            بکاپ‌های پایگاه داده را مدیریت کنید.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchBackups}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleCreateBackup}
            disabled={creating}
            className="gap-2"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {creating ? "در حال ایجاد..." : "ایجاد بکاپ جدید"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام فایل</TableHead>
              <TableHead>حجم</TableHead>
              <TableHead>تاریخ ایجاد</TableHead>
              <TableHead className="text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : backups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-muted-foreground"
                >
                  هیچ بکاپی وجود ندارد. اولین بکاپ را ایجاد کنید.
                </TableCell>
              </TableRow>
            ) : (
              backups.map((backup) => (
                <TableRow key={backup.filename}>
                  <TableCell className="font-mono text-sm">
                    {backup.filename}
                  </TableCell>
                  <TableCell className="text-sm">{backup.size}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(backup.createdAt).toLocaleDateString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(backup.filename)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
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
                            <AlertDialogTitle>
                              حذف بکاپ "{backup.filename}"
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              این عملیات غیرقابل بازگشت است.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteBackup(backup.filename)
                              }
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
