// frontend/app/super-admin/notifications/page.tsx
"use client";

import { NotificationsList } from "@/components/notifcation/NotificationsList";

export default function SuperAdminNotificationsPage() {
  return <NotificationsList userRole="super_admin" />;
}
