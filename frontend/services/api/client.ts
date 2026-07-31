import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

console.log("🔧 API Client initialized with baseURL:", API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true, // ← ارسال کوکی‌ها (برای احراز هویت مبتنی بر session)
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ اینترسپتور درخواست
apiClient.interceptors.request.use(
  (config) => {
    // 🔴 اصلاح هوشمند برای آپلود فایل:
    // اگر داده ارسالی از نوع FormData باشد، هدر Content-Type پیش‌فرض حذف می‌شود
    // تا مرورگر به صورت خودکار هدر مالتی‌پارت را به همراه Boundary درست تولید کند.
    if (config.data instanceof FormData) {
      if (config.headers) {
        if (typeof config.headers.delete === "function") {
          config.headers.delete("Content-Type");
        } else {
          delete config.headers["Content-Type"];
          delete config.headers["content-type"];
        }
      }
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ اینترسپتور پاسخ
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthMeRoute = error.config?.url?.includes("/auth/me");
    const isUnauthorized = error.response?.status === 401;

    // 🛑 فقط برای session expired ریدایرکت کن
    if (isUnauthorized && typeof window !== "undefined" && !isAuthMeRoute) {
      const message = error.response?.data?.message;

      if (message === "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.") {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (!window.location.pathname.includes("/auth")) {
          window.location.href = "/auth/login?reason=session_expired";
        }
        return Promise.reject(error);
      }

      console.warn("⚠️ 401 Unauthorized for:", error.config?.url);
      console.warn("⚠️ Message:", message);
    }

    // لاگ خطاها
    if (error.response) {
      console.error(`❌ HTTP ${error.response.status} ${error.config?.url}`);
      console.error("❌ Response data:", error.response.data);
      // برای خطاهای ۵۰۰، نمایش یک پیام واضح‌تر
      if (error.response.status === 500) {
        console.error(
          "💥 سرور دچار خطای داخلی شده است. لطفاً لاگ سرور را بررسی کنید.",
        );
      }
    } else if (error.request) {
      console.error("❌ No response received:", error.config?.url);
    } else {
      console.error("❌ Request error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
export { apiClient };
