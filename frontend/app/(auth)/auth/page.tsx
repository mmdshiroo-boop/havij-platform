"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useRegistrationGate } from "@/hooks/useRegistrationGate";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const { startWindow, isExpired, timeDisplay, message } =
    useRegistrationGate();

  const handleSuccess = () => {
    router.push("/");
  };

  // وقتی تب ثبت‌نام زده شد، تایمر شروع بشه
  const handleRegisterClick = () => {
    setMode("register");
    startWindow();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-[520px] bg-card border border-border rounded-3xl p-8 md:p-10 shadow-xl shadow-foreground/[0.015] relative overflow-hidden transition-all duration-300"
      dir="rtl"
    >
      {/* سوییچر تب‌ها */}
      <div className="relative flex p-1.5 bg-muted/50 rounded-2xl mb-10 border border-border/40">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`relative z-10 flex-1 py-3 text-xs md:text-sm font-black transition-colors duration-300 ${
            mode === "login"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ورود به حساب
        </button>
        <button
          type="button"
          onClick={handleRegisterClick}
          className={`relative z-10 flex-1 py-3 text-xs md:text-sm font-black transition-colors duration-300 ${
            mode === "register"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ثبت‌نام اولیه
        </button>
        <motion.div
          layoutId="activeTab"
          className="absolute top-1.5 bottom-1.5 right-1.5 left-1.5 bg-primary rounded-xl -z-0"
          style={{
            width: "calc(50% - 6px)",
            x: mode === "login" ? 0 : "-100%",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      </div>

      {/* تایمر ثبت‌نام */}
      {mode === "register" && !isExpired && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-600 text-xs font-bold p-3 rounded-xl text-center mb-4 flex items-center justify-center gap-2">
          <span>⏱️</span>
          <span>{message}</span>
        </div>
      )}

      {/* زمان تموم شد */}
      {mode === "register" && isExpired && (
        <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 text-sm font-bold p-5 rounded-2xl text-center max-w-sm leading-relaxed">
            <div className="text-3xl mb-3">⏰</div>
            <p>زمان ثبت‌نام به پایان رسید.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              لطفاً صفحه را ریلود کنید تا دوباره تلاش کنید.
            </p>
          </div>
        </div>
      )}

      {/* فرم‌ها */}
      {(mode === "login" || (mode === "register" && !isExpired)) && (
        <div className="relative min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {mode === "login" ? (
                <LoginForm
                  onSuccess={handleSuccess}
                  onRegisterClick={handleRegisterClick}
                />
              ) : (
                <RegisterForm
                  onSuccess={handleSuccess}
                  onLoginClick={() => setMode("login")}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
