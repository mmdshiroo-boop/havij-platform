"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import apiClient from "@/services/api/client";
import { AlertTriangle } from "lucide-react";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: "ad" | "property" | "user";
  targetId: string;
  targetTitle?: string;
}

const REPORT_TYPES: Record<string, string> = {
  spam: "هرزنامه / اسپم",
  fraud: "کلاهبرداری",
  fake: "آگهی جعلی",
  offensive: "محتوای نامناسب",
  illegal: "محتوای غیرقانونی",
  duplicate: "آگهی تکراری",
  wrong_category: "دسته‌بندی اشتباه",
  other: "سایر",
};

export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!type) {
      toast.error("لطفاً نوع تخلف را انتخاب کنید");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/reports", {
        targetType,
        targetId,
        type,
        description: description.trim() || undefined,
      });

      toast.success("گزارش شما با موفقیت ثبت شد. متشکریم.");
      setType("");
      setDescription("");
      onClose();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "خطا در ثبت گزارش. لطفاً دوباره تلاش کنید.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const targetLabel =
    targetType === "ad" ? "آگهی" : targetType === "property" ? "ملک" : "کاربر";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            گزارش تخلف
          </DialogTitle>
          <DialogDescription>
            {targetTitle
              ? `گزارش ${targetLabel} «${targetTitle}»`
              : `گزارش ${targetLabel}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="report-type">نوع تخلف</Label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="انتخاب نوع تخلف" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-desc">توضیحات (اختیاری)</Label>
            <Textarea
              id="report-desc"
              placeholder="توضیحات بیشتر دربارهٔ این تخلف..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-left">
              {description.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "در حال ارسال..." : "ارسال گزارش"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
