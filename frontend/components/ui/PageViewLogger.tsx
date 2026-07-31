"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_ID_KEY = "visitor_session_id";
const LAST_PATH_KEY = "last_visited_path"; // 🆕 کلید برای ذخیره آخرین مسیر

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId =
      crypto.randomUUID?.() || Math.random().toString(36).substring(2);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user?._id || null;
  } catch {
    return null;
  }
}

export default function PageViewLogger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const logPageView = async () => {
      try {
        const sessionId = getSessionId();
        const userId = getUserId();
        const fullPath =
          pathname +
          (searchParams?.toString() ? `?${searchParams.toString()}` : "");

        // 🆕 ترکیب document.referrer با آخرین مسیر ذخیره‌شده
        const externalReferrer = document.referrer || "";
        const lastPath = localStorage.getItem(LAST_PATH_KEY) || "";
        // اولویت با referrer خارجی (اگر وجود داشته باشد)، در غیر این صورت آخرین مسیر داخلی
        const referrer = externalReferrer || lastPath;

        const body: any = { path: fullPath, referrer, sessionId };
        if (userId) body.userId = userId;

        // 🆕 ذخیره مسیر فعلی برای بازدید بعدی
        localStorage.setItem(LAST_PATH_KEY, fullPath);

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/page-view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (error) {
        // silent
      }
    };

    logPageView();
  }, [pathname, searchParams]);

  return null;
}
