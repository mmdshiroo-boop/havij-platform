// frontend/app/(main)/panel/developer/notifications/page.tsx
"use client";

import { NotificationsList } from "@/components/notifcation/NotificationsList";

export default function DeveloperNotificationsPage() {
  return <NotificationsList userRole="developer" />;
}
