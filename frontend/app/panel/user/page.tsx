"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function UserPanelIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // هدایت هوشمند و خودکار به داشبورد اصلی کاربر
    router.replace("/panel/user/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
      {/* هاله‌های نوری مینیمال در پس‌زمینه برای زیبایی بصری */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="text-center space-y-5 relative z-10 p-6 backdrop-blur-sm rounded-2xl border border-border/40 bg-background/40 max-w-xs shadow-xl shadow-black/5"
      >
        {/* لودینگ دو لایه مدرن */}
        <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-pulse" />
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold tracking-tight text-foreground">
            احراز دسترسی کاربری
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            در حال انتقال به داشبورد ملکی شما...
          </p>
        </div>
      </motion.div>
    </div>
  );
}
