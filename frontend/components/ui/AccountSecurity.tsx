"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, Lock, KeyRound, Loader2 } from "lucide-react";
import ActiveSessions from "@/components/ui/ActiveSessions";
import apiClient from "@/services/api/client";

export default function AccountSecurity() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      toast.error("لطفاً رمز عبور فعلی و جدید (حداقل ۶ کاراکتر) را وارد کنید");
      return;
    }
    setChanging(true);
    try {
      await apiClient.put("/users/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در تغییر رمز عبور");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-base">امنیت حساب</h3>
      </div>

      {/* تغییر رمز عبور */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">تغییر رمز عبور</h4>
        </div>
        {!showPasswordForm ? (
          <Button
            variant="outline"
            onClick={() => setShowPasswordForm(true)}
            className="gap-2 rounded-xl h-10"
          >
            <KeyRound className="w-4 h-4" /> تغییر رمز عبور
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">رمز عبور فعلی</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-10 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                رمز عبور جدید (حداقل ۶ کاراکتر)
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleChangePassword}
                disabled={changing}
                className="gap-2 rounded-xl h-10 bg-primary hover:bg-primary/90"
              >
                {changing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                ذخیره رمز جدید
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasswordForm(false)}
                className="rounded-xl h-10"
              >
                انصراف
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <Separator />

      {/* نشست‌های فعال */}
      <ActiveSessions />
    </div>
  );
}
