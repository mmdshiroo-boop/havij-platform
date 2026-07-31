// frontend/app/admin/notifications/page.tsx
"use client";

import { NotificationsList } from "@/components/notifcation/NotificationsList";


export default function AdminNotificationsPage() {
  return <NotificationsList userRole="admin" />;
}