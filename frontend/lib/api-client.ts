// lib/api-client.ts
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Request Interceptor ──
apiClient.interceptors.request.use(
  (config) => {
    // حذف Content-Type برای FormData (تا مرورگر خودکار multipart را تنظیم کند)
    if (config.data instanceof FormData) {
      if (config.headers) {
        if (typeof config.headers.delete === "function") {
          config.headers.delete("Content-Type");
        } else {
          delete config.headers["Content-Type"];
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

// ── Response Interceptor ──
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register") ||
      error.config?.url?.includes("/auth/send-code") ||
      error.config?.url?.includes("/auth/verify-code") ||
      error.config?.url?.includes("/auth/forgot-password") ||
      error.config?.url?.includes("/auth/reset-password");

    const isAuthMeRoute = error.config?.url?.includes("/auth/me");
    const isOfflineRoute = error.config?.url?.includes("/locations/me/offline");
    const isUnauthorized = error.response?.status === 401;

    // ریدایرکت فقط برای نشست منقضی (نه login اشتباه)
    if (
      isUnauthorized &&
      typeof window !== "undefined" &&
      !isAuthMeRoute &&
      !isOfflineRoute &&
      !isAuthRoute
    ) {
      const message = error.response?.data?.message;
      if (message === "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.") {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (!window.location.pathname.includes("/auth")) {
          window.location.href = "/auth/login?reason=session_expired";
        }
        return Promise.reject(error);
      }
    }

    // لاگ فقط برای خطاهای واقعی (نه auth و offline)
    if (error.response && !isOfflineRoute && !isAuthRoute) {
      console.error(`❌ HTTP ${error.response.status} ${error.config?.url}`);
    }
    return Promise.reject(error);
  },
);

export default apiClient;