// backend/src/middleware/chatSecurity.ts
import rateLimit from "express-rate-limit";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// ۱. تنظیم Rate Limiter
export const chatRateLimiter = rateLimit({
  windowMs: 10 * 1000, // ۱۰ ثانیه
  max: 10, // حداکثر ۱۰ درخواست
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.",
  },
});

// ۲. تنظیم DOMPurify برای پاکسازی XSS
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as any);

export const sanitizeMessage = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // هیچ تگ HTML مجاز نیست
    ALLOWED_ATTR: [], // هیچ attribute مجاز نیست
  });
};
