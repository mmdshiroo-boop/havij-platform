"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Search,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 }, // ✅ اصلاح
    },
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary/5 via-background to-transparent border border-border/40 px-6 py-16 md:py-24 text-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto flex flex-col items-center"
      >
        <motion.div variants={itemVariants} className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            نسل جدید معاملات آنلاین و بی‌واسطه
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight max-w-3xl leading-[1.25] md:leading-[1.2]"
        >
          تجربه خرید و فروش{" "}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            آسان، سریع
          </span>{" "}
          و امن
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-6 text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl leading-relaxed"
        >
          به بزرگترین و هوشمندترین بازار آنلاین سراسر کشور بپیوندید. کالا یا
          خدمات خود را در کوتاه‌ترین زمان ممکن معرفی کنید و بی‌واسطه معامله
          کنید.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto"
        >
          <Link href="/search" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-xl px-7 h-12 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-bold gap-2 text-sm"
            >
              <Search className="w-4 h-4" />
              مشاهده و جستجوی آگهی‌ها
            </Button>
          </Link>

          <Link href="/create-ad" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto rounded-xl px-7 h-12 bg-background/60 hover:bg-muted border-border/80 font-bold gap-2 text-sm group"
            >
              <PlusCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              ثبت آگهی رایگان
              <ArrowLeft className="w-3.5 h-3.5 mr-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-12 pt-8 border-t border-border/30 w-full grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-muted-foreground max-w-3xl"
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>پشتیبانی ۲۴ ساعته</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>تایید سریع آگهی‌ها</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium col-span-2 sm:col-span-1">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>ارتباط مستقیم و بی‌واسطه</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
