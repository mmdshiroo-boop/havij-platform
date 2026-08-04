// frontend/lib/notification-utils.ts

export const PANEL_ROLES = [
  "user",
  "vip",
  "agent",
  "expert",
  "admin",
  "super-admin",
  "developer",
];

/**
 * دریافت نقش فعلی کاربر از localStorage
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
 * مسیر صفحه اعلانات بر اساس نقش کاربر
 */
export const getNotificationRolePath = (role?: string): string => {
  const currentRole = (role || getUserRoleFromStorage()).replace(/_/g, "-");

  const rolePaths: Record<string, string> = {
    user: "/panel/user/notifications",
    vip: "/panel/vip/notifications",
    agent: "/panel/agent/notifications",
    expert: "/panel/expert/notifications",
    admin: "/panel/admin/notifications",
    "super-admin": "/panel/super-admin/notifications",
    developer: "/panel/developer/notifications",
  };

  return rolePaths[currentRole] || "/panel/user/notifications";
};

/**
 * نرمال‌سازی لینک اعلان‌ها (جلوگیری از ۴۰۴)
 */
export const normalizeNotificationLink = (
  link?: string,
  role?: string,
): string => {
  if (!link) return "";
  const currentRole = (role || getUserRoleFromStorage()).replace(/_/g, "-");

  const path = link.startsWith("/") ? link.slice(1) : link;
  const segments = path.split("/");

  // اصلاح مسیرهایی که role ندارند
  if (
    segments[0] === "panel" &&
    segments.length > 1 &&
    !PANEL_ROLES.includes(segments[1])
  ) {
    segments.splice(1, 0, currentRole);
  } else if (segments[0] === "admin" && segments[1] !== "panel") {
    segments.unshift("panel");
  }

  return "/" + segments.join("/");
};

/**
 * فرمت تاریخ شمسی برای اعلان‌ها
 */
export const formatNotificationDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};