"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/services/api/client"; // ← ایمپورت پیش‌فرض
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function VerifyHandler() {
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("در حال تایید پرداخت...");

  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;

    const authority =
      searchParams.get("Authority") || searchParams.get("authority");
    const paymentStatus =
      searchParams.get("Status") || searchParams.get("status");

    if (!authority || paymentStatus === "NOK") {
      setStatus("error");
      setMessage("پرداخت ناموفق بود یا لغو شد.");
      return;
    }

    hasProcessed.current = true;

    // ✅ استفاده از apiClient (توکن به‌طور خودکار اضافه می‌شود)
    apiClient
      .post("/subscriptions/verify", { authority })
      .then(async (res) => {
        const data = res.data;
        if (!data.success) throw new Error(data.message || "خطا در تایید");

        await refreshUser();
        window.dispatchEvent(new Event("user-updated"));

        setStatus("success");
        setMessage(
          data?.data?.alreadyActivated
            ? "اشتراک شما قبلاً فعال شده است."
            : "پرداخت موفق! نقش شما به VIP ارتقا یافت.",
        );
      })
      .catch((err) => {
        setStatus("error");
        const msg =
          err.response?.data?.message ||
          err.message ||
          "تایید پرداخت ناموفق بود.";
        setMessage(msg);
      });
  }, [searchParams, refreshUser]);

  return (
    <div
      className="flex items-center justify-center min-h-[70vh] px-4"
      dir="rtl"
    >
      <div className="text-center space-y-6 max-w-md w-full p-8 border rounded-xl shadow-sm bg-card">
        {status === "loading" && (
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
        )}
        {status === "success" && (
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
        )}
        {status === "error" && (
          <XCircle className="w-16 h-16 mx-auto text-destructive" />
        )}
        <h1 className="text-2xl font-bold">{message}</h1>
        {status !== "loading" && (
          <div className="flex flex-col gap-3 pt-4">
            <Button asChild size="lg">
              <Link href={status === "success" ? "/panel/vip" : "/pricing"}>
                {status === "success"
                  ? "ورود به پنل ویژه VIP"
                  : "بازگشت به اشتراک‌ها"}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PricingVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <VerifyHandler />
    </Suspense>
  );
}
