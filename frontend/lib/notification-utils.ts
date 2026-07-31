// frontend/lib/notification-utils.ts

export const PANEL_ROLES = [
  "user",
  "vip",
  "agent",
  "expert",
  "admin",
  "super-admin",
  "super_admin",
  "developer",
];

/**
 * دریافت نقش فعلی کاربر از ذخیره‌ساز محلی
 */
export const getUserRoleFromStorage = (): string => {
  if (typeof window === "undefined") return "user";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.role || "user";
    }
  } catch {}
  return "user";
};

/**
 * دریافت مسیر کامل صفحه اعلانات بر اساس نقش کاربر
 */
export const getNotificationRolePath = (role?: string): string => {
  const currentRole = role || getUserRoleFromStorage();
  // استانداردسازی فرمت نقش
  const normalizedRole = currentRole.replace("_", "-");

  const rolePaths: Record<string, string> = {
    user: "/panel/user/notifications",
    vip: "/panel/vip/notifications",
    agent: "/panel/agent/notifications",
    expert: "/panel/expert/notifications",
    admin: "/panel/admin/notifications",
    "super-admin": "/panel/super-admin/notifications",
    developer: "/panel/developer/notifications",
  };

  return rolePaths[normalizedRole] || "/panel/user/notifications";
};

/**
 * نرمال‌سازی هوشمند لینک اعلان‌ها جهت جلوگیری از ۴۰۴ و خطا در روت‌های پنل
 */
export const normalizeNotificationLink = (
  link?: string,
  role?: string,
): string => {
  if (!link) return "";
  const currentRole = role || getUserRoleFromStorage();
  const normalizedRole = currentRole.replace("_", "-");

  const path = link.startsWith("/") ? link.slice(1) : link;
  const segments = path.split("/");

  if (
    segments[0] === "panel" &&
    segments.length > 1 &&
    !PANEL_ROLES.includes(segments[1])
  ) {
    segments.splice(1, 0, normalizedRole);
  } else if (segments[0] === "admin" && segments[1] !== "panel") {
    segments.unshift("panel");
  } else if (
    (segments[0] === "super-admin" || segments[0] === "super_admin") &&
    segments[1] !== "panel"
  ) {
    segments.unshift("panel");
  }

  return "/" + segments.join("/");
};
