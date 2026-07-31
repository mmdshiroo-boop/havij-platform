// frontend/services/api/notification.api.ts
import apiClient from "./client";

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  newAdAlerts: boolean;
  adStatusAlerts: boolean;
  messageAlerts: boolean;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "ad_submitted"
    | "ad_approved"
    | "ad_rejected"
    | "ad_expired"
    | "new_message"
    | "vip_upgrade"
    | "new_ad_pending"
    | "new_user_registered"
    | "new_user"
    | "user_reported"
    | "ad_reported"
    | "report_created" // 🆕
    | "user_banned"
    | "user_unbanned"
    | "ad_assigned"
    | "verification_request"
    | "new_lead"
    | "listing_inquiry"
    | "new_agent"
    | "property_submitted"
    | "new_property_pending"
    | "property_assigned"
    | "property_approved"
    | "property_rejected"
    | "property_updated"
    | "property_sold"
    | "system_alert"
    | "admin_action"
    | "revenue_milestone"
    | "backup_created"
    | "server_error"
    | "api_limit"
    | "deploy_success"
    | "ticket_created" // 🆕
    | "ticket_reply" // 🆕
    | "ticket_closed" // 🆕
    | "system";
  isRead: boolean;
  link?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    unreadCount: number;
  };
}

// ==================== تنظیمات اعلان ====================

export const getNotificationSettings =
  async (): Promise<NotificationSettings> => {
    try {
      const response = await apiClient.get("/notifications/settings");
      return response.data.data;
    } catch (error) {
      console.error("Error in getNotificationSettings:", error);
      return {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        newAdAlerts: true,
        adStatusAlerts: true,
        messageAlerts: true,
      };
    }
  };

export const updateNotificationSettings = async (
  settings: Partial<NotificationSettings>,
): Promise<NotificationSettings> => {
  const response = await apiClient.put("/notifications/settings", settings);
  return response.data.data;
};

// ==================== دریافت اعلان‌ها ====================

export const getNotifications = async (
  page: number = 1,
  limit: number = 20,
  filters?: { unreadOnly?: boolean; type?: string },
): Promise<NotificationsResponse["data"]> => {
  const response = await apiClient.get("/notifications", {
    params: { page, limit, ...filters },
  });
  return response.data.data;
};

export const getPriorityNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await apiClient.get("/notifications", {
      params: { limit: 10, page: 1 },
    });
    return response.data.data.notifications || [];
  } catch (error) {
    console.error("Error fetching priority notifications:", error);
    return [];
  }
};

// ==================== مدیریت خواندن اعلان‌ها ====================

export const markNotificationAsRead = async (
  id: string,
): Promise<Notification> => {
  const response = await apiClient.put(`/notifications/${id}/read`);
  return response.data.data;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.put("/notifications/read-all");
};

// ==================== حذف اعلان‌ها ====================

export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/notifications/${id}`);
};

export const deleteAllReadNotifications = async (): Promise<void> => {
  await apiClient.delete("/notifications/read/all");
};

// ==================== آمار اعلان‌ها ====================

export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get("/notifications", {
      params: { unreadOnly: true, limit: 1, page: 1 },
    });
    return response.data.data.unreadCount ?? 0;
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    return 0;
  }
};

// ==================== ارسال اعلان (فقط ادمین و کارشناس) ====================

export const sendNotification = async (data: {
  title: string;
  message: string;
  targetType: "all" | "single" | "role";
  userId?: string;
  targetRole?: string;
}) => {
  const response = await apiClient.post("/notifications/send", data);
  return response.data;
};
